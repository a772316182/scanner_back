import { Injectable, Logger } from '@nestjs/common';
import { $ } from 'bun';
import * as fs from 'fs'; // 导入 Node.js 的文件系统模块
import { NmapScanSpeed } from './scanner.type';

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
    if (process.env.USER !== 'root') {
      try {
        $`sudo -n ${this.nmapPath} -V`;
        $`sudo -n ${this.fscanPath} -h`;
        this.logger.log('Sudo passwordless execution check passed for nmap and fscan.');
      } catch (error) {
        // 如果 execSync 抛出错误，通常意味着 `sudo -n` 执行失败，需要密码。
        this.logger.error('Sudo passwordless execution check failed:', error.message);
        throw new Error(
          `Passwordless sudo is required for nmap and fscan.
           Please configure /etc/sudoers in the tail to allow the current user to run these commands without a password.
           Example for nmap: ${process.env.USER} ALL=(ALL) NOPASSWD: ${this.nmapPath}
           Example for fscan: ${process.env.USER} ALL=(ALL) NOPASSWD: ${this.fscanPath}`
        );
      }
    }
  }

  async runFscanScan(target: string, threads: number = 200): Promise<string> {
    return await $`sudo -n ${this.fscanPath} -h ${target} -nopoc -nobr -f json -t ${threads} -p ${threads}`.text();
  }

  async runNmapScan(
    target: string,
    threads: number = 200,
    speed: NmapScanSpeed = NmapScanSpeed.Aggressive
  ): Promise<string> {
    return await $`sudo -n ${this.nmapPath} -sS -p- ${target} --min-parallelism ${threads} -T${speed}`.text();
  }
}