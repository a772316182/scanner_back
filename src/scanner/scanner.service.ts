import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
import { $ } from 'bun';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { NmapScanSpeed } from '../parser/scanner.type.nmap';
import { ScannerTaskExecuteResult } from './scanner.type';

@Injectable()
export class ScannerService {
  private readonly nmapPath: string;
  private readonly fscanPath: string;
  private readonly logger = new Logger(ScannerService.name);

  constructor() {
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

  async runDIYCommand(
    command: string,
    UUID: string,
  ): Promise<ScannerTaskExecuteResult> {
    const logFileName = `./log/diy_${UUID}.log`;
    this.logger.log(
      `executing diy command: ${command}, log file: ${logFileName}`,
    );
    await $`sudo -n bash -c ${command} > ${logFileName} 2>&1`.text();
    return {
      taskId: UUID,
      logFilePath: logFileName,
      command: command,
    };
  }

  async runFscanScan(
    target: string,
    UUID: string,
    threads: number = 200,
  ): Promise<ScannerTaskExecuteResult> {
    const logFileName = `./log/fscan_${UUID}.json`;
    this.logger.log(
      `executing fscan scan: ${target}, command: sudo -n ${this.fscanPath} -h ${target} -t ${threads} -fingerprint -log ALL -nopoc -nobr -f json -o ${logFileName}`,
    );
    await $`sudo -n ${this.fscanPath} -h ${target} -t ${threads} -fingerprint -log ALL -nopoc -nobr -f json -o ${logFileName}`.text();
    return {
      taskId: UUID,
      logFilePath: logFileName,
      command: `sudo -n ${this.fscanPath} -h ${target} -t ${threads} -fingerprint -log ALL -nopoc -nobr -f json -o ${logFileName}`,
    };
  }

  async runNmapScan(
    target: string,
    UUID: string,
    timeout: number = 90,
    ports: number[] = [],
    speed: NmapScanSpeed = NmapScanSpeed.Aggressive,
  ): Promise<ScannerTaskExecuteResult> {
    const scanPorts = ports.length > 0 ? ports.join(',') : '1-65535';
    const logFileName = `./log/nmap_${UUID}.xml`;
    this.logger.log(
      `executing nmap scan: ${target}, command: sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`,
    );
    await $`sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`.text();

    return {
      taskId: UUID,
      logFilePath: logFileName,
      command: `sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`,
    };
  }
}
