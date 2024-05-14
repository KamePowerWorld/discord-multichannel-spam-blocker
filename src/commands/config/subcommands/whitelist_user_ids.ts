import { CommandInteraction, EmbedBuilder } from "discord.js";
import { getLogEmbedMessage } from "../../../util/utils";
import loadConfig, { saveConfig } from "../../../config/config";
import YAML from "yaml";

export function whitelist_user_ids(
  interaction: CommandInteraction,
): EmbedBuilder {
  const config = loadConfig();
  // const key = (interaction.options.data[0] as any).options[0].value;
  // const currentValue = (config as Record<string, Object>)[key];
  const add =
    ((interaction.options.data[0] as any).options[0].value as boolean) ?? true;
  const value = (interaction.options.data[0] as any).options[1].value;

  if (add) {
    (config.whitelist_user_ids ?? []).push(value);
  } else {
    config.whitelist_user_ids = (config.whitelist_user_ids ?? []).filter(
      (userid) => value != userid && value != null,
    );
  }

  saveConfig(YAML.stringify(config));

  return getLogEmbedMessage(
    "Exec Result",
    `${value} was ${add ? "added" : "removed"}.`,
    true,
    "info",
  );
}
