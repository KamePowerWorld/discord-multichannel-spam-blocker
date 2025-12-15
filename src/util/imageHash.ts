import { APIEmbedThumbnail, Attachment, Message } from 'discord.js';
import { createHash } from 'crypto';
import path from 'path';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
]);

const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

/**
 * 指定したメッセージに含まれる画像のハッシュを取得する
 * @param message チェック対象のメッセージ
 * @param timeoutMs ダウンロード時のタイムアウト
 * @returns ハッシュの配列
 */
export async function collectImageHashes(
  message: Message<boolean>,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<string[]> {
  const urls = new Set<string>();

  // 添付ファイルから画像URLを抽出
  for (const attachment of message.attachments.values()) {
    if (isImageAttachment(attachment)) {
      urls.add(attachment.url);
    }
  }

  // メッセージ本文から画像Placeholderを抽出
  // Discordがplaceholderフィールドにハッシュと同等な情報を入れてくれるため、それを利用する
  type APIEmbedThumbnailEx = APIEmbedThumbnail & {
    placeholder?: string;
  };
  const embeds = message.embeds
    .map((embed) => (embed.data.thumbnail as APIEmbedThumbnailEx)?.placeholder)
    .filter((url): url is string => typeof url === 'string');

  const hashes: string[] = [];
  // 埋め込みのプレースホルダーからハッシュを抽出
  hashes.push(...embeds);
  // 添付ファイルはダウンロードしてハッシュ化
  for (const url of urls) {
    const hash = await hashRemoteImage(url, timeoutMs);
    if (hash) {
      hashes.push(hash);
    }
  }

  return hashes;
}

function isImageAttachment(attachment: Attachment): boolean {
  if (attachment.contentType?.startsWith('image/')) {
    return true;
  }
  const ext = path.extname(attachment.name ?? attachment.url).toLowerCase();
  return Boolean(ext) && IMAGE_EXTENSIONS.has(ext);
}

function extractImageUrlsFromContent(content: string): string[] {
  const urls: string[] = [];
  const regex = /(https?:\/\/[^\s>]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const candidate = match[1];
    urls.push(candidate);
  }
  return urls;
}

async function hashRemoteImage(
  url: string,
  timeoutMs: number,
): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return undefined;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return createHash('sha256').update(buffer).digest('hex');
  } catch (_error) {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
