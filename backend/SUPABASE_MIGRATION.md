# Supabase 移行ガイド

## 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) にサインアップ/ログイン
2. 新規プロジェクトを作成
3. **Settings > API** から以下を取得:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_KEY`

## 2. スキーマの適用

1. Supabase ダッシュボード → **SQL Editor**
2. `supabase_schema.sql` の内容を貼り付けて実行

## 3. 環境変数の設定

### ローカル (`backend/.env`)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Render

1. サービス → **Environment**
2. 以下を追加:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

## 4. Render の Start Command

MongoDB 用の `./start.sh` は不要になりました。次のどちらかに戻してください:

```
uvicorn server:app --host 0.0.0.0 --port $PORT
```

## 5. 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

## 6. ローカルでテスト

```bash
cd backend
uvicorn server:app --reload
```

## 注意

- **Emergent Auth** はそのまま使用します（認証は変更なし）
- 既存の MongoDB データがある場合、別途マイグレーションスクリプトが必要です
- `service_role` キーは絶対にクライアント側に露出させないでください
