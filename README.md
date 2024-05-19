# Discord AutoMod

- [ ] マルチポストスパム検知

## 起動方法

```
pnpm i
```

テスト
```
pnpm run test
```

ビルド
```
tsc -p .
```

スタート
```
pnpm run start
```

## コンフィグ


| 設定名 | 説明 | デフォルトの値 | 型 | 備考 |
| ---- | ---- | ---- | ---- | ---- |
| `exclusive_server_id` | BOTの専属サーバーのID | ? | `string` | 必須。 ないと動かない。 |
| `exclusive_server_name` | BOTの専属サーバーの名前 | ? | `string` | 別になくても動く |
| `log_channel_id` | ログを吐き出すチャンネルのID | ? | `string` | 必須。 ~~ログを出してるところを消せばなくても動くと思うけど~~ログがないと何が起きてるかわからない。 |
| `cooldown` | 同じメッセージを送信できる間隔 | 300 | `number` | 特になし |
| `warning_role_id` | 警告ロールのID | ? | `string` | これを付けて疑似タイムアウトとかできる...と思われる |
| `timeout_duration` | タイムアウトする期間 | 6048000000 | `number` | ミリセカンドだけど普通に秒に直したい |
| `max_allows_multi_post_channels_count` | マルチポストができるチャンネルの個数 | 3 | `number` | マルチポスト型のスパム許さん(( |
| `test_channel_id` | テストチャンネルのID | ? | `string[]` | テストなので再起動後に履歴を削除するように(なくても動く) |
# 今後追加したい機能&整えたいもの

- [ ] コマンドのヘルプ
- [ ] 型定義
- [ ] 型定義
- [ ] 型定義
