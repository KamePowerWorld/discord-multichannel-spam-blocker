import { Message } from 'discord.js';
import { Config } from '../config/config';

interface UserMessage {
  [user: string]: MessageType[];
}

interface ChannelMessage {
  [channel: string]: MessageType[];
}

/**
 * メッセージの型定義
 * キーはユーザー
 */
export interface MessageType {
  /**
   * チャンネルID
   * チャンネルとメッセージのペアを保存する
   */
  channel: string;
  /**
   * メッセージ内容
   */
  content: string;
  /**
   * タイムスタンプ
   */
  timestamp: Date;
  /**
   * メッセージオブジェクト
   */
  message: Message<boolean>;
}

/**
 * メッセージリスナー
 *
 * メッセージを監視し、不正なメッセージを検出する
 */
export class MessageListener {
  /**
   * スパム検出時の処理
   */
  private _onMultiPostSpammingDetected: (message: MessageType[]) => void =
    () => {};

  /**
   * 設定情報
   */
  private _config: Config;

  /**
   * ユーザーごとのメッセージリスト
   */
  private _userMessages: UserMessage = {};

  /**
   * コンストラクタ
   * @param config 設定情報
   */
  constructor(config: Config) {
    this._config = config;
  }

  /**
   * 複数のメッセージを短時間で投稿した場合の処理を設定する 時間はコンフィグで設定可能
   * @param func 処理関数
   */
  setOnMultiPostSpammingDetected(func: (message: MessageType[]) => void): void {
    this._onMultiPostSpammingDetected = func;
  }

  /**
   * メッセージを追加する
   * @param message メッセージ
   */
  addMessage(message: Message<boolean>): void {
    // ユーザーごとにメッセージをロード
    let messages = this._userMessages[message.author.id] ?? [];
    messages.push({
      channel: message.channel.id,
      content: message.content,
      timestamp: new Date(message.createdTimestamp),
      message: message,
    });

    // 時間をすぎたメッセージを忘れる
    messages = messages.filter((m) => {
      const diff =
        /* 今 */ message.createdTimestamp - /* 当時 */ m.timestamp.getTime(); // 経過時間
      return diff <= this._config.cooldown; // 設定時間よりも短い場合は残す
    });

    // 同一ユーザーの同じ内容のメッセージを取得
    const userMessages = messages.filter((m) => m.content === message.content);
    // 重複をカウント
    const duplicateCount = Object.keys(
      this.chunkByChannel(userMessages),
    ).length;
    if (duplicateCount >= this._config.max_allows_multi_post_channels_count) {
      this._onMultiPostSpammingDetected(userMessages);
    }

    // ユーザーごとにメッセージをセーブ
    this._userMessages[message.author.id] = messages;
  }

  /**
   * チャンネルごとにメッセージを分割する
   * @param messages メッセージ
   * @returns チャンネルごとに分割されたメッセージ
   */
  chunkByChannel(messages: MessageType[]): ChannelMessage {
    return messages.reduce((acc, message) => {
      if (!acc[message.channel]) {
        acc[message.channel] = [];
      }
      acc[message.channel].push(message);
      return acc;
    }, {} as ChannelMessage);
  }
}
