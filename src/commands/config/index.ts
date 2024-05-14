import {
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getLogEmbedMessage } from "../../util/utils";
import { show } from "./subcommands/show";
import { edit } from "./subcommands/edit";
import { whitelist_domains } from "./subcommands/whitelist_domains";
import { whitelist_user_ids } from "./subcommands/whitelist_user_ids";
import { blacklist_domains } from "./subcommands/blacklist_domains";

const show_config_choises = [
  { name: "Exclusive server id", value: "exclusive_server_id" },
  { name: "Exclusive server name", value: "exclusive_server_name" },
  { name: "Log channel id", value: "log_channel_id" },
  { name: "Cooldown", value: "cooldown" },
  { name: "Warning role id", value: "warning_role_id" },
  { name: "Timeout duration", value: "timeout_duration" },
  {
    name: "Max allows multi post channels count",
    value: "max_allows_multi_post_channels_count",
  },
];

const edit_config_choises = [
  { name: "Log channel id", value: "log_channel_id" },
  { name: "Cooldown", value: "cooldown" },
  { name: "Warning role id", value: "warning_role_id" },
  { name: "Timeout duration", value: "timeout_duration" },
  {
    name: "Max allows multi post channels count",
    value: "max_allows_multi_post_channels_count",
  },
];

export const data = new SlashCommandBuilder()
  .setName("config")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDescription("設定を表示、または編集します")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("show")
      .setDescription("設定を表示します")
      .addStringOption((option) =>
        option
          .setName("key")
          .setDescription("The key")
          .setRequired(true)
          .addChoices(show_config_choises),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("edit")
      .setDescription("設定を表示します")
      .addStringOption((option) =>
        option
          .setName("key")
          .setDescription("The key")
          .setRequired(true)
          .addChoices(edit_config_choises),
      )
      .addStringOption((option) =>
        option.setName("value").setDescription("The value").setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("blacklist_domains")
      .setDescription(
        "ブラックリストに登録されているドメインを追加または削除します",
      )
      .addBooleanOption((option) =>
        option
          .setName("add")
          .setDescription("デフォルトの値：true")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("value")
          .setDescription("ドメイン 例：example.com")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("whitelist_domains")
      .setDescription(
        "ホワイトリストに登録されているドメインを追加または削除します",
      )
      .addBooleanOption((option) =>
        option
          .setName("add")
          .setDescription("デフォルトの値：true")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("value")
          .setDescription("ドメイン 例：example.com")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("whitelist_user_ids")
      .setDescription(
        "ホワイトリストに登録されているユーザーIDを追加または削除します",
      )
      .addBooleanOption((option) =>
        option
          .setName("add")
          .setDescription("デフォルトの値：True")
          .setRequired(true),
      )
      .addUserOption((option) =>
        option.setName("value").setDescription("User id").setRequired(true),
      ),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: CommandInteraction) {
  let embed = getLogEmbedMessage(
    "Exec Result",
    `:( コマンドが見つかりませんでした)`,
    true,
    "error",
  );

  const subcommand = interaction.options.data[0];
  switch (subcommand.name) {
    case "show":
      embed = show(interaction);
      break;
    case "edit":
      embed = await edit(interaction);
      break;
    case "whitelist_domains":
      embed = whitelist_domains(interaction);
      break;
    case "blacklist_domains":
      embed = blacklist_domains(interaction);
      break;
    case "whitelist_user_ids":
      embed = whitelist_user_ids(interaction);
      break;
    default:
      break;
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
