# アーキテクチャ概要

## システム構成

Copilot Web Relay は、GitHub Copilot SDK をブラウザから利用可能にする Web アプリケーションです。  
Node.js バックエンドが Copilot SDK を仲介し、フロントエンドとはリアルタイム WebSocket で通信します。

```
┌──────────────────┐    WebSocket (/ws)    ┌────────────────────────┐    SDK    ┌───────────────────┐
│   Browser        │ ◄──────────────────── │  Backend Server        │ ◄──────── │  GitHub Copilot   │
│  React + TS      │    JSON メッセージ      │  Node.js / Express     │           │  (gpt-4.1)        │
│  (port 5173)     │                       │  (port 3001)           │           │                   │
└──────────────────┘                       └────────────────────────┘           └───────────────────┘
```

## コンポーネント

| コンポーネント | 技術スタック | 役割 |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | チャット UI、WebSocket クライアント |
| **Backend** | Node.js + Express + `ws` | WebSocket サーバー、Copilot SDK 仲介 |
| **Copilot SDK** | `@github/copilot-sdk` | Copilot セッション管理、ストリーミング応答 |

## バックエンド設計

### サーバー起動フロー

1. `main()` が `CopilotClient` を事前起動（`sharedClient`）
2. HTTP サーバー（port 3001）と WebSocket サーバーを同時起動
3. WebSocket 接続ごとに `client.createSession()` でセッションを作成

### CopilotClient の共有設計

`CopilotClient` はプロセス全体で1つのインスタンス（シングルトン）を共有します。  
WebSocket 接続ごとに `Session` を個別に作成し、切断時は `session.disconnect()` でクリーンアップします。

```
CopilotClient (共有シングルトン)
  └── Session (接続ごと)
        ├── assistant.message_delta イベント → delta メッセージ送信
        ├── assistant.message イベント       → message メッセージ送信
        └── session.idle イベント           → done メッセージ送信
```

### セッション設定

```typescript
client.createSession({
  model: "gpt-4.1",
  onPermissionRequest: approveAll,
  streaming: true,
})
```

- **モデル**: `gpt-4.1`
- **パーミッション**: すべての権限リクエストを自動承認（`approveAll`）
- **ストリーミング**: 有効（逐次デルタ配信）

## フロントエンド設計

- React 19 の関数コンポーネント（`App.tsx` 1ファイル構成）
- WebSocket 接続は `useEffect` + `useRef` で管理
- 切断時は 3 秒後に自動再接続
- アシスタントの応答は Markdown レンダリング（`react-markdown`）

## ポート構成

| 環境 | フロントエンド | バックエンド |
|---|---|---|
| 開発 | `http://localhost:5173` | `http://localhost:3001` |
| 本番 | バックエンドが静的ファイルを配信 | `http://localhost:3001` |

開発時は Vite の dev server が `/ws` パスをバックエンド（`localhost:3001`）にプロキシします。
