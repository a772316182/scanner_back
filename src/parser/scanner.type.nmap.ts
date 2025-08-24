export enum NmapScanSpeed {
  Safe = '1',
  Medium = '2',
  Fast = '3',
  Aggressive = '4',
  Insane = '5',
}

/**
 * Nmap XML 解析器的配置选项
 */
export interface NmapParserOptions {
  /** 是否解析属性值为对应类型（数字、布尔值等） */
  parseAttributeValue?: boolean;
  /** 是否解析标签值为对应类型 */
  parseTagValue?: boolean;
  /** 属性名前缀，用于区分属性和子节点 */
  attributeNamePrefix?: string;
  /** 是否忽略属性 */
  ignoreAttributes?: boolean;
}

/**
 * 端口状态信息
 */
export interface PortState {
  'attr_state': string;
  'attr_reason': string;
  'attr_reason_ttl': number;
}

/**
 * 服务信息
 */
export interface Service {
  'attr_name'?: string;
  'attr_method'?: string;
  'attr_conf'?: number;
  'attr_product'?: string;
  'attr_version'?: string;
  'attr_extrainfo'?: string;
}

/**
 * 端口信息
 */
export interface Port {
  'attr_protocol': string;
  'attr_portid': number;
  state: PortState;
  service?: Service;
}

/**
 * 地址信息
 */
export interface Address {
  'attr_addr': string;
  'attr_addrtype': 'ipv4' | 'ipv6' | 'mac';
  'attr_vendor'?: string;
}

/**
 * 主机名信息
 */
export interface Hostname {
  'attr_name': string;
  'attr_type': string;
}

/**
 * 主机名集合
 */
export interface Hostnames {
  hostname?: Hostname[];
}

/**
 * 额外端口信息
 */
export interface ExtraReasons {
  'attr_reason': string;
  'attr_count': number;
  'attr_proto'?: string;
  'attr_ports'?: string;
}

/**
 * 额外端口状态
 */
export interface ExtraPorts {
  'attr_state': string;
  'attr_count': number;
  extrareasons: ExtraReasons[];
}

/**
 * 端口集合
 */
export interface Ports {
  extraports?: ExtraPorts[];
  port: Port[];
}

/**
 * CPE 信息
 */
export interface Cpe {
  '#text': string;
}

/**
 * OS 分类信息
 */
export interface OsClass {
  'attr_type': string;
  'attr_vendor': string;
  'attr_osfamily': string;
  'attr_osgen'?: string;
  'attr_accuracy': number;
  cpe?: Cpe[];
}

/**
 * 使用的端口信息
 */
export interface PortUsed {
  'attr_state': string;
  'attr_proto': string;
  'attr_portid': number;
}

/**
 * OS 匹配信息
 */
export interface OsMatch {
  'attr_name': string;
  'attr_accuracy': number;
  'attr_line': number;
  osclass: OsClass[];
}

/**
 * OS 指纹信息
 */
export interface OsFingerprint {
  'attr_fingerprint': string;
}

/**
 * OS 检测结果
 */
export interface Os {
  portused: PortUsed[];
  osmatch: OsMatch[];
  osfingerprint?: OsFingerprint;
}

/**
 * 主机状态
 */
export interface Status {
  'attr_state': string;
  'attr_reason': string;
  'attr_reason_ttl': number;
}

/**
 * 时间信息
 */
export interface Times {
  'attr_srtt': number;
  'attr_rttvar': number;
  'attr_to': number;
}

/**
 * 距离信息
 */
export interface Distance {
  'attr_value': number;
}

/**
 * 主机信息
 */
export interface Host {
  'attr_starttime': number;
  'attr_endtime': number;
  'attr_timedout'?: boolean; // 添加超时标志
  status: Status;
  address: Address[];
  hostnames: Hostnames; 
  ports?: Ports; // 可选，因为超时时可能没有端口信息
  os?: Os; // 可选，因为超时时可能没有OS信息
  distance?: Distance;
  times?: Times;
}

/**
 * 主机提示信息
 */
export interface HostHint {
  status: Status;
  address: Address[];
  hostnames: Hostnames; 
}

/**
 * 扫描信息
 */
export interface ScanInfo {
  'attr_type': string;
  'attr_protocol': string;
  'attr_numservices': number;
  'attr_services': string;
}

/**
 * 详细程度
 */
export interface Verbose {
  'attr_level': number;
}

/**
 * 调试级别
 */
export interface Debugging {
  'attr_level': number;
}

/**
 * 完成信息
 */
export interface Finished {
  'attr_time': number;
  'attr_timestr': string;
  'attr_summary': string;
  'attr_elapsed': number;
  'attr_exit': string;
}

/**
 * 主机统计
 */
export interface HostsStats {
  'attr_up': number;
  'attr_down': number;
  'attr_total': number;
}

/**
 * 运行统计
 */
export interface RunStats {
  finished: Finished;
  hosts: HostsStats;
}

/**
 * Nmap 运行结果主结构
 */
export interface NmapRun {
  'attr_scanner': string;
  'attr_args': string;
  'attr_start': number;
  'attr_startstr': string;
  'attr_version': string;
  'attr_xmloutputversion': string;
  scaninfo: ScanInfo;
  verbose: Verbose;
  debugging: Debugging;
  hosthint?: HostHint;
  host: Host[];
  runstats: RunStats;
}

/**
 * 解析后的根对象
 */
export interface ParsedNmapXml {
  nmaprun: NmapRun;
}

/**
 * 简化的端口信息
 */
export interface SimplifiedPort {
  protocol: string;
  port: number;
  service: string | null;
  reason: string | null;
  reason_ttl: number | null;
}

/**
 * 简化的 OS 分类
 */
export interface SimplifiedOsClass {
  type: string | null;
  vendor: string | null;
  family: string | null;
  gen: string | null;
  cpe: string[];
}

/**
 * 简化的 OS 匹配
 */
export interface SimplifiedOsMatch {
  name: string | null;
  accuracy: number;
  classes: SimplifiedOsClass[];
}

/**
 * 简化的主机信息
 */
export interface SimplifiedHost {
  ipv4: string | null;
  mac: string | null;
  vendor: string | null;
  status: string | null;
  openPorts: SimplifiedPort[];
  osMatches: SimplifiedOsMatch[];
}

/**
 * 简化的运行统计
 */
export interface SimplifiedRunStats {
  summary: string | null;
  elapsed: number | null;
  exit: string | null;
  up: number | null;
  down: number | null;
  total: number | null;
}

/**
 * 简化的解析结果
 */
export interface SimplifiedNmapResult {
  scanner: string;
  version: string | null;
  startedAt: string | null;
  args: string | null;
  hosts: SimplifiedHost[];
  runstats: SimplifiedRunStats;
}

/**
 * 完整的解析结果，包含原始数据和简化数据
 */
export interface NmapParseResult {
  raw: NmapRun;
  summary: SimplifiedNmapResult;
}
