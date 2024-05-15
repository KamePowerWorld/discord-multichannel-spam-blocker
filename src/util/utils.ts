import { EmbedBuilder, Message, TextChannel, User } from "discord.js";

export function getLogEmbedMessage(
  title: string,
  message: string,
  settimestamp: boolean,
  loglevel: "info" | "warn" | "error",
) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(message)
    .setColor(
      loglevel === "info" ? "Green" : loglevel === "warn" ? "Yellow" : "White",
    );
  if (settimestamp) {
    embed.setTimestamp();
  }

  return embed;
}

export async function getSpamLogEmbed(user: User, messages: Message[]) {
  const sent_channels = messages.map(async (message) => {
    const channel_name = (await message.guild?.channels.fetch(message.channel.id))?.name;
    return `ID:${message.channelId} チャンネル名:${channel_name}`;
  });
  
  return new EmbedBuilder()
    .setTitle("連投検知")
    .setDescription(`${user.displayName} (<@${user.id}>) が複数チャンネルで連投しました`)
    .addFields([
      {
        name: "送信したチャンネル",
        value: (await Promise.all(sent_channels)).join("\n"),
      },
      {
        name: "メッセージ内容",
        value: `${messages[0].content} ×${messages.length}`,
      }
    ])
    .setAuthor({
      name: user.displayName,
      iconURL: user.displayAvatarURL(),
    })
}