import { Module } from '@nestjs/common';
import { ParserFscanService } from './parser.fscan.service';
import { ParserNmapService } from './parser.nmap.service';

@Module({
  providers: [ParserFscanService, ParserNmapService],
  exports: [ParserFscanService, ParserNmapService],
})
export class ParserModule {}
