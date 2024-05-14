import {
  GatewayIntentBits,
  Client,
  Partials,
  Message,
  TextChannel,
  Interaction,
  Events,
  REST,
  CacheType,
} from "discord.js";
import dotenv from "dotenv";
import { commands } from "./commands";
import { deployCommands } from "./commandregister";
import loadConfig from "./config/config";
import { MessageListener } from "./listener/messagelister";
import { getLogEmbedMessage } from "./util/utils";

const config = loadConfig();

dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (token && clientId) {
  const rest = new REST({ version: "10" }).setToken(token);
  deployCommands(clientId, rest);
}

class CustomClient {
  private client: Client;
  private token: string;
  private messageListener: MessageListener;
  private log_channel: TextChannel | undefined;

  constructor(client: Client, token: string) {
    this.token = token;
    this.client = client;
    this.messageListener = new MessageListener(config);

    this.client.on(Events.ClientReady, async () => {
      await this.onReady();
    });
    this.client.on(Events.MessageCreate, (message) => {
      this.onMessageCreate(message);
    });
    this.client.on(Events.InteractionCreate, this.onInteractionCreate);
    this.client.on(Events.Error, (error) => {
      this.log_channel?.send({ embeds: [getLogEmbedMessage("Error", error.message, true, "error")] });
    });
  }

  public getClient() {
    return this.client;
  }

  public async onReady() {
    console.log("Ready!");

    if (this.client.user) {
      console.log(this.client.user.tag);
    }

    const exclusive_server = this.client.guilds.cache.find(
      (guild) => guild.id === config.exclusive_server_id,
    );
    console.log(exclusive_server?.name);

    this.log_channel = (await exclusive_server?.channels.fetch(
      config.log_channel_id,
    )) as TextChannel;

    if (this.log_channel) {
      // log_channel.send({embeds: [getLogEmbedMessage("Info", "Bot is ready!", true, "info")]});
    }

    this.messageListener.setOnMultiPostSpammingDetected(async (message) => {
      this.onSpam(message);
    });
  }

  onSpam(message: Message<boolean>) {
    message.member?.roles.add(config.warning_role_id);
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
      commands[commandName as keyof typeof commands].execute(interaction);
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
