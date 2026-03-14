/**
 * Image Viewer Models
 * TypeScript interfaces for image viewer functionality
 */

/**
 * Image viewer metadata
 */
export interface IVMeta {
  name: string;
  create_time: string;
  cla_time?: string;
  cla_name?: string;
  s1?: number;
  s2?: number;
  s3?: number;
  s4?: number;
}

/**
 * Image viewer directory model
 */
export interface IVDirectory {
  path_id: string;
  name: string;
  create_time: string;
  cla_time?: string;
  cla_name?: string;
  children?: IVDirectory[];
  meta?: IVMeta;
}

/**
 * Image viewer image info
 */
export interface IVImage {
  path_id: string;
  name: string;
  score: number;
  url?: string;
}

/**
 * Image viewer operation record
 */
export interface IVOperation {
  path_id: string;
  score: number;
  timestamp: number;
  operation: string;
}
