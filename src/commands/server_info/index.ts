import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getLogEmbedMessage } from "../../util/utils";

export const data = new SlashCommandBuilder()
  .setName("server_info")
  .setDescription("サーバーの情報を表示します");

export async function execute(interaction: CommandInteraction) {
  await interaction.reply({
    embeds: [
      getLogEmbedMessage(
        "Server Info",
        `Server name: ${interaction.guild?.name}\nTotal members: ${interaction.guild?.memberCount}`,
        true,
        "info",
      ),
    ],
    ephemeral: true
  });
}
