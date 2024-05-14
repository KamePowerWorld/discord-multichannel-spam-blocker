import { CommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { getLogEmbedMessage } from "../../../util/utils";
import YAML from "yaml";
import loadConfig, { saveConfig } from "../../../config/config";

export async function edit(
  interaction: CommandInteraction,
): Promise<EmbedBuilder> {
  const config = loadConfig() as Record<string, Object>;
  const key = (interaction.options.data[0] as any).options[0].value;
  let value = (interaction.options.data[0] as any).options[1].value;
  const currentValue = config[key];

  let embed = getLogEmbedMessage(
    "Updated",
    `${key} ${currentValue}->${value}`,
    true,
    "info",
  );

  if (key == "log_channel_id") {
    const channel = await interaction.client.channels.fetch(value);

    if (channel && channel instanceof TextChannel) {
      const textchannel = channel as TextChannel;
      embed = getLogEmbedMessage(
        "Updated",
        `${key} ${currentValue}->${value}(${textchannel.name})`,
        true,
        "info",
      );
    }
  } else if (key == "cooldown") {
    value = parseInt(value);
  } else if (key == "warning_role_id") {
    const guild = interaction.guild;
    if (guild) {
      const role = await interaction.guild.roles.fetch(value);

      if (role) {
        embed = getLogEmbedMessage(
          "Updated",
          `${key} ${currentValue}->${value}(${role.name})`,
          true,
          "info",
        );
      }
    }
  }
  if (value) {
    config[key] = value;
  }

  saveConfig(YAML.stringify(config));

  return embed;
}
