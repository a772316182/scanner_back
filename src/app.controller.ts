import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ScannerService } from './scanner/scanner.service';
import { ParserFscanService } from './parser/parser.fscan.service';
import { ParserNmapService } from './parser/parser.nmap.service';
import { FscanLogEntry } from './parser/scanner.type.fscan';
import { NmapRun } from './parser/scanner.type.nmap';
import { AppService } from './app.service';
import { DaoService } from './dao/dao.service';

@Controller('scanner')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly scannerService: ScannerService,
    private readonly parserFscanService: ParserFscanService,
    private readonly parserNmapService: ParserNmapService,
    private readonly appService: AppService,
    private readonly daoService: DaoService,
  ) {}

  /**
   * 执行预定义的 Fscan 扫描任务。
   * @param target 扫描目标
   * @returns FscanLogEntry[] 扫描结果日志条目数组
   */
  @Get('/fscan')
  async runPredefinedFscan(
    @Query('target') target: string,
  ): Promise<FscanLogEntry[]> {
    const taskUUID = this.appService.generateUUID();

    this.logger.log(`Fscan scan requested for target: ${target}`);
    const scannerTaskExecuteResult = await this.scannerService.runFscanScan(
      target,
      taskUUID,
    );

    this.daoService.createTask(
      taskUUID,
      scannerTaskExecuteResult.command,
      scannerTaskExecuteResult.logFilePath,
      this.runPredefinedFscan.name,
    );

    return this.parserFscanService.parseFscanLogfile(
      scannerTaskExecuteResult.logFilePath,
    );
  }

  @Get('/diy')
  async runDIYCommand(@Query('command') command: string): Promise<string> {
    const taskUUID = this.appService.generateUUID();

    this.logger.log(`DIY command requested: ${command}`);
    const scannerTaskExecuteResult = await this.scannerService.runDIYCommand(
      command,
      taskUUID,
    );

    this.daoService.createTask(
      taskUUID,
      scannerTaskExecuteResult.command,
      scannerTaskExecuteResult.logFilePath,
      this.runDIYCommand.name,
    );

    return `Command executed. Log file: ${scannerTaskExecuteResult.logFilePath}`;
  }

  /**
   * 执行预定义的 Nmap 扫描任务。
   * @param target 扫描目标
   * @returns NmapRun | string 扫描结果或无数据提示
   */
  @Get('/nmap')
  async runPredefinedNmapScan(
    @Query('target') target: string,
  ): Promise<NmapRun | string> {
    const taskUUID = this.appService.generateUUID();

    this.logger.log(`Nmap scan requested for target: ${target}`);
    const scannerTaskExecuteResult = await this.scannerService.runNmapScan(
      target,
      taskUUID,
    );

    this.daoService.createTask(
      taskUUID,
      scannerTaskExecuteResult.command,
      scannerTaskExecuteResult.logFilePath,
      this.runPredefinedNmapScan.name,
    );

    const nmapResult = await this.parserNmapService.parseNmapLogfile(
      scannerTaskExecuteResult.logFilePath,
    );
    return nmapResult ? nmapResult : 'No data';
  }
}
