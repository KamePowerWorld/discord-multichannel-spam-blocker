import {
  Attachment,
  EmbedBuilder,
  Message,
  MessageCreateOptions,
  User,
} from 'discord.js';
import type { SpamReason } from '../listener/messagelister';

const EMBED_FIELD_VALUE_LIMIT = 1024;

function truncateFieldValue(value: string): string {
  if (value.length <= EMBED_FIELD_VALUE_LIMIT) {
    return value;
  }
  const sliceLength = Math.max(0, EMBED_FIELD_VALUE_LIMIT - 3);
  return `${value.slice(0, sliceLength)}...`;
}

/**
 * ログ用の埋め込みメッセージを作成します。
 * @param title - 埋め込みのタイトル。
 * @param message - 埋め込みのメッセージ内容。
 * @param settimestamp - タイムスタンプを設定するかどうか。
 * @param loglevel - ログレベル ('info' | 'warn' | 'error')。
 * @returns 作成した埋め込みメッセージ。
 */
export function getLogEmbedMessage(
  title: string,
  message: string,
  settimestamp: boolean,
  loglevel: 'info' | 'warn' | 'error',
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(message)
    .setColor(
      loglevel === 'info' ? 'Green' : loglevel === 'warn' ? 'Yellow' : 'White',
    );
  if (settimestamp) {
    embed.setTimestamp();
  }

  return embed;
}

/**
 * 埋め込みにユーザー情報を設定します。
 * @param embed - 埋め込みメッセージ。
 * @param user - ユーザー情報。
 * @returns ユーザー情報を設定した埋め込みメッセージ。
 */
export function setAuthor(embed: EmbedBuilder, user: User): EmbedBuilder {
  return embed.setAuthor({
    /**
     *
     */
    name: user.displayName,
    /**
     *
     */
    iconURL: user.avatarURL()?.toString(),
  });
}

/**
 * メッセージ内容を元に埋め込みを作成します。
 * @param message - 埋め込みに設定するメッセージ内容。
 * @returns 作成した埋め込みメッセージ。
 */
export function getEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setDescription(message);
}

/**
 * スパムログ用のメッセージオプションを作成します。
 * @param user - スパムを送信したユーザー。
 * @param messages - ユーザーが送信したメッセージのリスト。
 * @param options - ログ生成時の追加オプション。
 * @returns スパムログ用のメッセージオプション。
 */
export function createSpamLogMessage(
  user: User,
  messages: Message[],
  options?: { spamReason?: SpamReason },
): MessageCreateOptions {
  const isImageSpam = options?.spamReason === 'image';
  const formattedMessages = messages.map((message) => ({
    content: formatMessageContent(message),
    attachments: [...message.attachments.values()],
    imageUrls: collectImageUrlsForLog(message),
  }));
  const allSameContent = formattedMessages.every(
    (item) => item.content === formattedMessages[0].content,
  );
  const fields = [
    {
      name: '送信したチャンネル',
      value: truncateFieldValue(
        messages
          .map(
            (message) =>
              `<t:${Math.floor(message.createdTimestamp / 1000)}:R> <#${message.channel.id}>`,
          )
          .join('\n'),
      ),
    },
  ];

  if (isImageSpam) {
    const uniqueImageUrls = Array.from(
      new Set(formattedMessages.flatMap((item) => item.imageUrls)),
    );
    fields.push({
      name: '一致した画像URL',
      value: truncateFieldValue(
        uniqueImageUrls.length > 0
          ? uniqueImageUrls.join('\n')
          : '一致した画像URLを取得できませんでした',
      ),
    });
  } else if (allSameContent) {
    fields.push({
      name: 'メッセージ内容',
      value: truncateFieldValue(formattedMessages[0].content),
    });
  } else {
    formattedMessages.forEach((item, index) => {
      fields.push({
        name: `メッセージ内容${index + 1}`,
        value: truncateFieldValue(item.content),
      });
    });
  }

  return {
    files: formattedMessages.flatMap((item) => item.attachments).slice(0, 10),
    embeds: [
      new EmbedBuilder()
        .setTitle('連投検知')
        .setDescription(
          `${user.displayName} (<@${user.id}>) が複数チャンネルで連投しました`,
        )
        .addFields(fields)
        .setAuthor({
          /**
           * 投稿者の名前
           */
          name: user.displayName,
          /**
           * 投稿者のアイコンURL
           */
          iconURL: user.displayAvatarURL(),
        })
        .setColor('Red'),
    ],
  };
}

function formatMessageContent(message: Message): string {
  const attachments = [...message.attachments.values()];
  const attachmentDescription =
    attachments.length > 0
      ? attachments
          .map((attachment, index) => `添付${index + 1}: ${attachment.url}`)
          .join('\n')
      : undefined;
  const baseContent =
    message.content.length > 0
      ? message.content
      : attachments.length > 0
        ? '画像のみ'
        : 'テキストなし';
  return attachmentDescription
    ? `${baseContent}\n${attachmentDescription}`
    : baseContent;
}

function collectImageUrlsForLog(message: Message): string[] {
  const urls: string[] = [];
  for (const attachment of message.attachments.values()) {
    if (isLikelyImageAttachment(attachment)) {
      urls.push(attachment.url);
    }
  }
  for (const embed of message.embeds) {
    if (embed.thumbnail?.url) {
      urls.push(embed.thumbnail.url);
    }
    if (embed.image?.url) {
      urls.push(embed.image.url);
    }
  }
  return urls;
}

function isLikelyImageAttachment(attachment: Attachment): boolean {
  if (attachment.contentType?.startsWith('image/')) {
    return true;
  }
  const name = attachment.name ?? attachment.url;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(name);
}
