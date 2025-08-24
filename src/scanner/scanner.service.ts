import { Injectable, Logger } from '@nestjs/common';
import { $ } from 'bun';
import * as fs from 'fs'; // 导入 Node.js 的文件系统模块
import { NmapScanSpeed } from '../parser/scanner.type.nmap';

@Injectable()
export class ScannerService {
  private readonly nmapPath: string;
  private readonly fscanPath: string;
  private readonly logger = new Logger(ScannerService.name);

  constructor() {
    this.fscanPath = process.env.FSCAN_PATH_LINUX || '/usr/local/bin/fscan';
    this.nmapPath = process.env.NMAP_PATH_LINUX || '/usr/local/bin/nmap';

    // 解析为绝对路径
    this.fscanPath = fs.realpathSync(this.fscanPath);
    this.nmapPath = fs.realpathSync(this.nmapPath);

    this.logger.debug(`current setting path of fscan: ${this.fscanPath}`);
    this.logger.debug(`current setting path of nmap: ${this.nmapPath}`);

    // 检查文件是否存在
    if (!fs.existsSync(this.nmapPath)) {
      throw new Error(`Nmap executable not found at path: ${this.nmapPath}`);
    }
    if (!fs.existsSync(this.fscanPath)) {
      throw new Error(`fscan executable not found at path: ${this.fscanPath}`);
    }

    // 检查文件是否可以用sudo无密码直接执行
    try {
      $`sudo -n ${this.nmapPath} -V`;
      $`sudo -n ${this.fscanPath} -h`;
      this.logger.log(
        'Sudo passwordless execution check passed for nmap and fscan.',
      );
    } catch (error) {
      // 如果 execSync 抛出错误，通常意味着 `sudo -n` 执行失败，需要密码。
      this.logger.error(
        'Sudo passwordless execution check failed:',
        error.message,
      );
      throw new Error(
        `Passwordless sudo is required for nmap and fscan.
           Please configure /etc/sudoers in the tail to allow the current user to run these commands without a password.
           Example for nmap: ${process.env.USER} ALL=(ALL) NOPASSWD: ${this.nmapPath}
           Example for fscan: ${process.env.USER} ALL=(ALL) NOPASSWD: ${this.fscanPath}`,
      );
    }
  }

  async runFscanScan(target: string, threads: number = 200): Promise<string> {
    const logFileName = `./log/fscan_${this.UUID()}.json`;
    this.logger.log(`executing fscan scan: ${target}, command: sudo -n ${this.fscanPath} -h ${target} -t ${threads} -fingerprint -log ALL -nopoc -nobr -f json -o ${logFileName}`);
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
    this.logger.log(`executing nmap scan: ${target}, command: sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`);
    await $`sudo -n ${this.nmapPath} -n ${target} --host-timeout ${timeout}s -O --osscan-guess -sS -p ${scanPorts} -T${speed} -oX ${logFileName}`.text();
    return logFileName;
  }

  UUID(): string {
    return `${this.getYYDDMMHHMM()}-${crypto.randomUUID()}`;
  }

  getYYDDMMHHMM(date = new Date()): string {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return year + month + day + hours + minutes;
  }
}
