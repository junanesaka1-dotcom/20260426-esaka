# WebSocket API リファレンス

## 接続エンドポイント

```
ws://localhost:3001/ws
```

開発環境では Vite プロキシ経由で `ws://localhost:5173/ws` からも接続可能です。

---

## メッセージプロトコル

すべてのメッセージは JSON 形式の文字列です。

### クライアント → サーバー

#### `chat` — ユーザーメッセージ送信

```json
{
  "type": "chat",
  "content": "TypeScript の型ガードについて教えてください"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"chat"` | メッセージ種別 |
| `content` | `string` | ユーザーの入力テキスト |

---

### サーバー → クライアント

#### `ready` — セッション準備完了

WebSocket 接続確立後、Copilot セッション作成が完了したときに送信されます。

```json
{
  "type": "ready"
}
```

#### `delta` — ストリーミング部分応答

アシスタントの応答が逐次配信されます。このメッセージは複数回連続して送信されます。

```json
{
  "type": "delta",
  "content": "TypeScript の型ガード"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"delta"` | メッセージ種別 |
| `content` | `string` | デルタ（差分）テキスト |

#### `message` — 応答完了メッセージ

アシスタントの応答が完結したときに、応答全文を含むメッセージが送信されます。

```json
{
  "type": "message",
  "content": "TypeScript の型ガードとは、..."
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"message"` | メッセージ種別 |
| `content` | `string` | 応答の全文 |

#### `done` — アイドル状態通知

セッションがアイドル状態になったとき（応答処理が完了し次のメッセージ待ち）に送信されます。

```json
{
  "type": "done"
}
```

#### `error` — エラー通知

サーバー側でエラーが発生したときに送信されます。

```json
{
  "type": "error",
  "content": "Session creation failed: ..."
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"error"` | メッセージ種別 |
| `content` | `string` | エラーメッセージ |

---

## メッセージフロー

```
クライアント                          サーバー
    │                                    │
    │──── WebSocket 接続 ──────────────►│
    │                                    │ createSession()
    │◄─── { type: "ready" } ────────────│
    │                                    │
    │──── { type: "chat", content } ───►│
    │                                    │ session.send({ prompt })
    │◄─── { type: "delta", content } ───│  ← 複数回
    │◄─── { type: "delta", content } ───│
    │◄─── { type: "message", content } ─│
    │◄─── { type: "done" } ─────────────│
    │                                    │
    │──── WebSocket 切断 ──────────────►│
    │                                    │ session.disconnect()
```

---

## HTTP エンドポイント

### `GET /health`

サーバーの死活確認。

**レスポンス:**

```json
{
  "status": "ok"
}
```
