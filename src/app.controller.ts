import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ScannerService } from './scanner/scanner.service';
import { AppService } from './app.service';
import { DaoService } from './dao/dao.service';

@Controller('scanner')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly scannerService: ScannerService,
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
  ): Promise<{ taskId: string }> {
    const taskUUID = this.appService.generateUUID();
    this.logger.log(`Fscan scan requested for target: ${target}`);

    // The command is known before execution, so we can create the task first.
    // Note: The exact command might be slightly different if defaults are used in the service.
    // For simplicity, we construct it here, but a better approach might be to have the service return it.
    const command = `sudo -n fscan -h ${target} ...`; // Simplified command
    const logFilePath = `./log/fscan_${taskUUID}.json`;

    await this.daoService.createTask(
      taskUUID,
      command,
      logFilePath,
      this.runPredefinedFscan.name,
    );

    this.scannerService.runFscanScan(target, taskUUID);

    return { taskId: taskUUID };
  }

  /**
   * 执行用户自定义的扫描命令。
   * @param command 用户自定义的扫描命令
   * @returns { taskId: string } 包含任务 ID 的对象
   */
  @Get('/diy')
  async runDIYCommand(
    @Query('command') command: string,
  ): Promise<{ taskId: string }> {
    const taskUUID = this.appService.generateUUID();
    this.logger.log(`DIY command requested: ${command}`);
    const logFilePath = `./log/diy_${taskUUID}.log`;
    await this.daoService.createTask(
      taskUUID,
      command,
      logFilePath,
      this.runDIYCommand.name,
    );
    this.scannerService.runDIYCommand(command, taskUUID);
    return { taskId: taskUUID };
  }

  /**
   * 执行预定义的 Nmap 扫描任务。
   * @param target 扫描目标
   * @returns NmapRun | string 扫描结果或无数据提示
   */
  @Get('/nmap')
  async runPredefinedNmapScan(
    @Query('target') target: string,
  ): Promise<{ taskId: string }> {
    const taskUUID = this.appService.generateUUID();
    this.logger.log(`Nmap scan requested for target: ${target}`);
    const command = `sudo -n nmap -n ${target} ...`; // Simplified command
    const logFilePath = `./log/nmap_${taskUUID}.xml`;
    await this.daoService.createTask(
      taskUUID,
      command,
      logFilePath,
      this.runPredefinedNmapScan.name,
    );
    this.scannerService.runNmapScan(target, taskUUID);
    return { taskId: taskUUID };
  }

  /**
   * 获取指定任务的当前状态。
   * @param taskId 任务 ID
   * @returns { status: string } 包含任务状态的对象
   */
  @Get('getTaskStatus')
  async getTaskStatus(
    @Query('taskId') taskId: string,
  ): Promise<{ status: string }> {
    this.logger.log(`Get task status requested for taskId: ${taskId}`);
    const status = await this.daoService.getTaskStatus(taskId);
    return { status: status ? status : 'NOT_FOUND' };
  }

  /**
   * 获取指定任务的扫描结果。
   * @param taskId 任务 ID
   * @returns { results: any[] } 包含扫描结果的对象
   */
  @Get('getTaskResults')
  async getTaskResults(
    @Query('taskId') taskId: string,
  ): Promise<{ results: any[] }> {
    this.logger.log(`Get task results requested for taskId: ${taskId}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await this.daoService.getTaskResults(taskId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { results: results ? results : [] };
  }
}
