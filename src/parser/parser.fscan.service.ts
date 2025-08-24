import { Injectable, Logger } from '@nestjs/common';
import { FscanLogEntry } from 'src/parser/scanner.type.fscan';

@Injectable()
export class ParserFscanService {
  private readonly logger = new Logger(ParserFscanService.name);

  parseFscanLogfile(filePath: string): FscanLogEntry[] {
    this.logger.debug(`Parsing input: ${filePath}`);
    const fileContent = require('fs').readFileSync(filePath, 'utf-8');

    const trimmedContent = fileContent.trim();
    if (trimmedContent === '') {
      return [];
    }

    const jsonArrayString = `[${trimmedContent.replace(/\}\s*\{/g, '},{')}]`;

    try {
      const parsedData = JSON.parse(jsonArrayString) as FscanLogEntry[];
      return parsedData;
    } catch (error) {
      this.logger.error('解析JSON流失败。请检查文件格式是否正确。');
      this.logger.error('处理后的字符串:', jsonArrayString);
      this.logger.error('错误详情:', error);
      return [];
    }
  }
}
