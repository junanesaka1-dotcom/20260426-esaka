# フロントエンドドキュメント

## 概要

フロントエンドは React 19 + TypeScript で実装された単一コンポーネント構成のチャット UI です。  
WebSocket 経由でバックエンドと通信し、Copilot のストリーミング応答をリアルタイム表示します。

## ファイル構成

```
frontend/src/
├── App.tsx       # メインコンポーネント（チャット UI + WebSocket ロジック）
├── App.css       # チャット UI スタイル
├── main.tsx      # React エントリポイント
└── index.css     # グローバルリセットスタイル
```

## コンポーネント: `App`

`App.tsx` に定義された単一の React 関数コンポーネントです。

### 型定義

```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'
```

### state 一覧

| state | 型 | 初期値 | 説明 |
|---|---|---|---|
| `messages` | `Message[]` | `[]` | チャット履歴 |
| `input` | `string` | `''` | 入力フォームのテキスト |
| `status` | `ConnectionStatus` | `'disconnected'` | WebSocket 接続状態 |
| `isStreaming` | `boolean` | `false` | ストリーミング応答中フラグ |

### ref 一覧

| ref | 型 | 説明 |
|---|---|---|
| `wsRef` | `WebSocket \| null` | WebSocket インスタンスへの参照 |
| `messagesEndRef` | `HTMLDivElement \| null` | 自動スクロール用の末尾要素 |

## WebSocket 接続管理

### 接続先

```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
```

プロトコル（`ws:` / `wss:`）は現在のページのプロトコルに合わせて自動選択されます。

### 接続フロー

1. コンポーネントマウント時に `connectWebSocket()` を呼び出し
2. 接続確立: `status` が `'connecting'` → `'connected'` に遷移
3. 切断時: `status` が `'disconnected'` に戻り、3 秒後に自動再接続
4. コンポーネントアンマウント時: `ws.close()` でクリーンアップ

### 受信メッセージの処理

| `type` | 処理内容 |
|---|---|
| `delta` | 最後のアシスタントメッセージにデルタテキストを追記（なければ新規追加） |
| `message` | 最後のアシスタントメッセージを完全な応答で上書き。`isStreaming` を `false` に |
| `done` | `isStreaming` を `false` に |
| `error` | `⚠️ Error: ...` 形式でアシスタントメッセージとして表示。`isStreaming` を `false` に |

## メッセージ送信

```typescript
wsRef.current.send(JSON.stringify({ type: 'chat', content: trimmed }))
```

送信条件：
- 入力が空でない
- WebSocket が `OPEN` 状態
- ストリーミング中でない（送信ボタン無効化）

## UI 構成

### レイアウト

```
┌─────────────────────────────┐
│  ヘッダー                    │  .header
│  "Copilot Chat"  [● status] │
├─────────────────────────────┤
│                             │
│  メッセージ一覧              │  .messages
│                             │
│  [user]   テキスト ────────►│  .message.user
│◄──── テキスト  [assistant]  │  .message.assistant
│                             │
│  [● ● ●] タイピング中       │  .typing-indicator
├─────────────────────────────┤
│  [テキスト入力]   [Send]     │  .input-area
└─────────────────────────────┘
```

### 接続状態インジケータ

| `status` | ドットの色 | アニメーション |
|---|---|---|
| `connected` | 緑 (`#4ade80`) | なし |
| `connecting` | 黄 (`#facc15`) | パルス（点滅） |
| `disconnected` | 赤 (`#f87171`) | なし |

### タイピングインジケータ

`isStreaming` が `true` かつ最後のメッセージがアシスタント以外のとき、3 つのドットのアニメーションを表示します。

## Markdown レンダリング

アシスタントのメッセージは `react-markdown` でレンダリングされます。

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
>
  {msg.content}
</ReactMarkdown>
```

| プラグイン | 機能 |
|---|---|
| `remarkGfm` | GitHub Flavored Markdown（テーブル、チェックボックス、取り消し線等） |
| `rehypeHighlight` | コードブロックのシンタックスハイライト（`highlight.js` ベース） |

コードブロックのスタイルは `highlight.js/styles/github.css` を使用します。

## スタイル

`App.css` にコンポーネント固有のスタイルが定義されています（ライトテーマ）。

| クラス | 要素 |
|---|---|
| `.app` | アプリ全体のラッパー（最大幅 900px、縦フレックス） |
| `.header` | ヘッダー（タイトル + 接続状態） |
| `.messages` | メッセージ一覧（スクロール可能な領域） |
| `.message.user` | ユーザーメッセージ（右寄せ、青背景 `#0969da`） |
| `.message.assistant` | アシスタントメッセージ（左寄せ、白背景 + ボーダー） |
| `.typing-indicator` | タイピングアニメーション（3 ドット） |
| `.input-area` | 入力フォームエリア |
| `.send-button` | 送信ボタン（青 `#0969da`、無効時は半透明） |

`index.css` にはグローバルリセットと `body` のフォント・背景設定が含まれます（背景色 `#f5f5f5`）。

## レスポンシブ対応

`@media (max-width: 600px)` でモバイル向けに以下を調整：

- メッセージ一覧のパディング縮小
- メッセージバブルの最大幅を 90% に拡大
- ヘッダー・入力エリアのパディング縮小
