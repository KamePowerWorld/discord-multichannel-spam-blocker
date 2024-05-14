import { Message } from "discord.js";
import { Config } from "../config/config";
/**
 * メッセージリスナー
 *
 * メッセージを監視し、不正なメッセージを検出する
 */
export class MessageListener {
  /**
   * メッセージリスト
   */
  private messages: Message<boolean>[] = [];

  /**
   * 複数のメッセージを短時間で投稿した場合の処理を設定する 時間はコンフィグで設定可能
   */
  private onMultiPostSpammingDetected: (message: Message<boolean>[]) => void = () => { };

  /**
   * コンフィグ (コンストラクタで読み込む)
   */
  private config: Config;

  /**
   * ユーザーごとのメッセージリスト
   */
  private userMessages: {
    [user: string]: { // キーはユーザー
      channel: string, // チャンネルとメッセージのペアを保存する
      content: string,
      timestamp: Date,
      message: Message,
    }[] // ユーザーごとに配列で持っておく
  } = {};

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * 複数のメッセージを短時間で投稿した場合の処理を設定する 時間はコンフィグで設定可能
   * @param func
   * @returns void
   */
  setOnMultiPostSpammingDetected(func: (message: Message<boolean>[]) => void) {
    this.onMultiPostSpammingDetected = func;
  }

  /**
   * メッセージを追加する
   * @param message
   */
  addMessage(message: Message<boolean>) {
    this.messages.push(message);

    
  }

  /**
   * ユーザーごとにメッセージを分ける
   */
  chunk() {
    const users = this.messages.reduce((acc, message) => {
      if (!acc[message.author.id]) {
        acc[message.author.id] = [];
      }
      acc[message.author.id].push(message);
      return acc;
    }, {} as { [key: string]: Message<boolean>[] });
    return users;
  }

  /**
   * チャンネルごとにメッセージを分ける
   */
  chunkByChannel() {
    const channels = this.messages.reduce((acc, message) => {
      if (!acc[message.channel.id]) {
        acc[message.channel.id] = [];
      }
      acc[message.channel.id].push(message);
      return acc;
    }, {} as { [key: string]: Message<boolean>[] });
    return channels;
  }


  /**
   * メッセージを取得する
   */
  getMessages() {
    return this.messages;
  }

  /**
   * メッセージ内のURLを正規表現で取得する
   * @returns {RegExpMatchArray | null}
   * @param message メッセージ
   */
  getUrlsByRexExp(message: string): RegExpMatchArray | null {
    const regexp = new RegExp("https?://(?:[-\\w.]|(?:%[a-fA-F0-9]{2}))+");
    const match_result = message.match(regexp);

    return match_result;
  }
}
