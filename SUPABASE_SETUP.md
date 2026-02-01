# Supabase 完全移行ガイド

このアプリは Render バックエンドと Emergent Auth を廃止し、Supabase に完全移行しました。

## 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) にサインアップ/ログイン
2. 新規プロジェクトを作成
3. **Settings > API** から取得:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2. Google OAuth 設定

1. Supabase ダッシュボード → **Authentication** → **Providers** → **Google**
2. Google Cloud Console で OAuth 2.0 クライアント ID を作成
3. 認証済みリダイレクト URI に以下を追加:
   - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
   - 開発時: `exp://localhost:8081/--/` または `frontend://`
4. Client ID と Client Secret を Supabase に設定

## 3. スキーマの適用

1. Supabase ダッシュボード → **SQL Editor**
2. `supabase/migrations/001_initial_schema.sql` の内容を貼り付けて実行

## 4. 環境変数

`frontend/.env` を作成:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. リダイレクト URL の登録

Supabase ダッシュボード → **Authentication** → **URL Configuration**:

- **Redirect URLs** に以下を追加:
  - `frontend://` (Expo アプリ用)
  - `exp://localhost:8081/--/` (開発用)
  - Web 用: `http://localhost:8081/` など

## 6. バックエンドの削除

- `backend/` ディレクトリは不要になりました（削除または残置可能）
- Render のデプロイは停止して問題ありません

## 注意

- **EXPO_PUBLIC_SUPABASE_ANON_KEY** はクライアントに公開されます。RLS によりデータアクセスは制御されています。
- アカウント削除時、Supabase Auth のユーザーは残ります（完全削除には Edge Function が必要）。
