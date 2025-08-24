import { Injectable, Logger } from '@nestjs/common';
import { $ } from 'bun';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { NmapScanSpeed } from '../parser/scanner.type.nmap';

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

  async runFscanScan(target: string, threads: number = 200): Promise<string> {
    const logFileName = `./log/fscan_${this.UUID()}.json`;
    this.logger.log(
      `executing fscan scan: ${target}, command: sudo -n ${this.fscanPath} -h ${target} -t ${threads} -fingerprint -log ALL -nopoc -nobr -f json -o ${logFileName}`,
    );
    await $`sudo -n ${this.fscanPath} -h ${target} -t ${threads} -fingerprint -log ALL -nopoc -nobr -f json -o ${logFileName}`.text();
    return logFileName;
  }

  async runNmapScan(
    target: string,
    timeout: number = 90,
    ports: number[] = [],
    speed: NmapScanSpeed = NmapScanSpeed.Aggressive,
  ): Promise<string> {
    const scanPorts = ports.length > 0 ? ports.join(',') : '1-65535';
    const logFileName = `./log/nmap_${this.UUID()}.xml`;
    this.logger.log(
      `executing nmap scan: ${target}, command: sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`,
    );
    await $`sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`.text();
    return logFileName;
  }

  private UUID(): string {
    return `${this.getYYDDMMHHMM()}-${crypto.randomUUID()}`;
  }

  private getYYDDMMHHMM(date = new Date()): string {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return year + month + day + hours + minutes;
  }
}
