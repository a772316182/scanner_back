import { Module } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { DaoModule } from '../dao/dao.module';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [DaoModule, ParserModule],
  providers: [ScannerService],
  exports: [ScannerService],
})
export class ScannerModule {}
