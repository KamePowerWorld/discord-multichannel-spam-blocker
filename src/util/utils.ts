import { EmbedBuilder } from "discord.js";

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
