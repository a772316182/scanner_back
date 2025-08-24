// 通用的基础日志条目结构
interface FscanBaseEntry {
  time: string;
  target: string;
  status: string;
}

// 当 type 是 "HOST" 时的结构
interface FscanHostEvent extends FscanBaseEntry {
  type: 'HOST';
  details: {
    protocol: string;
  };
}

// 当 type 是 "PORT" 时的结构
interface FscanPortEvent extends FscanBaseEntry {
  type: 'PORT';
  details: {
    port: number;
  };
}

// 当 type 是 "SERVICE" 时的结构，details 字段比较复杂，包含多种可能性
// 我们将所有可能的字段都定义为可选的
interface FscanServiceDetails {
  Url?: string;
  fingerprints?: null;
  length?: string;
  port?: string | number; // 端口号有时是字符串，有时是数字
  server_info?: Record<string, any>; // server_info 内部结构多变，暂定为任意对象
  service?: string;
  status_code?: number;
  title?: string;
  banner?: string;
  info?: string;
  os?: string;
  product?: string;
  version?: string;
  domain_name?: string;
  server_service?: string;
  workstation_service?: string;
  hostname?: string;
  ipv4?: string[];
  ipv6?: string[];
}

interface FscanServiceEvent extends FscanBaseEntry {
  type: 'SERVICE';
  details: FscanServiceDetails;
}

// 创建一个联合类型，表示日志条目可能是这三种类型中的任意一种
export type FscanLogEntry = FscanHostEvent | FscanPortEvent | FscanServiceEvent;

// TypeScript interfaces for Nmap XML output format
// Based on nmap.dtd from the Nmap project https://nmap.org/book/nmap-dtd.html
/**
 * Nmap 扫描结果的顶层接口，对应 <nmaprun> 元素
 */
export interface NmapRun {
  scanner: string;
  args: string;
  start: number;
  startstr: string;
  version: string;
  xmloutputversion: string;
  hosts: NmapHost[];
  runstats: NmapRunStats;
}

/**
 * 单个主机的扫描信息，对应 <host> 元素
 */
export interface NmapHost {
  starttime?: number;
  endtime?: number;
  status: NmapStatus;
  addresses: NmapAddress[];
  hostnames: string[];
  // 将 ports 数组改为一个对象，以容纳 extraports
  portsInfo: NmapPortsInfo;
  os?: NmapOS;
  distance?: number; // 新增
  times?: NmapTimes; // 新增
}

/**
 * 包含端口和额外端口信息的对象，对应 <ports> 元素
 */
export interface NmapPortsInfo {
  ports: NmapPort[];
  extraports: NmapExtraPort[];
}

/**
 * 被归类的额外端口信息，对应 <extraports> 元素
 */
export interface NmapExtraPort {
  state: string;
  count: number;
}

// ... 其他接口定义保持不变 ...
export interface NmapStatus {
  state: 'up' | 'down' | 'unknown' | 'skipped';
  reason: string;
  reason_ttl: number;
}

export interface NmapAddress {
  addr: string;
  addrtype: 'ipv4' | 'ipv6' | 'mac';
  vendor?: string;
}

export interface NmapPort {
  protocol: 'ip' | 'tcp' | 'udp' | 'sctp';
  portid: number;
  state: NmapPortState;
  service?: NmapService;
  scripts?: NmapScript[];
}

export interface NmapPortState {
  state: string; // e.g., "open", "closed", "filtered"
  reason: string;
  reason_ttl: number;
}

export interface NmapService {
  name: string;
  product?: string;
  version?: string;
  extrainfo?: string;
  method: 'table' | 'probed';
  conf: number;
}

export interface NmapScript {
  id: string;
  output: string;
}

export interface NmapOS {
  osmatches: NmapOSMatch[];
}

export interface NmapOSMatch {
  name: string;
  accuracy: number;
  osclasses: NmapOSClass[];
}

export interface NmapOSClass {
  vendor: string;
  osfamily: string;
  osgen?: string;
  type?: string;
  accuracy: number;
}

export interface NmapTimes {
  srtt: number;
  rttvar: number;
  to: number;
}

export interface NmapRunStats {
  finished: {
    time: number;
    timestr: string;
    elapsed: number;
    summary: string;
    exit: 'success' | 'error';
  };
  hosts: {
    up: number;
    down: number;
    total: number;
  };
}