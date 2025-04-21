import {
  GatewayIntentBits,
  Client,
  Partials,
  Message,
  TextChannel,
  Events,
  ChannelType,
} from 'discord.js';
import dotenv from 'dotenv';
import loadConfig from './config/config';
import { MessageListener, MessageType } from './listener/messagelister';
import { getLogEmbedMessage, createSpamLogMessage } from './util/utils';
import { NotExpectError, NotFoundError, NotReadyError, NotSettedError } from './error/errors';

const config = loadConfig();

dotenv.config();

const token = process.env.TOKEN;

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

    this.client.on(Events.ClientReady, () => {
      void this.onReady();
    });
    this.client.on(Events.MessageCreate, this.onMessageCreate.bind(this));
    this.client.on(Events.Error, (error) => {
      if (!this.log_channel) throw new NotReadyError('準備が完了していません。');
      void this.log_channel.send({ embeds: [getLogEmbedMessage('Error', error.message, true, 'error')] });
    });
  }

  public getClient(): Client {
    return this.client;
  }

  public async onReady(): Promise<void> {
    console.log(`Ready! ${this.client.user?.tag}`);

    const exclusive_server = this.client.guilds.cache.find(
      (guild) => guild.id === config.exclusive_server_id,
    );

    if (!exclusive_server) {
      throw new NotFoundError('対象のサーバーが見つかりません。');
    }

    const maybe_log_channel = (await exclusive_server.channels.fetch(
      config.log_channel_id,
    ))

    if (
      !maybe_log_channel ||
      (maybe_log_channel && maybe_log_channel.type !== ChannelType.GuildText) 
    ) {
      throw new NotExpectError('ログチャンネルがテキストチャンネルではありません。');
    }

    this.log_channel = maybe_log_channel;

    if (config.test_channel_ids) {
      this.test_channels = await Promise.all(config.test_channel_ids.map(async (id) => (await exclusive_server.channels.fetch(id)) as TextChannel));
    }

    if (this.log_channel) {
      // log_channel.send({embeds: [getLogEmbedMessage("Info", "Bot is ready!", true, "info")]});
    }

    this.messageListener.setOnMultiPostSpammingDetected((messages) => {
      void this.onSpam(messages);
    });

    for (const channel of this.test_channels){
      await channel.messages.channel.bulkDelete(100);
    }
  }

  async onSpam(messages: MessageType[]): Promise<void> {
    const message = messages[0].message;
    const member = await message.guild?.members.fetch(message.author.id);

    if (!this.log_channel) throw new NotReadyError('準備が完了していません。');

    if (!member) {
      await this.log_channel.send({ embeds: [getLogEmbedMessage('エラー', `メンバー情報 <@${message.author.id}> の取得に失敗したため、スキップしました`, true, 'error')] });
      return;
    }

    const isWhitelistedMember = member.roles.cache.find((role) => config.whitelist_role_ids.includes(role.id)) !== undefined;
    if (isWhitelistedMember) {
      await this.log_channel.send({ embeds: [getLogEmbedMessage('スキップ', `<@${message.author.id}>はホワイトリストに含まれているため、スキップしました`, true, 'info')] });
      return;
    }

    // ログを送信
    await this.log_channel.send(createSpamLogMessage(message.author, messages.map((message => message.message))));

    // タイムアウト
    try {
      await member.timeout(config.timeout_duration, 'スパム行為、マルチポストを行ったため自動でタイムアウト処置を行いました。');
    } catch (error) {
      await this.log_channel.send({ embeds: [getLogEmbedMessage('スキップ', `<@${message.author.id}>はタイムアウトできないため、スキップしました`, true, 'warn')] });
    }

    // メッセージを削除
    for (const message of messages) {
      if (message.message && message.message?.deletable) {
        await message.message.delete().catch((_error) => {/* 何もしない */});
      }
    }
  }

  public onMessageCreate(message: Message<boolean>): void {
    if (message.author.bot) {
      return;
    }
    this.messageListener.addMessage(message);
  }

  public async login(): Promise<void> {
    await this.client.login(this.token);
  }
}

if (token) {
  const client = new CustomClient(
    new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    }),
    token,
  );

  void client.login();
}else {
  throw new NotSettedError('トークンが設定されていません。');
}
