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
  private onMultiPostSpammingDetected: (message: Message) => void = () => { };

  /**
   * コンフィグ (コンストラクタで読み込む)
   */
  private config: Config;

  /**
   * ユーザーごとのメッセージリスト
   */
  private users: {
    [key: string]: Message<boolean>[];
  } | undefined;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * 複数のメッセージを短時間で投稿した場合の処理を設定する 時間はコンフィグで設定可能
   * @param func
   * @returns void
   */
  setOnMultiPostSpammingDetected(func: (message: Message) => void) {
    this.onMultiPostSpammingDetected = func;
  }

  /**
   * メッセージを追加する
   * @param message
   */
  addMessage(message: Message<boolean>) {
    this.messages.push(message);

    if (this.checkMultiPostSpamming()) {
      this.onMultiPostSpammingDetected(message);
      this.messages = this.messages.filter(message => message.author.id !== message.author.id);
      if (this.users) {
        this.users[message.author.id] = [];
      }
    }

  }

  /**
   * 60秒以内に3つ以上のチャンネルに同じメッセージを投稿した場合に処理を行う
   */
  checkMultiPostSpamming() {
    const users = this.chunk();
    const channels = this.chunkByChannel();

    for (const key in users) {
      const messages = users[key];
      if (messages.length >= this.config.max_allows_multi_post_channels_count) {
        return true;
      }
    }
    return false;
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
