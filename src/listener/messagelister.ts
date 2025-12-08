import { Message } from 'discord.js';
import { Config } from '../config/config';
import { collectImageHashes } from '../util/imageHash';

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
  /**
   * メッセージに添付された画像のハッシュ一覧
   */
  imageHashes: string[];
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
  async addMessage(message: Message<boolean>): Promise<void> {
    // ユーザーごとにメッセージをロード
    let messages = this._userMessages[message.author.id] ?? [];
    // 添付と本文の両方から画像リンクを拾ってハッシュ化
    const imageHashes = await collectImageHashes(message);
    // チャンネルや本文などを丸ごとキューに保存しておく
    messages.push({
      channel: message.channel.id,
      content: message.content,
      timestamp: new Date(message.createdTimestamp),
      message: message,
      imageHashes,
    });

    // 設定されたクールダウンを過ぎたメッセージは都度破棄する
    messages = messages.filter((m) => {
      const diff =
        /* 今 */ message.createdTimestamp - /* 当時 */ m.timestamp.getTime(); // 経過時間
      return diff <= this._config.cooldown; // 設定時間よりも短い場合は残す
    });

    // まずはチャンネル単位でグルーピングしてから検査を共通化する
    const chunkedMessages = this.chunkByChannel(messages);

    // --- 文字列による同報検知 ---
    // 投稿済みメッセージのうち本文が完全一致するものを全チャンネルから収集する
    const duplicatedTexts = this.collectMatches(
      chunkedMessages,
      (m) => m.content === message.content,
    );
    // 許容チャンネル数を超えていたらそこでスパム扱い
    if (this.exceedsChannelLimit(duplicatedTexts)) {
      this._onMultiPostSpammingDetected(duplicatedTexts);
      return;
    }

    // --- 画像による同報検知 ---
    // 画像自体のハッシュが一致するメッセージを横断的に取得して判定
    const duplicatedImages = this.findDuplicatedImages(
      chunkedMessages,
      imageHashes,
    );
    if (duplicatedImages) {
      this._onMultiPostSpammingDetected(duplicatedImages);
      return;
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
    // チャンネルごとに別バケットへ押し込むだけのシンプルなヘルパー
    return messages.reduce((acc, message) => {
      if (!acc[message.channel]) {
        acc[message.channel] = [];
      }
      acc[message.channel].push(message);
      return acc;
    }, {} as ChannelMessage);
  }

  private collectMatches(
    chunkedMessages: ChannelMessage,
    predicate: (message: MessageType) => boolean,
  ): MessageType[] {
    // 全チャンネルを走査しつつ、条件を満たしたメッセージだけを抽出
    const matches: MessageType[] = [];
    for (const channelMessages of Object.values(chunkedMessages)) {
      matches.push(...channelMessages.filter(predicate));
    }
    return matches;
  }

  private findDuplicatedImages(
    chunkedMessages: ChannelMessage,
    candidateHashes: string[],
  ): MessageType[] | undefined {
    // 取得済みのハッシュ候補を順番に照合し、どれか1つでも閾値を超えれば即検出
    for (const hash of candidateHashes) {
      const imageMessages = this.collectMatches(
        chunkedMessages,
        (m) => m.imageHashes.includes(hash),
      );
      if (this.exceedsChannelLimit(imageMessages)) {
        return imageMessages;
      }
    }
    return undefined;
  }

  private exceedsChannelLimit(messages: MessageType[]): boolean {
    // 同報が発生したチャンネル数を数えて、許容値を超えたら true
    const channelCount = new Set(messages.map((message) => message.channel))
      .size;
    return (
      channelCount >= this._config.max_allows_multi_post_channels_count
    );
  }
}
