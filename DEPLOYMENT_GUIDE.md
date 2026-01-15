# DevOpsモダナイゼーション支援エージェント デプロイガイド

## 1. アプリケーション公開情報

本アプリケーションは以下のURLで公開されています。外部の方へはこのURLを共有してください。

- **公開URL**: [https://modernization-kappa.vercel.app/](https://modernization-kappa.vercel.app/)
- **リポジトリ**: [https://github.com/mmiyauchi-hash/modernization](https://github.com/mmiyauchi-hash/modernization)

## 2. システム構成

- **フロントエンド**: React (Vite) + TypeScript
- **ホスティング**: Vercel
- **ソースコード管理**: GitHub

GitHubの `main` ブランチにコードがプッシュされると、Vercelが自動的に検知し、ビルドとデプロイを行います（CI/CD連携済み）。

## 3. アプリケーションの更新手順

コードを修正して公開環境に反映させる場合は、以下の手順でGitHubへプッシュしてください。

### 手順

ターミナルでプロジェクトフォルダ（`IGPF/devops-modernization-agent-vite`）に移動し、以下のコマンドを実行します。

```bash
# 1. 変更ファイルをステージング
git add .

# 2. 変更内容をコミット（メッセージは適宜変更してください）
git commit -m "機能追加: メニュー管理機能の更新"

# 3. GitHubへプッシュ
git push
```

プッシュが完了すると、数分以内にVercel上で自動的に新しいバージョンが公開されます。

## 4. 業務ルール・メニューの共有方法

アプリケーション自体のURL共有以外に、作成した業務ルールやメニュー定義を個別に共有することも可能です。

### エクスポート（共有元）
1. 管理者画面の「業務ルール」タブを開く。
2. 「保存・エクスポート」ボタンをクリック。
3. ダウンロードされたMarkdownファイルを共有。

### インポート（共有先）
1. 管理者画面の「メニュー管理」タブを開く。
2. 「マークダウンファイルから作成」を選択。
3. 共有されたMarkdownファイルをアップロード。

---
**作成日**: 2026年1月14日

