import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ScannerService } from './scanner.service';

@Controller('scanner')
export class ScannerController {
  private readonly logger = new Logger(ScannerController.name);

  constructor(private readonly scannerService: ScannerService) {}

  @Get('/fscan')
  fscan(@Query('target') target: string): Promise<string> {
    this.logger.log(`Fscan scan requested for target: ${target}`);    
    try {
      const result = this.scannerService.runFscanScan(target);
      return result;
    } catch (error) {
      this.logger.error(`Error occurred while running Fscan scan: ${error.message}`);
      throw error;
    }
  }

  @Get('/nmap')
  nmap(@Query('target') target: string): Promise<string> {
    this.logger.log(`Nmap scan requested for target: ${target}`);
    return this.scannerService.runNmapScan(target);
  }
}
