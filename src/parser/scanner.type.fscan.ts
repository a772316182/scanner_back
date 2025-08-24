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
