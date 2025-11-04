# DigestPost - ユーザーガイド

**Website URL:** https://3000-iy6wpxvzjz6knwb37572a-eac1c9f5.manus.computer

**Purpose:** CNN、BBC、Bloombergなどの有名メディアから自動的にニュースをスクレイピングし、AIが生成した要約文と画像と共に、5時間ごとにあなたのX (Twitter) アカウントへ自動投稿します。

**Access:** ログイン必須（Manus OAuth）

---

## Powered by Manus

DigestPostは、最先端のAIテクノロジーとクラウドインフラストラクチャで構築されています。

**技術スタック:**
- **フロントエンド:** React 19 + TypeScript + Tailwind CSS 4
- **バックエンド:** Express 4 + Node.js + tRPC 11
- **データベース:** PostgreSQL
- **AI機能:** Manus LLM API（記事要約生成）、Manus画像生成API
- **スクレイピング:** Playwright（ヘッドレスブラウザ自動化）
- **スケジューリング:** node-cron（5時間ごとの自動実行）
- **Deployment:** Auto-scaling infrastructure with global CDN

---

## Using Your Website

### 1. 設定ページでX APIキーを登録

「設定」ページに移動し、以下の情報を入力してください：

- **API Key:** X (Twitter) の API キー
- **API Secret:** X (Twitter) の API シークレット
- **Access Token:** X (Twitter) のアクセストークン
- **Access Token Secret:** X (Twitter) のアクセストークンシークレット

「保存」ボタンをクリックして設定を登録します。登録後、「有効」トグルで自動投稿のON/OFFを切り替えられます。

### 2. 自動投稿の開始

設定を登録して「有効」にすると、5時間ごとに以下の処理が自動実行されます：

1. CNN、BBC、Bloombergなどから**ランダムにニュース記事を選択**
2. **Manus LLM APIが記事を要約**（X の140文字制限に対応）
3. **AI画像生成で視覚的に魅力的な画像を作成**
4. **要約文と画像をX に自動投稿**

### 3. 投稿履歴を確認

「履歴」ページで、過去に投稿されたツイートを確認できます：

- 投稿されたツイートの内容
- AI生成された画像
- 元のニュース記事へのリンク
- 投稿日時とニュースソース

設定を選択すると、その設定で投稿されたツイートの履歴が表示されます。

---

## Managing Your Website

### 設定管理

**Settings パネル** → 「X (Twitter) 設定」セクション

- **新しい設定を追加:** 複数のX アカウントを登録可能
- **設定を有効/無効:** トグルスイッチで自動投稿のON/OFF
- **設定を削除:** 不要な設定を削除

### 投稿履歴管理

**Dashboard パネル** → 「投稿履歴」セクション

- 設定ごとの投稿履歴を表示
- ページネーション機能で過去の投稿を閲覧
- 元の記事へのリンクから詳細を確認

---

## Next Steps

Talk to Manus AI anytime to request changes or add features.

DigestPostの自動投稿機能を最大限に活用するために、今すぐX APIキーを設定ページで登録してください。5時間後、最初の自動投稿がX に表示されます。投稿履歴ページで、AIが生成したツイートと画像をいつでも確認できます。

**さらに詳しく知りたい場合:**
- X APIキーの取得方法については、[X Developer Portal](https://developer.twitter.com/) を参照してください
- 問題が発生した場合は、Manus AIに相談してください
