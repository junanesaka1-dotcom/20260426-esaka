# セットアップガイド

## 前提条件

- **Node.js**: 18 以上
- **npm**: 9 以上
- **GitHub Copilot SDK** が利用可能であること（`@github/copilot-sdk`）

## ディレクトリ構造

```
2.copilotWebRelay/
├── backend/
│   ├── src/
│   │   └── server.ts        # Express + WebSocket サーバー
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # チャット UI コンポーネント
│   │   ├── App.css          # チャット UI スタイル
│   │   ├── main.tsx         # React エントリポイント
│   │   └── index.css        # グローバルスタイル
│   ├── vite.config.ts       # Vite 設定（WebSocket プロキシ含む）
│   └── package.json
├── docs/                    # ドキュメント
└── package.json             # ルートモノレポ設定
```

## インストール

```bash
cd 2.copilotWebRelay

# バックエンドとフロントエンドの依存関係を一括インストール
npm run install:all
```

または個別にインストールする場合：

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 開発サーバーの起動

```bash
cd 2.copilotWebRelay

# バックエンド・フロントエンドを同時起動
npm run dev
```

- フロントエンド: `http://localhost:5173`
- バックエンド: `http://localhost:3001`

個別に起動する場合：

```bash
# バックエンド（tsx watch でホットリロード）
npm run dev:backend

# フロントエンド（Vite dev server）
npm run dev:frontend
```

## バックエンドのみ本番起動

```bash
cd backend

# TypeScript をビルド
npm run build

# 本番起動
npm start
```

ビルド済みファイルは `backend/dist/` に出力されます。

## 環境変数

| 変数名 | デフォルト値 | 説明 |
|---|---|---|
| `PORT` | `3001` | バックエンドのリッスンポート |

```bash
PORT=8080 npm start
```

## 依存パッケージ

### バックエンド

| パッケージ | バージョン | 用途 |
|---|---|---|
| `@github/copilot-sdk` | latest | Copilot セッション管理 |
| `express` | ^4.21.0 | HTTP サーバー |
| `ws` | ^8.18.0 | WebSocket サーバー |
| `cors` | ^2.8.5 | CORS ヘッダー設定 |
| `tsx` | ^4.19.0 | TypeScript 直接実行（開発用） |
| `typescript` | ^5.7.0 | TypeScript コンパイラ |

### フロントエンド

| パッケージ | バージョン | 用途 |
|---|---|---|
| `react` | ^19.2.4 | UI フレームワーク |
| `react-dom` | ^19.2.4 | DOM レンダリング |
| `react-markdown` | ^10.1.0 | Markdown レンダリング |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown |
| `rehype-highlight` | ^7.0.2 | コードシンタックスハイライト |
| `highlight.js` | ^11.11.1 | シンタックスハイライト本体 |
| `vite` | ^8.0.4 | ビルドツール・開発サーバー |
| `typescript` | ~6.0.2 | TypeScript コンパイラ |

## TypeScript 設定（バックエンド）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

## 開発時の注意事項

### WebSocket プロキシ

開発時、フロントエンドは `localhost:5173` で動作し、WebSocket 接続（`/ws`）は Vite が `localhost:3001` にプロキシします。  
`vite.config.ts` で以下のように設定されています：

```typescript
proxy: {
  '/ws': {
    target: 'http://localhost:3001',  // http:// を使う（ws:// ではない）
    ws: true,
  },
}
```

### Copilot SDK の認証

`@github/copilot-sdk` が利用する GitHub 認証は、サーバー起動前に完了している必要があります。  
認証設定は SDK のドキュメントを参照してください。
