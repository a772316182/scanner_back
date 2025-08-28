import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { $ } from 'bun';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { NmapScanSpeed } from '../parser/scanner.type.nmap';
import { ScannerTaskExecuteResult } from './scanner.type';
import { DaoService } from '../dao/dao.service';
import { ParserFscanService } from '../parser/parser.fscan.service';
import { ParserNmapService } from '../parser/parser.nmap.service';
import { TaskStatus } from '../dao/dao.type';

@Injectable()
export class ScannerService {
  private readonly nmapPath: string;
  private readonly fscanPath: string;
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private readonly daoService: DaoService,
    private readonly parserFscanService: ParserFscanService,
    private readonly parserNmapService: ParserNmapService,
  ) {
    const rawFscanPath = process.env.FSCAN_PATH_LINUX || '/usr/local/bin/fscan';
    const rawNmapPath = process.env.NMAP_PATH_LINUX || '/usr/local/bin/nmap';

    // 先检查是否存在，再解析为绝对路径，避免 realpathSync 在不存在时抛 ENOENT
    if (!fs.existsSync(rawFscanPath)) {
      throw new Error(`fscan executable not found at path: ${rawFscanPath}`);
    }
    if (!fs.existsSync(rawNmapPath)) {
      throw new Error(`Nmap executable not found at path: ${rawNmapPath}`);
    }

    this.fscanPath = fs.realpathSync(rawFscanPath);
    this.nmapPath = fs.realpathSync(rawNmapPath);

    this.logger.debug(`current setting path of fscan: ${this.fscanPath}`);
    this.logger.debug(`current setting path of nmap: ${this.nmapPath}`);

    // 检查是否允许无密码执行指定命令，避免因被测程序退出码非 0 导致误报
    try {
      this.logger.debug(
        'checking sudo passwordless execution for nmap and fscan...',
      );
      execSync(`sudo -n -l -- ${this.nmapPath}`, { stdio: 'ignore' });
      execSync(`sudo -n -l -- ${this.fscanPath}`, { stdio: 'ignore' });
      this.logger.log(
        'Sudo passwordless execution check passed for nmap and fscan.',
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sudo passwordless execution check failed: ${msg}`);
      throw new Error(
        `Passwordless sudo is required for nmap and fscan.
        Please configure /etc/sudoers to allow the current user to run these commands without a password.
        Example for nmap: ${process.env.USER} ALL=(ALL) NOPASSWD: ${this.nmapPath}
        Example for fscan: ${process.env.USER} ALL=(ALL) NOPASSWD: ${this.fscanPath}`,
      );
    }
  }

  runDIYCommand(command: string, UUID: string): ScannerTaskExecuteResult {
    const logFileName = `./log/diy_${UUID}.log`;
    this.logger.log(
      `executing diy command: ${command}, log file: ${logFileName}`,
    );

    this.daoService.updateTaskStatus(UUID, TaskStatus.IN_PROGRESS);

    $`sudo -n bash -c ${command} > ${logFileName} 2>&1`
      .text()
      .then(async () => {
        this.logger.log(`DIY command for task ${UUID} completed.`);
        // For DIY commands, we can't parse results in a structured way.
        // We'll just mark it as completed.
        await this.daoService.submitTaskResults(UUID, {
          message: 'DIY command executed successfully.',
          logFile: logFileName,
        });
      })
      .catch(async (error) => {
        this.logger.error(`DIY command for task ${UUID} failed.`, error.stack);
        await this.daoService.updateTaskStatus(UUID, TaskStatus.FAILED);
      });

    return {
      taskId: UUID,
      logFilePath: logFileName,
      command: command,
    };
  }

  runFscanScan(
    target: string,
    UUID: string,
    threads: number = 200,
  ): ScannerTaskExecuteResult {
    const logFileName = `./log/fscan_${UUID}.json`;
    const command = `sudo -n ${this.fscanPath} -h ${target} -t ${threads} -fingerprint -log ALL -nopoc -nobr -f json -o ${logFileName}`;
    this.logger.log(`executing fscan scan: ${target}, command: ${command}`);

    this.daoService.updateTaskStatus(UUID, TaskStatus.IN_PROGRESS);

    $`${command}`
      .text()
      .then(async () => {
        this.logger.log(`Fscan scan for task ${UUID} completed.`);
        const results =
          await this.parserFscanService.parseFscanLogfile(logFileName);
        await this.daoService.submitTaskResults(UUID, results);
      })
      .catch(async (error) => {
        this.logger.error(`Fscan scan for task ${UUID} failed.`, error.stack);
        await this.daoService.updateTaskStatus(UUID, TaskStatus.FAILED);
      });

    return {
      taskId: UUID,
      logFilePath: logFileName,
      command: command,
    };
  }

  runNmapScan(
    target: string,
    UUID: string,
    timeout: number = 90,
    ports: number[] = [],
    speed: NmapScanSpeed = NmapScanSpeed.Aggressive,
  ): ScannerTaskExecuteResult {
    const scanPorts = ports.length > 0 ? ports.join(',') : '1-65535';
    const logFileName = `./log/nmap_${UUID}.xml`;
    const command = `sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`;
    this.logger.log(`executing nmap scan: ${target}, command: ${command}`);

    this.daoService.updateTaskStatus(UUID, TaskStatus.IN_PROGRESS);

    $`${command}`
      .text()
      .then(async () => {
        this.logger.log(`Nmap scan for task ${UUID} completed.`);
        const results =
          await this.parserNmapService.parseNmapLogfile(logFileName);
        await this.daoService.submitTaskResults(UUID, results);
      })
      .catch(async (error) => {
        this.logger.error(`Nmap scan for task ${UUID} failed.`, error.stack);
        await this.daoService.updateTaskStatus(UUID, TaskStatus.FAILED);
      });

    return {
      taskId: UUID,
      logFilePath: logFileName,
      command: command,
    };
  }
}
