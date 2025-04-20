import { EmbedBuilder, Message, MessageCreateOptions, User } from 'discord.js';

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
 * @returns スパムログ用のメッセージオプション。
 */
export function createSpamLogMessage(user: User, messages: Message[]): MessageCreateOptions {
  /**
   *
   */
  const content = messages[0].content;
  return {
    /**
     *
     */
    files: [...messages[0].attachments.values()],
    /**
     *
     */
    embeds: [
      new EmbedBuilder()
        .setTitle('連投検知')
        .setDescription(`${user.displayName} (<@${user.id}>) が複数チャンネルで連投しました`)
        .addFields([
          {
            name: '送信したチャンネル',
            value: messages.map(message => `<t:${Math.floor(message.createdTimestamp / 1000)}:R> <#${message.channel.id}>`).join('\n'),
          },
          {
            /**
             *
             */
            name: 'メッセージ内容',
            /**
             *
             */
            value: `${content.length > 0 ? content : '画像のみ'}`,
          },
        ])
        .setAuthor({
          /**
           *
           */
          name: user.displayName,
          /**
           *
           */
          iconURL: user.displayAvatarURL(),
        })
        .setColor('Red')
    ]
  }
}
