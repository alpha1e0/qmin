/**
 * Application Version
 */
export const VERSION = '1.0.0';

/**
 * Enable content mixing (base64 encoding)
 */
export const ENABLE_MIX = true;

/**
 * Save images to database (true) or file system (false)
 */
export const IMG_SAVE_TO_DB = false;

/**
 * MIME type mapping for supported image formats
 */
export const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.JPG': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.JPEG': 'image/jpeg',
  '.png': 'image/png',
  '.PNG': 'image/png',
  '.gif': 'image/gif',
  '.GIF': 'image/gif',
};

/**
 * Image viewer cache directory (relative)
 */
export const IV_CACHE_DIR = '.qmin_index';

/**
 * Image viewer operation result directory (relative)
 */
export const IV_OP_RESULT_DIR = '.qmin_op_result';

/**
 * Image viewer restore directory (relative)
 */
export const IV_RESTORE_DIR = '.qmin_restore';

/**
 * Operation database file for recording scores and history
 */
export const IV_OP_DB_FILE = 'op.json';

/**
 * Directory database file for recording directory structure
 */
export const IV_DIR_DB_FILE = '.qmin_dir.json';

/**
 * Target smaller dimension for thumbnail generation
 */
export const IV_IMG_LITTLE_SIZE = 1600;

/**
 * Auto save interval in milliseconds (for editor)
 */
export const AUTO_SAVE_INTERVAL = 7000;

/**
 * Lock check interval in milliseconds (for editor)
 */
export const LOCK_CHECK_INTERVAL = 11000;

/**
 * Lock check timeout in milliseconds (for editor)
 */
export const LOCK_CHECK_TIMEOUT = 1200000;

/**
 * Server address constant (deprecated - now using IPC)
 */
export const DEFAULT_SERVER_ADDR = 'http://127.0.0.1:50000';
