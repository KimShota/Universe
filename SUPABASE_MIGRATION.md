# Supabase 完全移行ガイド

このプロジェクトは **Supabase に完全移行** しています。Render と Emergent Auth は不要になり、フロントエンドが Supabase に直接接続します。

## 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) にサインアップ/ログイン
2. 新規プロジェクトを作成
3. **Settings > API** から取得:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2. Google OAuth の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. **API とサービス > 認証情報** で OAuth 2.0 クライアント ID を作成
   - Web アプリケーション用: リダイレクト URI に Supabase のコールバック URL を追加
   - Supabase Dashboard → **Authentication > Providers > Google** に表示される URL をコピー
3. Supabase Dashboard → **Authentication > Providers > Google** で Client ID と Secret を設定
4. **Authentication > URL Configuration** でリダイレクト URL を追加:
   - 開発 (Expo Go): コンソールに `[OAuth] Add this URL to Supabase Redirect URLs:` と表示される URL をそのまま追加
   - 本番 (スタンドアロン): `frontend://`
   - ※アプリは `frontend` カスタムスキームと `isValidDeepLink` でセキュアにディープリンクを検証します

## 3. スキーマの適用

1. Supabase ダッシュボード → **SQL Editor**
2. `supabase/migrations/001_initial_schema.sql` の内容を貼り付けて実行

## 4. 環境変数

### フロントエンド (`frontend/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`.env.example` をコピーして `.env` を作成し、値を設定してください。

## 5. アプリの起動

```bash
cd frontend
npm install
npx expo start
```

## アーキテクチャ

- **認証**: Supabase Auth (Google OAuth)
- **データ**: フロントエンドから直接 PostgREST API にアクセス
- **セキュリティ**: Row Level Security (RLS) で `auth.uid()` によるアクセス制御
- **バックエンド**: 不要（Render、Emergent Auth は削除済み）

## アカウント削除について

アカウント削除ボタンは、アプリ内の全データを削除しログアウトします。Supabase Auth のユーザーアカウント自体は残ります。完全なアカウント削除には Supabase Edge Function または管理 API の利用が必要です。
