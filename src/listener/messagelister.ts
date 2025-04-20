import { Message, User } from 'discord.js';
import { Config } from '../config/config';

interface UserMessage {
  [user: string]: MessageType[]
};

interface ChannelMessage {
  [channel: string]: MessageType[]
};

/**
 *
 */
export interface MessageType { // キーはユーザー
  /**
   *
   */
  channel: string, // チャンネルとメッセージのペアを保存する
  /**
   *
   */
  content: string,
  /**
   *
   */
  timestamp: Date,
  /**
   *
   */
  message: Message<boolean>,
}; // ユーザーごとに配列で持っておく

/**
 * メッセージリスナー
 *
 * メッセージを監視し、不正なメッセージを検出する
 */
export class MessageListener {
  /**
   * 複数のメッセージを短時間で投稿した場合の処理を設定する 時間はコンフィグで設定可能
   */
  private onMultiPostSpammingDetected: (message: MessageType[]) => void = () => { };

  /**
   * コンフィグ (コンストラクタで読み込む)
   */
  private config: Config;

  /**
   * ユーザーごとのメッセージリスト
   */
  private userMessages: UserMessage = {};

  /**
   *
   * @param config
   */
  constructor(config: Config) {
    this.config = config;
  }

  /**
   * 複数のメッセージを短時間で投稿した場合の処理を設定する 時間はコンフィグで設定可能
   * @param func
   * @returns void
   */
  setOnMultiPostSpammingDetected(func: (message: MessageType[]) => void) {
    this.onMultiPostSpammingDetected = func;
  }

  /**
   * メッセージを追加する
   * @param message メッセージ
   */
  addMessage(message: Message<boolean>) {
    // ユーザーごとにメッセージをロード
    let messages = this.userMessages[message.author.id] ?? [];
    messages.push({
      channel: message.channel.id,
      content: message.content,
      timestamp: new Date(message.createdTimestamp),
      message: message,
    });

    // 時間をすぎたメッセージを忘れる 
    messages = messages.filter((m) => {
      const diff = /* 今 */ message.createdTimestamp - /* 当時 */ m.timestamp.getTime(); // 経過時間
      return diff <= this.config.cooldown; // 設定時間よりも短い場合は残す
    });

    // 同一ユーザーの同じ内容のメッセージを取得
    const user_messages = messages.filter((m) => m.content === message.content);
    // 重複をカウント
    const duplicate_count = Object.keys(this.chunkByChannel(user_messages)).length;
    if (duplicate_count >= this.config.max_allows_multi_post_channels_count) {
      this.onMultiPostSpammingDetected(user_messages);
    }

    // ユーザーごとにメッセージをセーブ
    this.userMessages[message.author.id] = messages;
  }

  /**
   * チャンネルごとにメッセージを分割する
   * @param messages メッセージ
   * @returns チャンネルごとに分割されたメッセージ
   */
  chunkByChannel(messages: MessageType[]): ChannelMessage{
    return messages.reduce((acc, message) => {
      if (!acc[message.channel]) {
        acc[message.channel] = [];
      }
      acc[message.channel].push(message);
      return acc;
    }, {} as ChannelMessage);
  }
}
