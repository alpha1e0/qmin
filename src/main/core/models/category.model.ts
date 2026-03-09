/**
 * Document category model
 */
export interface DocCategory {
  id: number;
  name: string;
  space: number;
  create_time: string;
}

/**
 * Category with doc count
 */
export interface DocCategoryWithCount extends DocCategory {
  doc_count: number;
}

/**
 * Category creation data
 */
export interface CategoryCreate {
  name: string;
  space?: number;
}

/**
 * Category update data
 */
export interface CategoryUpdate {
  name?: string;
  space?: number;
}
