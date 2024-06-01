import {
  GatewayIntentBits,
  Client,
  Partials,
  Message,
  TextChannel,
  Interaction,
  Events,
  CacheType,
} from "discord.js";
import dotenv from "dotenv";
import { commands } from "./commands";
// import { deployCommands } from "./commandregister";
import loadConfig from "./config/config";
import { MessageListener, MessageType } from "./listener/messagelister";
import { getLogEmbedMessage, getSpamLogEmbed } from "./util/utils";

const config = loadConfig();

dotenv.config();

const token = process.env.TOKEN;

// if (token && clientId) {
//   const rest = new REST({ version: "10" }).setToken(token);
//   deployCommands(clientId, rest);
// }

class CustomClient {
  private client: Client;
  private token: string;
  private messageListener: MessageListener;
  private log_channel: TextChannel | undefined;
  private test_channels: TextChannel[] = [];

  constructor(client: Client, token: string) {
    this.token = token;
    this.client = client;
    this.messageListener = new MessageListener(config);

    this.client.on(Events.ClientReady, async () => {
      await this.onReady();
    });
    this.client.on(Events.MessageCreate, this.onMessageCreate.bind(this));
    this.client.on(Events.InteractionCreate, this.onInteractionCreate.bind(this));
    this.client.on(Events.Error, (error) => {
      this.log_channel?.send({ embeds: [getLogEmbedMessage("Error", error.message, true, "error")] });
    });
  }

  public getClient() {
    return this.client;
  }

  public async onReady() {
    console.log(`Ready! ${this.client.user?.tag}`);

    const exclusive_server = this.client.guilds.cache.find(
      (guild) => guild.id === config.exclusive_server_id,
    );

    this.log_channel = (await exclusive_server?.channels.fetch(
      config.log_channel_id,
    )) as TextChannel;

    if (config.test_channel_ids) {
      this.test_channels = await Promise.all(config.test_channel_ids.map(async (id) => (await exclusive_server?.channels.fetch(id)) as TextChannel));
    }

    if (this.log_channel) {
      // log_channel.send({embeds: [getLogEmbedMessage("Info", "Bot is ready!", true, "info")]});
    }

    this.messageListener.setOnMultiPostSpammingDetected(async (messages) => {
      await this.onSpam(messages);
    });

    this.test_channels.forEach((channel) => {
      channel.messages.channel.bulkDelete(100);
    });
  }

  async onSpam(messages: MessageType[]) {
    const member = await messages[0].message.guild?.members.fetch(messages[0].message.author.id);
    if (member && member.kickable) {
      const hasrole = member.roles.cache.map((role) => role.id == role.id).includes(true);
      if (hasrole) {
        messages.forEach(async (message) => {
          if (message.message && message.message?.deletable) {
            await message.message.delete().catch((error) => {

            });
          }
        });

        await member.timeout(config.timeout_duration, "スパム行為、マルチポストを行ったため自動でタイムアウト処置を行いました。");
        await this.log_channel?.send({ embeds: [await getSpamLogEmbed(messages[0].message.author, messages.map((message => message.message)))] });
      }
      else {
        await this.log_channel?.send({ embeds: [getLogEmbedMessage("スキップ", "このメンバーはホワイトリストに含まれているため、スキップしました", true, "info")] });
      }
    }
    else {
      await this.log_channel?.send({ embeds: [getLogEmbedMessage("スキップ", "このメンバーはキックできないため、スキップしました", true, "info")] });
    }
  }

  public onMessageCreate(message: Message<boolean>) {
    if (message.author.bot) {
      return;
    }
    this.messageListener.addMessage(message);
  }

  public onInteractionCreate(interaction: Interaction<CacheType>) {
    if (!interaction.isCommand()) {
      return;
    }
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
      // commands[commandName as keyof typeof commands].execute(interaction);
    }
  }

  public async login() {
    this.client.login(this.token);
  }
}

if (token) {
  const client = new CustomClient(
    new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageTyping,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    }),
    token,
  );

  client.login();
}
