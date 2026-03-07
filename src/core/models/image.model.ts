/**
 * Image model
 */
export interface Image {
  id: number;
  name: string;
  content: Buffer;
  ext: string;
  save_path?: string;
  create_time: string;
}

/**
 * Image list item (without content)
 */
export interface ImageListItem {
  id: number;
  name: string;
  ext: string;
  save_path?: string;
  create_time: string;
}

/**
 * Image creation data
 */
export interface ImageCreate {
  name: string;
  content: Buffer;
  ext: string;
  save_path?: string;
}

/**
 * Image response with mime type
 */
export interface ImageResponse {
  name: string;
  content: Buffer;
  mime: string;
}
