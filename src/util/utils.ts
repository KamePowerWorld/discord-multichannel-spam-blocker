import { EmbedBuilder, Message, MessageCreateOptions, User } from 'discord.js';

/**
 *
 * @param title
 * @param message
 * @param settimestamp
 * @param loglevel
 */
export function getLogEmbedMessage(
  title: string,
  message: string,
  settimestamp: boolean,
  loglevel: 'info' | 'warn' | 'error',
) {
  /**
   *
   */
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
 *
 * @param embed
 * @param user
 */
export function setAuthor(embed: EmbedBuilder, user: User) {
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
 *
 * @param message
 */
export async function getEmbed(message: string) {
  return new EmbedBuilder().setDescription(message);
}
/**
 *
 * @param user
 * @param messages
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
            /**
             *
             */
            name: '送信したチャンネル',
            /**
             *
             */
            value: messages.map(message=>`<t:${Math.floor(message.createdTimestamp / 1000)}:R> <#${message.channel.id}>`).join('\n'),
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