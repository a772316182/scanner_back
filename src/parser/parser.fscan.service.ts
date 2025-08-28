import { Injectable, Logger } from '@nestjs/common';
import { FscanLogEntry } from 'src/parser/scanner.type.fscan';
import { readFile } from 'fs/promises';

@Injectable()
export class ParserFscanService {
  private readonly logger = new Logger(ParserFscanService.name);

  async parseFscanLogfile(filePath: string): Promise<FscanLogEntry[]> {
    this.logger.debug(`Parsing input: ${filePath}`);
    let fileContent: string;
    try {
      fileContent = await readFile(filePath, 'utf-8');
    } catch (readError) {
      this.logger.error(`读取文件失败: ${filePath}`, readError);
      return [];
    }

    const trimmedContent = fileContent.trim();
    if (trimmedContent === '') {
      return [];
    }

    const jsonArrayString = `[${trimmedContent.replace(/\}\s*\{/g, '},{')}]`;

    try {
      const parsedData = JSON.parse(jsonArrayString) as FscanLogEntry[];
      return parsedData;
    } catch (parseError) {
      this.logger.error('解析JSON流失败。请检查文件格式是否正确。');
      this.logger.error('处理后的字符串:', jsonArrayString);
      this.logger.error('错误详情:', parseError);
      return [];
    }
  }
}
