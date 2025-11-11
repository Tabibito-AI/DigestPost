# DigestPost - AIニュースキュレーターbot

## 概要

**DigestPost** は、CNN、BBC、Bloombergなどの有名な海外メディアから最新のニュース記事を自動的に取得し、Manus LLM APIを使用してAIが生成した要約文と漫画風の画像と共に、5時間ごと（カスタマイズ可能）にX (Twitter) アカウントへ自動投稿するフルスタックWebアプリケーションです。

## 主な機能

- **自動ニューススクレイピング**: CNN、BBC、Bloomberg、Reuters、Fox News、The Guardian、NPR、AP Newsなどの主要メディアからRSSフィードを使用してニュース記事を自動取得
- **AI要約生成**: Manus LLM APIが記事を140文字以内に詳しく、簡潔に要約
- **漫画風画像生成**: AIが生成した画像プロンプトを基に、マンガイラストレーション風の視覚的に魅力的なツイート画像を生成
- **自動投稿スケジューラー**: 5時間ごと（1時間～24時間の間で柔軟に設定可能）にニュース取得から投稿までの全処理を自動実行
- **手動実行機能**: ホーム画面から「今すぐ投稿実行」ボタンでテスト投稿や即座の投稿が可能
- **投稿履歴管理**: 過去に投稿されたツイート内容、生成画像、元ニュースへのリンクを一覧で確認
- **柔軟なスケジュール設定**: ユーザーが投稿間隔を1時間から24時間まで自由に設定可能

## デプロイURL

**本番環境**: https://digestpost-e7pgjoh2.manus.space

## スタート画面

![DigestPost スタート画面](./screenshot.jpg)

ログイン後、以下の機能にアクセスできます：
- **手動でニュースを投稿**: 設定を選択して「今すぐ投稿実行」ボタンをクリックすると、即座にニュース取得からX投稿までの全処理を実行
- **設定を管理**: X APIキーを登録し、投稿間隔をカスタマイズ
- **投稿履歴を確認**: 過去に投稿されたツイートと元記事を確認

## アーキテクチャ

### フロントエンド
- **フレームワーク**: Next.js (React 19) + TypeScript
- **スタイリング**: Tailwind CSS 4
- **UI コンポーネント**: shadcn/ui
- **状態管理**: tRPC + React Query

### バックエンド
- **フレームワーク**: Express.js (Node.js) + TypeScript
- **API**: tRPC 11 (type-safe RPC)
- **認証**: Manus OAuth
- **スケジューリング**: node-cron (5時間ごとの自動実行)
- **ニュース取得**: rss-parser (RSS フィード取得)
- **AI統合**: Manus LLM API (要約生成)
- **画像生成**: Manus Image Generation API (漫画風画像生成)
- **X (Twitter) 統合**: twitter-api-v2 (ツイート投稿)

### データベース
- **DBMS**: PostgreSQL
- **ORM**: Drizzle ORM
- **テーブル**:
  - `users`: ユーザー情報（Manus OAuth連携）
  - `user_configs`: ユーザーの投稿設定（X APIキー、投稿間隔）
  - `posted_tweets`: 投稿履歴（ツイート内容、画像URL、元記事情報）

### システムアーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                     フロントエンド (Next.js)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ホーム画面 │ 設定ページ │ 投稿履歴ページ │ ナビゲーション │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ tRPC (type-safe RPC)
┌──────────────────────▼──────────────────────────────────────┐
│                   バックエンド (Express.js)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ tRPC ルーター                                        │   │
│  │ ├─ config: 設定管理 (CRUD)                          │   │
│  │ ├─ tweets: 投稿履歴管理                             │   │
│  │ ├─ manual: 手動実行                                │   │
│  │ └─ auth: 認証                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 自動投稿エンジン                                      │   │
│  │ ├─ スクレイパー (RSS フィード取得)                   │   │
│  │ ├─ コンテンツ生成 (Manus LLM API)                   │   │
│  │ ├─ 画像生成 (Manus Image Generation)               │   │
│  │ ├─ Twitter 投稿 (twitter-api-v2)                   │   │
│  │ └─ スケジューラー (node-cron)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼────┐  ┌─────▼─────┐  ┌────▼──────────┐
│ PostgreSQL │  │ Manus API │  │ X (Twitter)  │
│ Database   │  │ (LLM, IMG)│  │ API          │
└────────────┘  └───────────┘  └─────────────┘
```

## デプロイ方法

### 前提条件
- Node.js 22.x以上
- PostgreSQL 12.x以上
- Manus アカウント（LLM API、画像生成API、OAuth）
- X (Twitter) API キー（オプション：実際のツイート投稿時に必要）

### 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/digestpost

# Manus OAuth
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
JWT_SECRET=your_jwt_secret

# Manus API
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_manus_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key

# アプリケーション設定
VITE_APP_TITLE=DigestPost
VITE_APP_LOGO=https://your-domain.com/logo.png
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
```

### ローカル開発環境でのセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/tomoto0/DigestPost.git
cd DigestPost

# 依存関係をインストール
pnpm install

# データベーススキーマを適用
pnpm db:push

# 開発サーバーを起動
pnpm dev
```

開発サーバーは `http://localhost:3000` で起動します。

### Manusプラットフォームへのデプロイ

1. **プロジェクト初期化**
   ```bash
   # Manusプラットフォーム上で新しいプロジェクトを作成
   # テンプレート: Web App (tRPC + Manus Auth + Database)
   ```

