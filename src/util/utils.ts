import { EmbedBuilder, Message, User } from 'discord.js';

export function getLogEmbedMessage(
  title: string,
  message: string,
  settimestamp: boolean,
  loglevel: 'info' | 'warn' | 'error',
) {
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

export function setAuthor(embed: EmbedBuilder, user: User) {
  return embed.setAuthor({
    name: user.displayName,
    iconURL: user.avatarURL()?.toString(),
  });
}

export async function getEmbed(message: string) {
  return new EmbedBuilder().setDescription(message);
}
export function getSpamLogEmbed(user: User, messages: Message[]) {
  return new EmbedBuilder()
    .setTitle('連投検知')
    .setDescription(`${user.displayName} (<@${user.id}>) が複数チャンネルで連投しました`)
    .addFields([
      {
        name: '送信したチャンネル',
        value: messages.map(message=>`<#${message.channel.id}>`).join('\n'),
      },
      {
        name: 'メッセージ内容',
        value: `${messages[0].content}`,
      }
    ])
    .setAuthor({
      name: user.displayName,
      iconURL: user.displayAvatarURL(),
    })
    .setColor('Red')
}