import { CommandInteraction, EmbedBuilder } from "discord.js";
import { getLogEmbedMessage } from "../../../util/utils";
import loadConfig, { saveConfig } from "../../../config/config";
import YAML from "yaml";

export function blacklist_domains(
  interaction: CommandInteraction,
): EmbedBuilder {
  const config = loadConfig();
  const add =
    ((interaction.options.data[0] as any).options[0].value as boolean) ?? true;
  const value = (interaction.options.data[0] as any).options[1].value;

  if (add) {
    config.blacklist_domains.push(value);
  } else {
    config.blacklist_domains = config.blacklist_domains.filter(
      (domain) => value != domain,
    );
  }

  saveConfig(YAML.stringify(config));

  return getLogEmbedMessage(
    "Exec Result",
    `Blacklist:${value} was ${add ? "added" : "removed"}.`,
    true,
    "info",
  );
}
