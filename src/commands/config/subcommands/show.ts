import { CommandInteraction, EmbedBuilder } from "discord.js";
import loadConfig from "../../../config/config";
import { getLogEmbedMessage } from "../../../util/utils";

export function show(interaction: CommandInteraction): EmbedBuilder {
  const config = loadConfig() as Record<string, Object>;
  const key = (interaction.options.data[0] as any).options[0].value;
  const value = config[key];

  return getLogEmbedMessage(key, `value: ${value}`, true, "info");
}
