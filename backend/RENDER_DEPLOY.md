# Render デプロイ設定

## MongoDB Atlas SSL 対応

Render 上の OpenSSL Security Level 2 が MongoDB Atlas と互換性がないため、`start.sh` を使用して SECLEVEL=1 を設定しています。

### Render の Start Command

Render ダッシュボードで **Start Command** を以下に変更してください:

```
./start.sh
```

Root Directory が `backend` の場合、`start.sh` はそのディレクトリ内にあります。

Root Directory がリポジトリルートの場合:

```
cd backend && ./start.sh
```