2. **環境変数の設定**
   - Manus Management UI の Settings → Secrets で環境変数を設定

3. **データベーススキーマの適用**
   ```bash
   pnpm db:push
   ```

4. **デプロイ**
   - Manus Management UI の Publish ボタンをクリック
   - チェックポイントが必要（`webdev_save_checkpoint` で作成）

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| バックエンド | Express.js 4, Node.js, TypeScript, tRPC 11 |
| データベース | PostgreSQL, Drizzle ORM |
| 認証 | Manus OAuth |
| AI/ML | Manus LLM API (要約生成), Manus Image Generation API |
| スケジューリング | node-cron |
| ニュース取得 | rss-parser |
| Twitter 統合 | twitter-api-v2 |

## ファイル構成

```
DigestPost/
├── client/                          # フロントエンド (Next.js)
│   ├── src/
│   │   ├── pages/                  # ページコンポーネント
│   │   │   ├── Home.tsx            # ホームページ
│   │   │   ├── Settings.tsx        # 設定ページ
│   │   │   └── History.tsx         # 投稿履歴ページ
│   │   ├── components/             # UI コンポーネント
│   │   ├── lib/trpc.ts             # tRPC クライアント設定
│   │   ├── App.tsx                 # ルーティング
│   │   └── main.tsx                # エントリーポイント
│   ├── public/                     # 静的ファイル
│   └── index.html                  # HTML テンプレート
│
├── server/                          # バックエンド (Express.js)
│   ├── routers.ts                  # tRPC ルーター定義
│   ├── db.ts                       # データベースクエリヘルパー
│   ├── modules/                    # ビジネスロジック
│   │   ├── scraper.ts             # ニュース記事スクレイピング
│   │   ├── contentGenerator.ts    # AI要約生成
│   │   ├── imageGenerator.ts      # 画像生成
│   │   ├── twitterPoster.ts       # Twitter投稿
│   │   └── scheduler.ts           # スケジューラー
│   ├── _core/                      # フレームワーク機能
│   │   ├── index.ts               # Express サーバー設定
│   │   ├── llm.ts                 # Manus LLM API
│   │   ├── imageGeneration.ts     # Manus Image Generation API
│   │   ├── context.ts             # tRPC コンテキスト
│   │   └── trpc.ts                # tRPC 設定
│   └── storage.ts                  # S3 ストレージ
│
├── drizzle/                         # データベーススキーマ
│   ├── schema.ts                   # テーブル定義
│   └── migrations/                 # マイグレーションファイル
│
├── shared/                          # 共有コード
│   └── const.ts                    # 定数
│
├── .env.example                     # 環境変数テンプレート
├── package.json                     # 依存関係
├── tsconfig.json                    # TypeScript 設定
├── vite.config.ts                   # Vite 設定
├── drizzle.config.ts                # Drizzle ORM 設定
└── README.md                        # このファイル
```

## 主要な API エンドポイント (tRPC)

### 設定管理 (`config`)
- `config.list`: ユーザーの全設定を取得
- `config.get`: 特定の設定を取得
- `config.upsert`: 設定を作成または更新
- `config.delete`: 設定を削除
- `config.toggleActive`: 設定の有効/無効を切り替え
- `config.updateScheduleInterval`: 投稿間隔を更新

### 投稿履歴 (`tweets`)
- `tweets.list`: 設定の投稿履歴を取得（ページネーション対応）
- `tweets.count`: 投稿履歴の総数を取得

### 手動実行 (`manual`)
- `manual.executePost`: 指定の設定でニュース取得から投稿までを実行

### 認証 (`auth`)
- `auth.me`: 現在のユーザー情報を取得
- `auth.logout`: ログアウト

## 開発ガイド

### 新機能の追加

1. **データベーススキーマの更新** (必要な場合)
   ```bash
   # drizzle/schema.ts を編集
   pnpm db:push
   ```

2. **データベースクエリヘルパーの追加** (server/db.ts)
   ```typescript
   export async function getNewData() {
     const db = await getDb();
     // クエリ実装
   }
   ```

3. **tRPC プロシージャの追加** (server/routers.ts)
   ```typescript
   newFeature: protectedProcedure
     .input(z.object({ /* ... */ }))
     .query/mutation(async ({ input, ctx }) => {
       // 実装
     })
   ```

4. **フロントエンドコンポーネントの実装** (client/src/pages/)
   ```typescript
   const { data } = trpc.newFeature.useQuery();
   ```

### ローカルテスト

```bash
# 開発サーバーを起動
pnpm dev

# TypeScript チェック
pnpm tsc --noEmit

# ビルド
pnpm build
```

## トラブルシューティング

### RSS フィード取得エラー
- 一部のニュースサイトはアクセス制限がある場合があります
- スクレイパーはフォールバック機能を備えており、複数のソースから自動的に記事を取得します

### X API 投稿エラー
- API キーが正しく設定されているか確認してください
- X API の利用制限に達していないか確認してください
- 設定ページで API キーを再度入力してください

### スケジューラーが実行されない
- サーバーが起動しているか確認してください
- 設定が有効（isActive = true）になっているか確認してください
- サーバーログを確認してください

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題が発生した場合は、GitHubのIssueセクションで報告してください。

---

**最終デプロイ日**: 2025年11月11日  
**デプロイURL**: https://digestpost-e7pgjoh2.manus.space
