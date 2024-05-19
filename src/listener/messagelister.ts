import { Message, User } from 'discord.js';
import { Config } from "../config/config";

type UserMessage = {
  [user: string]: MessageType[]
};

export type MessageType = { // キーはユーザー
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
   * チャンネルごとのメッセージリスト
   */
  private channel_messages: ChunkedMessageType[] = [];

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
    this.channel_messages = this.chunkByChannel(messages);

    //重複をカウント
    const duplicate_count = messages.filter((m) => m.content === message.content).length;
    if (duplicate_count >= this.config.max_allows_multi_post_channels_count) {
      const user_messages = messages.filter((m) => m.content === message.content);

      //timestamp diff
      const time = user_messages[0].timestamp.getTime();
      const diff = message.createdTimestamp - time;
      if (diff <= this.config.cooldown) {
        //メッセージがすべて同じユーザーであるかどうかを確認
        const is_same_user = user_messages.every((m) => m.message.author.id === message.author.id);

        if (is_same_user) {
          this.onMultiPostSpammingDetected(user_messages);
          
        }
      }
      
      this.userMessages[message.author.id] = this.userMessages[message.author.id].filter((m) => m.content !== message.content);
    }
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
