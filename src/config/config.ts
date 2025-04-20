import fs from 'fs';
import YAML from 'yaml';

/**
 * 設定ファイルの構造
 */
export interface Config {
  /**
   * 対象のサーバーID
   */
  exclusive_server_id: string;
  /**
   * ログを送信するチャンネルID
   */
  log_channel_id: string;
  /**
   * クールダウン時間（秒）
   */
  cooldown: number;
  /**
   * タイムアウトの期間（秒）
   */
  timeout_duration: number;
  /**
   * 許可される複数投稿チャンネルの最大数
   */
  max_allows_multi_post_channels_count: number;
  /**
   * テスト用チャンネルIDのリスト
   */
  test_channel_ids: string[];
  /**
   * ホワイトリストに登録されたロールIDのリスト
   */
  whitelist_role_ids: string[];
};

/**
 * 設定ファイルを読み込む
 * @returns 設定内容
 */
export default function loadConfig(): Config {
  /**
   * 設定ファイルを読み込む
   */
  const file = fs.readFileSync(
    './config/config.yml',
    'utf8',
  );
  /**
   * YAML形式の設定をパースする
   */
  return YAML.parse(file) as Config;
}

/**
 * 設定ファイルを保存する
 * @param config 保存する設定内容
 */
export function saveConfig(config: string): void {
  fs.writeFileSync('./config/config.yml', config);
}
