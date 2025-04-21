/**
 * 想定外のエラーを表します。
 */
export class NotExpectError extends Error {
  /**
   * エラーメッセージを指定して初期化します。
   * @param message エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = 'NotExpectError';
  }
}

/**
 * リソースが見つからないエラーを表します。
 */
export class NotFoundError extends Error {
  /**
   * エラーメッセージを指定して初期化します。
   * @param message エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * リソースが準備できていないエラーを表します。
 */
export class NotReadyError extends Error {
  /**
   * エラーメッセージを指定して初期化します。
   * @param message エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = 'NotReadyError';
  }
}

/**
 * リソースが設定されていないエラーを表します。
 */
export class NotSettedError extends Error {
  /**
   * エラーメッセージを指定して初期化します。
   * @param message エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = 'NotSettedError';
  }
}
