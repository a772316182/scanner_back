import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ScannerService } from './scanner/scanner.service';
import { ParserFscanService } from './parser/parser.fscan.service';
import { ParserNmapService } from './parser/parser.nmap.service';
import { FscanLogEntry } from './parser/scanner.type.fscan';
import { NmapRun } from './parser/scanner.type.nmap';

@Controller('scanner')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly scannerService: ScannerService,
    private readonly parserFscanService: ParserFscanService,
    private readonly parserNmapService: ParserNmapService,
  ) {}

  @Get('/fscan')
  async fscan(@Query('target') target: string): Promise<FscanLogEntry[]> {
    this.logger.log(`Fscan scan requested for target: ${target}`);
    const resultFilePath = await this.scannerService.runFscanScan(target);
    return this.parserFscanService.parseFscanLogfile(resultFilePath);
  }

  @Get('/nmap')
  async nmap(@Query('target') target: string): Promise<NmapRun | string> {
    this.logger.log(`Nmap scan requested for target: ${target}`);
    const resultFilePath = await this.scannerService.runNmapScan(target);
    const nmapResult =
      await this.parserNmapService.parseNmapLogfile(resultFilePath);
    return nmapResult ? nmapResult : 'No data';
  }
}
