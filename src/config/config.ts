import fs from 'fs';
import yaml from 'yaml';
import { getWorkdirPath } from '../util/workdir.js';

/**
 * 設定ファイルの構造
 */
export interface Config {
  /* eslint-disable @typescript-eslint/naming-convention */
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
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * 設定ファイルを読み込む
 * @returns 設定内容
 */
export default function loadConfig(): Config {
  /**
   * 設定ファイルを読み込む
   */
  const file = fs.readFileSync(getWorkdirPath('config.yml'), 'utf-8');
  /**
   * YAML形式の設定をパースする
   */
  return yaml.parse(file) as Config;
}
