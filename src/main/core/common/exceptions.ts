/**
 * Base exception class for Qmin application
 */
export class QminException extends Error {
  readonly errorCode: string;

  constructor(msg: string, errCode: string = 'B_001') {
    super(msg);
    this.name = this.constructor.name;
    this.errorCode = errCode;
    Object.setPrototypeOf(this, QminException.prototype);
  }

  toString(): string {
    return `${this.name} [${this.errorCode}] ${this.message}`;
  }

  toJSON() {
    return {
      success: false,
      err_code: this.errorCode,
      err_msg: this.message,
    };
  }
}

/**
 * Database operation error
 */
export class BaseDBError extends QminException {
  constructor(msg: string) {
    super(msg, 'BASE_001');
  }
}

// ============================================================================
// Markdown Editor Exception Classes
// ============================================================================

/**
 * Markdown Editor database operation error
 */
export class MdEditorDBOpError extends QminException {
  constructor(msg: string) {
    super(msg, 'ME_001');
  }
}

/**
 * Markdown Editor operation not allowed error
 */
export class MdEditorOpNotAllowed extends QminException {
  constructor(msg: string) {
    super(msg, 'ME_002');
  }
}

/**
 * Markdown Editor image operation error
 */
export class MdEditorImgOpError extends QminException {
  constructor(msg: string) {
    super(msg, 'ME_003');
  }
}

// ============================================================================
// Background Task Exception Classes
// ============================================================================

/**
 * Background task not implemented error
 */
export class BGTaskNotImplement extends QminException {
  constructor(msg: string) {
    super(msg, 'BG_001');
  }
}

/**
 * Background task already exists error
 */
export class BGTaskAlreadyExists extends QminException {
  constructor(msg: string) {
    super(msg, 'BG_002');
  }
}

/**
 * Background task not found error
 */
export class BGTaskNotFound extends QminException {
  constructor(msg: string) {
    super(msg, 'BG_003');
  }
}

/**
 * Background task data format error
 */
export class BGTaskDataFormatError extends QminException {
  constructor(msg: string) {
    super(msg, 'BG_004');
  }
}

// ============================================================================
// Image Viewer Exception Classes
// ============================================================================

/**
 * Image base path does not exist error
 */
export class ImageBasePathNotExists extends QminException {
  constructor(msg: string) {
    super(msg, 'IV_001');
  }
}

/**
 * Image path does not exist error
 */
export class ImagePathNotExists extends QminException {
  constructor(msg: string) {
    super(msg, 'IV_002');
  }
}

/**
 * Image cache does not exist error
 */
export class ImageCacheNotExists extends QminException {
  constructor(msg: string) {
    super(msg, 'IV_003');
  }
}

/**
 * Image classification error
 */
export class ImageClassifyError extends QminException {
  constructor(msg: string) {
    super(msg, 'IV_004');
  }
}

/**
 * Image directory removal error
 */
export class ImageDirRemoveError extends QminException {
  constructor(msg: string) {
    super(msg, 'IV_005');
  }
}
