import { Message, User } from 'discord.js';
import { Config } from "../config/config";

type UserMessage = {
  [user: string]: MessageType[]
};

type MessageType = { // キーはユーザー
  channel: string, // チャンネルとメッセージのペアを保存する
  content: string,
  timestamp: Date,
  message: Message<boolean>,
}; // ユーザーごとに配列で持っておく

type ChunkedMessageType = {
  channel: string;
  chunked_messages: {
    [user: string]: MessageType[];
  };
};

/**
 * メッセージリスナー
 *
 * メッセージを監視し、不正なメッセージを検出する
 */
export class MessageListener {
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
  private userMessages: UserMessage = {};

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
    let messages = this.userMessages[message.author.id];
    if (!messages) {
      messages = [];
    }

    messages.push({
      channel: message.channel.id,
      content: message.content,
      timestamp: new Date(message.createdTimestamp),
      message: message,
    });

    this.userMessages[message.author.id] = messages;
    const channel_messages = this.chunkByChannel(messages);

    channel_messages.forEach((channel_message) => {
      Object.entries(channel_message.chunked_messages).forEach(([user, messages]) => {
        
      });
    });

    console.log(channel_messages);
  }

  chunkByChannel(messages: MessageType[]): ChunkedMessageType[] {
    const channel_messages = messages.reduce((acc, message) => {
      if (!acc[message.channel]) {
        acc[message.channel] = [];
      }
      acc[message.channel].push(message);
      return acc;
    }, {} as { [channel: string]: MessageType[] });

    const result = Object.entries(channel_messages).map(([channel, messages]) => {
      const chunked_messages = this.chunkByUser(messages);
      return {
        channel,
        chunked_messages
      };
    });

    return result;
  }

  chunkByUser(messages: MessageType[]) {
    const chunked_messages = messages.reduce((acc, message) => {
      if (!acc[message.message.author.id]) {
        acc[message.message.author.id] = [];
      }
      acc[message.message.author.id].push(message);
      return acc;
    }, {} as { [user: string]: MessageType[] });

    return chunked_messages;
  }
}
