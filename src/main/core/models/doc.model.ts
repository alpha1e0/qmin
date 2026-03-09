/**
 * Document model
 */
export interface Doc {
  id: number;
  title: string;
  summary: string;
  content: string;
  category_id: number;
  create_time: string;
  modify_time: string;
}

/**
 * Document list item (without content)
 */
export interface DocListItem {
  id: number;
  title: string;
  summary: string;
  create_time: string;
  modify_time: string;
}

/**
 * Document creation data
 */
export interface DocCreate {
  cid: number;
  title: string;
  summary: string;
  content?: string;
}

/**
 * Document update data
 */
export interface DocUpdate {
  title?: string;
  summary?: string;
  content?: string;
  modify_time?: string;
}
