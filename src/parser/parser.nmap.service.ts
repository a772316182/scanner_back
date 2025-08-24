import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs/promises';
import type {
  NmapParserOptions,
  ParsedNmapXml,
  NmapParseResult,
  SimplifiedNmapResult,
  SimplifiedHost,
  SimplifiedPort,
  SimplifiedOsMatch,
  NmapRun,
} from './scanner.type.nmap';

@Injectable()
export class ParserNmapService {
  private readonly logger = new Logger(ParserNmapService.name);
  private readonly parser: XMLParser;

  constructor() {
    const defaultOptions: Required<NmapParserOptions> = {
      parseAttributeValue: true,
      parseTagValue: true,
      attributeNamePrefix: 'attr_',
      ignoreAttributes: false,
    };
    const config = { ...defaultOptions };

    const arrayTags = new Set([
      'host',
      'address',
      'hostname',
      'port',
      'portused',
      'osmatch',
      'osclass',
      'cpe',
      'extraports',
      'extrareasons',
    ]);

    this.parser = new XMLParser({
      ignoreAttributes: config.ignoreAttributes,
      attributeNamePrefix: config.attributeNamePrefix,
      allowBooleanAttributes: true,
      trimValues: true,
      parseTagValue: config.parseTagValue,
      parseAttributeValue: config.parseAttributeValue,
      cdataPropName: '#cdata',
      commentPropName: '#comment',
      isArray: (tagName: string) => arrayTags.has(tagName),
    });
  }

  /**
   * 解析 Nmap XML 日志文件并返回结构化的数据
   * 这是对外暴露的主要接口
   */
  async parseNmapLogfile(filePath: string): Promise<NmapRun | null> {
    this.logger.debug(`Parsing Nmap XML input: ${filePath}`);
    try {
      const xmlContent = await fs.readFile(filePath, 'utf8');
      const parsed: ParsedNmapXml = this.parser.parse(xmlContent);

      if (!parsed?.nmaprun) {
        this.logger.error('Invalid Nmap XML format: missing nmaprun element');
        return null;
      }
      this.logger.debug('Successfully parsed Nmap XML');
      return parsed.nmaprun;
    } catch (error) {
      this.logger.error(
        `Failed to parse Nmap XML file: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * 返回原始 + 简化的结果
   */
  async parseNmapLogfileWithSummary(
    filePath: string,
  ): Promise<NmapParseResult | null> {
    const nmapRun = await this.parseNmapLogfile(filePath);
    if (!nmapRun) return null;

    const summary = this.buildSummary(nmapRun);
    return { raw: nmapRun, summary };
  }

  /**
   * 直接解析 XML 字符串
   */
  parseNmapXmlContent(xmlContent: string): NmapRun | null {
    this.logger.debug('Parsing Nmap XML content from string');
    try {
      const parsed: ParsedNmapXml = this.parser.parse(xmlContent);
      if (!parsed?.nmaprun) {
        this.logger.error('Invalid Nmap XML format: missing nmaprun element');
        return null;
      }
      this.logger.debug('Successfully parsed Nmap XML content');
      return parsed.nmaprun;
    } catch (error) {
      this.logger.error(
        `Failed to parse Nmap XML content: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * 构建简化摘要
   */
  private buildSummary(nmapRun: NmapRun): SimplifiedNmapResult {
    const hostsArr = Array.isArray(nmapRun.host)
      ? nmapRun.host
      : nmapRun.host
        ? [nmapRun.host]
        : [];

    const hostSummaries: SimplifiedHost[] = hostsArr.map((h) => {
      const addrs = Array.isArray(h.address)
        ? h.address
        : h.address
          ? [h.address]
          : [];
      const ipv4 =
        addrs.find((a) => a?.['attr_addrtype'] === 'ipv4')?.['attr_addr'] ||
        null;
      const mac =
        addrs.find((a) => a?.['attr_addrtype'] === 'mac')?.['attr_addr'] ||
        null;
      const vendor =
        addrs.find((a) => a?.['attr_addrtype'] === 'mac')?.['attr_vendor'] ||
        null;

      const portNodes = h?.ports?.port || [];
      const openPorts: SimplifiedPort[] = portNodes
        .filter((p) => p?.state?.['attr_state'] === 'open')
        .map((p) => ({
          protocol: p?.['attr_protocol'] ?? 'tcp',
          port:
            typeof p?.['attr_portid'] === 'number'
              ? p['attr_portid']
              : Number(p?.['attr_portid']) || 0,
          service: p?.service?.['attr_name'] ?? null,
          reason: p?.state?.['attr_reason'] ?? null,
          reason_ttl: p?.state?.['attr_reason_ttl'] ?? null,
        }));

      const osMatches: SimplifiedOsMatch[] = (h?.os?.osmatch || [])
        .map((m) => ({
          name: m?.['attr_name'] ?? null,
          accuracy:
            typeof m?.['attr_accuracy'] === 'number'
              ? m['attr_accuracy']
              : Number(m?.['attr_accuracy']) || 0,
          classes: (m?.osclass || []).map((c) => ({
            type: c?.['attr_type'] ?? null,
            vendor: c?.['attr_vendor'] ?? null,
            family: c?.['attr_osfamily'] ?? null,
            gen: c?.['attr_osgen'] ?? null,
            cpe: (c?.cpe || [])
              .map((cpe) => cpe?.['#text'] || '')
              .filter(Boolean),
          })),
        }))
        .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));

      return {
        ipv4,
        mac,
        vendor,
        status: h?.status?.['attr_state'] ?? null,
        openPorts,
        osMatches,
      };
    });

    return {
      scanner: nmapRun?.['attr_scanner'] ?? 'nmap',
      version: nmapRun?.['attr_version'] ?? null,
      startedAt: nmapRun?.['attr_startstr'] ?? null,
      args: nmapRun?.['attr_args'] ?? null,
      hosts: hostSummaries,
      runstats: {
        summary: nmapRun?.runstats?.finished?.['attr_summary'] ?? null,
        elapsed: nmapRun?.runstats?.finished?.['attr_elapsed'] ?? null,
        exit: nmapRun?.runstats?.finished?.['attr_exit'] ?? null,
        up: nmapRun?.runstats?.hosts?.['attr_up'] ?? null,
        down: nmapRun?.runstats?.hosts?.['attr_down'] ?? null,
        total: nmapRun?.runstats?.hosts?.['attr_total'] ?? null,
      },
    };
  }
}
