import fs from "fs";
import YAML from "yaml";
export type Config = {
  exclusive_server_id: string;
  log_channel_id: string;
  cooldown: number;
  timeout_duration: number;
  max_allows_multi_post_channels_count: number;
  test_channel_ids: string[];
  whitelist_role_ids: string[];
};

export default function loadConfig(): Config {
  const file = fs.readFileSync(
    __dirname + "../../../config/config.yml",
    "utf8",
  );
  const config = YAML.parse(file);

  return config;
}

export function saveConfig(config: string) {
  fs.writeFileSync(__dirname + "../../../config/config.yml", config);
}
