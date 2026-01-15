# 開発・改修ガイド

このドキュメントでは、DevOpsモダナイゼーション支援エージェントの改修手順と、GitHub・Vercelの使い方を説明します。

---

## 📋 目次

1. [開発環境の準備](#開発環境の準備)
2. [コードを修正する](#コードを修正する)
3. [GitHubへの反映（プッシュ）](#githubへの反映プッシュ)
4. [Vercelでの確認](#vercelでの確認)
5. [よくあるトラブルと対処法](#よくあるトラブルと対処法)

---

## 🛠️ 開発環境の準備

### 1. プロジェクトフォルダに移動

ターミナルを開き、以下のコマンドでプロジェクトフォルダに移動します。

```bash
cd "/Users/minorumiyauchi/Desktop/AI駆動エンジン商談/IGPF/devops-modernization-agent-vite"
```

### 2. 依存パッケージのインストール（初回のみ）

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` が自動的に開きます。ここで変更を確認しながら開発できます。

---

## ✏️ コードを修正する

### 修正の流れ

1. **エディタ（Cursor）でコードを編集**
   - `src/` フォルダ内のファイルを編集します
   - 主なファイル構成：
     - `src/components/` - Reactコンポーネント
     - `src/lib/` - ビジネスロジック（シナリオ定義など）
     - `src/store/` - 状態管理（Zustand）
     - `src/types/` - TypeScript型定義

2. **ローカルで動作確認**
   - `npm run dev` で起動したブラウザで確認
   - エラーが出たらターミナルに表示されます

3. **ビルドテスト（本番環境と同じ状態で確認）**
   ```bash
   npm run build
   ```
   - エラーが出なければOKです

---

## 📤 GitHubへの反映（プッシュ）

コードを修正したら、以下の手順でGitHubに反映します。

### 手順

#### 1. 変更内容を確認

```bash
git status
```

変更されたファイルの一覧が表示されます。

#### 2. 変更ファイルをステージング（追加）

```bash
# すべての変更を追加する場合
git add .

# 特定のファイルだけ追加する場合
git add src/components/ChatArea.tsx
```

#### 3. コミット（変更内容を記録）

```bash
git commit -m "修正内容の説明を記入"
```

**コミットメッセージの例：**
- `"fix: チャット画面のサイズを修正"`
- `"feat: メニュー管理機能を追加"`
- `"update: エラーメッセージを改善"`

#### 4. GitHubへプッシュ

```bash
git push
```

初回のみ、GitHubのユーザー名とPersonal Access Token（パスワードの代わり）の入力が求められます。

---

## 🌐 Vercelでの確認

### 自動デプロイの確認

GitHubへプッシュすると、**Vercelが自動的に検知してデプロイを開始**します。

1. **[Vercelダッシュボード](https://vercel.com/dashboard)にアクセス**
2. **プロジェクト（`modernization`）を選択**
3. **「Deployments」タブを確認**
   - 新しい行が追加され、ステータスが表示されます
   - `Building` → `Ready` になれば完了です

### デプロイ完了の確認

- **ステータスが「Ready」になったら完了**
- **「Visit」ボタンまたはURLをクリック**して、実際のサイトを確認
- 公開URL: [https://modernization-kappa.vercel.app/](https://modernization-kappa.vercel.app/)

### デプロイログの確認

デプロイ中にエラーが出た場合は、Vercelの「Deployments」画面で：
1. 該当するデプロイ行をクリック
2. 「Build Logs」タブでエラー内容を確認

---

## 🔧 よくあるトラブルと対処法

### 1. `git push` で認証エラーが出る

**エラー例：**
```
remote: Invalid username or token
fatal: Authentication failed
```

**対処法：**
- GitHubのPersonal Access Tokenを再生成して使用してください
- トークンの取得方法は[GitHub公式ドキュメント](https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)を参照

### 2. ビルドエラーが発生する

**エラー例：**
```
error TS6133: 'Save' is declared but its value is never read.
```

**対処法：**
- 未使用の変数やインポートを削除
- または、`package.json` の `build` コマンドを `vite build` のみに変更（型チェックをスキップ）

### 3. Vercelでデプロイが失敗する

**確認ポイント：**
1. **ビルドログを確認**（Vercelの「Deployments」→ 該当デプロイ → 「Build Logs」）
2. **ローカルで `npm run build` を実行**して、同じエラーが出るか確認
3. エラーを修正してから再度 `git push`

### 4. 変更が反映されない

**確認ポイント：**
1. **GitHubにプッシュできているか確認**
   - [GitHubリポジトリ](https://github.com/mmiyauchi-hash/modernization)で最新のコミットを確認
2. **Vercelのデプロイが完了しているか確認**
   - 「Deployments」タブで最新のデプロイが「Ready」になっているか
3. **ブラウザのキャッシュをクリア**
   - `Cmd + Shift + R`（Mac）または `Ctrl + Shift + R`（Windows）で強制リロード

---

## 📝 開発のベストプラクティス

### コミットメッセージの書き方

明確で分かりやすいメッセージを心がけましょう。

**良い例：**
- `"fix: チャット画面の幅を固定サイズに修正"`
- `"feat: メニュー管理画面に編集機能を追加"`
- `"refactor: AdminPanelコンポーネントを整理"`

**悪い例：**
- `"修正"`
- `"更新"`
- `"あああ"`

### 小さな変更を頻繁にコミット

大きな変更を一度にまとめるのではなく、機能単位で小さくコミットすることを推奨します。

### ローカルでテストしてからプッシュ

`npm run build` でエラーが出ないことを確認してから `git push` しましょう。

---

## 🔗 参考リンク

- **GitHubリポジトリ**: [https://github.com/mmiyauchi-hash/modernization](https://github.com/mmiyauchi-hash/modernization)
- **Vercelダッシュボード**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **公開URL**: [https://modernization-kappa.vercel.app/](https://modernization-kappa.vercel.app/)
- **Vite公式ドキュメント**: [https://vitejs.dev/](https://vitejs.dev/)
- **React公式ドキュメント**: [https://react.dev/](https://react.dev/)

---

**最終更新日**: 2026年1月14日

