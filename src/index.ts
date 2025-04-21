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
import {
  NotExpectError,
  NotFoundError,
  NotReadyError,
  NotSettedError,
} from './error/errors';

const config = loadConfig();

dotenv.config();

const token = process.env.TOKEN;

class CustomClient {
  private _client: Client;
  private _token: string;
  private _messageListener: MessageListener;
  private _logChannel: TextChannel | undefined;
  private _testChannels: TextChannel[] = [];

  constructor(client: Client, token: string) {
    this._token = token;
    this._client = client;
    this._messageListener = new MessageListener(config);

    this._client.on(Events.ClientReady, () => {
      void this.onReady();
    });
    this._client.on(Events.MessageCreate, this.onMessageCreate.bind(this));
    this._client.on(Events.Error, (error) => {
      if (!this._logChannel)
        throw new NotReadyError('準備が完了していません。');
      void this._logChannel.send({
        embeds: [getLogEmbedMessage('Error', error.message, true, 'error')],
      });
    });
  }

  public getClient(): Client {
    return this._client;
  }

  public async onReady(): Promise<void> {
    console.log(`Ready! ${this._client.user?.tag}`);

    const exclusiveServer = this._client.guilds.cache.find(
      (guild) => guild.id === config.exclusive_server_id,
    );

    if (!exclusiveServer) {
      throw new NotFoundError('対象のサーバーが見つかりません。');
    }

    const maybeLogChannel = await exclusiveServer.channels.fetch(
      config.log_channel_id,
    );

    if (
      !maybeLogChannel ||
      (maybeLogChannel && maybeLogChannel.type !== ChannelType.GuildText)
    ) {
      throw new NotExpectError(
        'ログチャンネルがテキストチャンネルではありません。',
      );
    }

    this._logChannel = maybeLogChannel;

    if (config.test_channel_ids) {
      this._testChannels = await Promise.all(
        config.test_channel_ids.map(
          async (id) =>
            (await exclusiveServer.channels.fetch(id)) as TextChannel,
        ),
      );
    }

    if (this._logChannel) {
      // log_channel.send({embeds: [getLogEmbedMessage("Info", "Bot is ready!", true, "info")]});
    }

    this._messageListener.setOnMultiPostSpammingDetected((messages) => {
      void this.onSpam(messages);
    });

    for (const channel of this._testChannels) {
      await channel.messages.channel.bulkDelete(100);
    }
  }

  async onSpam(messages: MessageType[]): Promise<void> {
    const message = messages[0].message;
    const member = await message.guild?.members.fetch(message.author.id);

    if (!this._logChannel) throw new NotReadyError('準備が完了していません。');

    if (!member) {
      await this._logChannel.send({
        embeds: [
          getLogEmbedMessage(
            'エラー',
            `メンバー情報 <@${message.author.id}> の取得に失敗したため、スキップしました`,
            true,
            'error',
          ),
        ],
      });
      return;
    }

    const isWhitelistedMember =
      member.roles.cache.find((role) =>
        config.whitelist_role_ids.includes(role.id),
      ) !== undefined;
    if (isWhitelistedMember) {
      await this._logChannel.send({
        embeds: [
          getLogEmbedMessage(
            'スキップ',
            `<@${message.author.id}>はホワイトリストに含まれているため、スキップしました`,
            true,
            'info',
          ),
        ],
      });
      return;
    }

    // ログを送信
    await this._logChannel.send(
      createSpamLogMessage(
        message.author,
        messages.map((message) => message.message),
      ),
    );

    // タイムアウト
    try {
      await member.timeout(
        config.timeout_duration,
        'スパム行為、マルチポストを行ったため自動でタイムアウト処置を行いました。',
      );
    } catch (_error) {
      await this._logChannel.send({
        embeds: [
          getLogEmbedMessage(
            'スキップ',
            `<@${message.author.id}>はタイムアウトできないため、スキップしました`,
            true,
            'warn',
          ),
        ],
      });
    }

    // メッセージを削除
    for (const message of messages) {
      if (message.message && message.message?.deletable) {
        await message.message.delete().catch((_error) => {
          /* 何もしない */
        });
      }
    }
  }

  public onMessageCreate(message: Message<boolean>): void {
    if (message.author.bot) {
      return;
    }
    this._messageListener.addMessage(message);
  }

  public async login(): Promise<void> {
    await this._client.login(this._token);
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
} else {
  throw new NotSettedError('トークンが設定されていません。');
}
