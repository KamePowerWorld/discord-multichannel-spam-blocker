import fs from "fs";
import YAML from "yaml";
export type Config = {
  exclusive_server_id: string;
  exclusive_server_name: string;
  log_channel_id: string;
  cooldown: number;
  whitelist_domains: string[];
  blacklist_domains: string[];
  warning_role_id: string;
  whitelist_user_ids: string[];
  timeout_duration: number;
  max_allows_multi_post_channels_count: number;
};

export default function loadConfig(): Config {
  const file = fs.readFileSync(
    __dirname + "../../../config/config.yml",
    "utf8",
  );
  const config = YAML.parse(file);

  config.whitelist_user_ids = (config.whitelist_user_ids as string[]).filter(
    (value) => value != null && value,
  );
  config.whitelist_domains = (config.whitelist_domains as string[]).filter(
    (value) => value != null && value,
  );
  config.blacklist_domains = (config.blacklist_domains as string[]).filter(
    (value) => value != null && value,
  );

  return config;
}

export function saveConfig(config: string) {
  fs.writeFileSync(__dirname + "../../../config/config.yml", config);
}
