// Git移行シナリオ

import { LocalRule } from '../types';

export interface ScenarioStep {
  id: string;
  message: string;
  options?: string[];
  inputType?: 'text' | 'select';
  validation?: (input: string, rules: LocalRule[]) => { 
    valid: boolean; 
    message?: string; 
    isCustomRule?: boolean;
    guide?: {
      title: string;
      steps: string[];
      examples?: string[];
      tips?: string[];
    };
  };
  checkGuide?: {
    // 確認ポイントガイド情報
    title: string;
    checkPoints: string[];
    commands?: string[];
    visualGuide?: string[];
  };
}

export const gitMigrationScenario: Record<string, ScenarioStep[]> = {
  preparation: [
    {
      id: 'welcome',
      message: 'SubversionからGitへの移行を始めます。\n\nまず、移行前の準備を行います。',
      options: ['準備を始める'],
      inputType: 'select',
    },
    {
      id: 'svn-repo-check',
      message: '現在使用しているSubversionリポジトリのURLを入力してください。\n\n（例: https://svn.example.com/repos/project）',
      inputType: 'text',
    },
    {
      id: 'svn-structure-check',
      message: 'Subversionリポジトリの構造を確認します。\n\n以下の情報を教えてください：\n- ブランチはありますか？\n- タグはありますか？\n- 主要なブランチ名は？',
      options: ['ブランチ・タグあり', 'ブランチ・タグなし', '確認が必要'],
      inputType: 'select',
      checkGuide: {
        title: 'Subversionリポジトリ構造の確認方法',
        checkPoints: [
          'リポジトリのURLを確認',
          'ブランチの有無を確認（通常は branches/ ディレクトリ）',
          'タグの有無を確認（通常は tags/ ディレクトリ）',
          'trunk（メインブランチ）の存在を確認',
        ],
        commands: [
          'svn list <repository-url>',
          'svn list <repository-url>/branches',
          'svn list <repository-url>/tags',
        ],
        visualGuide: [
          'SubversionリポジトリのURLにアクセス',
          'ディレクトリ構造を確認',
          'branches/ と tags/ フォルダの有無を確認',
        ],
      },
    },
    {
      id: 'backup-confirm',
      message: '移行前にSubversionリポジトリのバックアップを取得してください。\n\nバックアップは取得済みですか？',
      options: ['バックアップ済み', 'これから取得する'],
      inputType: 'select',
    },
  ],
  selection: [
    {
      id: 'environment-selection',
      message: 'Git環境の方式を選択してください。',
      options: ['A. SaaS版（GitHub/GitLab）', 'B. セルフホスト版（社内サーバー）'],
      inputType: 'select',
    },
  ],
  'account-creation': [
    {
      id: 'account-check',
      message: 'Gitアカウントの作成状況を確認します。\n\n**SaaS版（GitHub/GitLab）を選択した場合：**\nGitHubまたはGitLabのアカウントが必要です。\n\n既にアカウントをお持ちですか？',
      options: ['アカウントを持っている', 'アカウントを作成する必要がある', 'セルフホスト版を選択したので不要'],
      inputType: 'select',
    },
    {
      id: 'github-account-creation',
      message: 'GitHubアカウントを作成します。\n\n**手順：**\n1. GitHubの公式サイト（https://github.com）にアクセス\n2. 「Sign up」ボタンをクリック\n3. ユーザー名、メールアドレス、パスワードを入力\n4. メール認証を完了\n5. プラン選択（無料プランで問題ありません）\n\n**注意事項：**\n- ユーザー名は後から変更できないため、慎重に選択してください\n- メールアドレスは実在するものを使用してください\n- パスワードは強力なものを設定してください\n\nアカウントの作成は完了しましたか？',
      options: ['作成完了', '作成中', 'エラーが発生', 'GitLabを使用する'],
      inputType: 'select',
    },
    {
      id: 'gitlab-account-creation',
      message: 'GitLabアカウントを作成します。\n\n**手順：**\n1. GitLabの公式サイト（https://gitlab.com）にアクセス\n2. 「Register」ボタンをクリック\n3. ユーザー名、メールアドレス、パスワードを入力\n4. メール認証を完了\n\n**注意事項：**\n- ユーザー名は後から変更できないため、慎重に選択してください\n- メールアドレスは実在するものを使用してください\n- パスワードは強力なものを設定してください\n\nアカウントの作成は完了しましたか？',
      options: ['作成完了', '作成中', 'エラーが発生'],
      inputType: 'select',
    },
    {
      id: 'account-verification',
      message: 'アカウントの確認を行います。\n\n**確認項目：**\n- アカウントにログインできること\n- メール認証が完了していること\n- プロフィール設定が完了していること\n\nアカウントの確認は完了しましたか？',
      options: ['確認完了', '確認が必要'],
      inputType: 'select',
    },
  ],
  migration: [
    {
      id: 'migration-tool-selection',
      message: 'SubversionからGitへの移行ツールを選択してください。\n\n**推奨ツール:**\n- **svn2git**: 履歴を保持した移行に最適\n- **git-svn**: Git標準ツール、段階的移行に適している',
      options: ['svn2gitを使用', 'git-svnを使用', 'ツールについて詳しく知りたい'],
      inputType: 'select',
      checkGuide: {
        title: '移行ツールの選択ポイント',
        checkPoints: [
          'svn2git: 履歴を完全に保持したい場合に推奨',
          'git-svn: Git標準ツールで、段階的な移行に適している',
          '既存のブランチ・タグ構造を保持する必要があるか確認',
          '移行後の履歴の重要性を確認',
        ],
        visualGuide: [
          '移行するリポジトリの規模を確認',
          'ブランチ・タグの有無を確認',
          '履歴の完全性の重要度を確認',
        ],
      },
    },
    {
      id: 'migration-execution',
      message: '移行を実行します。\n\n**svn2gitの場合:**\n```bash\n# svn2gitのインストール（未インストールの場合）\ngem install svn2git\n\n# 移行実行\nsvn2git <svn-repository-url> --authors authors.txt\n```\n\n**git-svnの場合:**\n```bash\ngit svn clone <svn-repository-url> --stdlayout\n```\n\n移行を実行しましたか？',
      options: ['移行完了', 'エラーが発生', 'まだ実行していない'],
      inputType: 'select',
    },
    {
      id: 'migration-check',
      message: '移行結果を確認します。\n\n以下のコマンドで履歴を確認してください：\n```bash\ngit log --oneline\n```\n\n履歴は正しく移行されていますか？',
      options: ['履歴は正しく移行されている', '履歴が不完全', '確認が必要'],
      inputType: 'select',
      checkGuide: {
        title: '移行結果の確認ポイント',
        checkPoints: [
          'コミット履歴が表示されること',
          'コミットメッセージが正しく表示されること',
          'コミット日時が正しいこと',
          'コミット数がSubversionと一致すること（概算）',
        ],
        commands: [
          'git log --oneline',
          'git log --oneline --all',
          'git log --stat',
        ],
        visualGuide: [
          'ターミナルで `git log --oneline` を実行',
          'コミット一覧が表示されることを確認',
          '各コミットにハッシュとメッセージが表示されることを確認',
        ],
      },
    },
  ],
  repository: [
    {
      id: 'system-name',
      message: 'システム名を入力してください。\n\n**システム名とは：**\n移行するプロジェクトやアプリケーションの名前です。\nGitHubやGitLabなどのサービス名ではなく、あなたが開発しているシステム自体の名前を入力してください。\n\n**入力例：**\n- `user-management`（ユーザー管理システム）\n- `order-system`（注文管理システム）\n- `inventory-app`（在庫管理アプリ）\n- `payment-gateway`（決済ゲートウェイ）\n\n**注意：**\n- 英数字とハイフン（-）を使用できます\n- 小文字で入力することを推奨します',
      inputType: 'text',
    },
    {
      id: 'admin-id',
      message: '管理者IDを入力してください。\n\n**管理者IDとは：**\nGitリポジトリの管理者となるユーザーのIDです。\n\n**入力例：**\n- `tanaka-taro`（社員ID）\n- `admin`（管理者アカウント）\n- `dev-team-lead`（チームリーダーID）\n\n**注意：**\n- 通常は社員IDやユーザー名を使用します\n- GitHub/GitLabのアカウント名とは異なる場合があります',
      inputType: 'text',
    },
    {
      id: 'repository-name',
      message: 'Gitリポジトリ名を入力してください。',
      inputType: 'text',
      validation: (input: string, rules: LocalRule[]) => {
        const namingRule = rules.find((r) => r.type === 'naming');
        if (!namingRule) return { valid: true };
        
        const pattern = new RegExp(namingRule.pattern);
        if (!pattern.test(input)) {
          // エラーガイドを生成
          const guide = {
            title: 'リポジトリ名の修正方法',
            steps: [
              'リポジトリ名は以下の形式で入力してください',
              `形式: ${namingRule.description}`,
              namingRule.example ? `正しい例: ${namingRule.example}` : '',
              '入力した値を見直して、形式に合わせて修正してください',
            ].filter(Boolean),
            examples: namingRule.example ? [namingRule.example] : undefined,
            tips: [
              '小文字の英数字とハイフン（-）のみ使用可能です',
              '部署コードとシステム名を正しく入力してください',
            ],
          };

          return {
            valid: false,
            message: `NGです。${namingRule.isCustomRule ? '社内独自ルール' : '社内共通ルール'}に従い、${namingRule.description}の形式で入力してください。\n例: ${namingRule.example}`,
            isCustomRule: namingRule.isCustomRule || false,
            guide: guide,
          };
        }
        return { valid: true };
      },
    },
    {
      id: 'repository-creation',
      message: 'GitHub/GitLabでリポジトリを作成します。\n\n**GitHubの場合：**\n1. GitHubにログイン\n2. 右上の「+」ボタンから「New repository」を選択\n3. リポジトリ名を入力（例: prj-dev01-my-system）\n4. 公開設定を選択（Private推奨）\n5. 「Create repository」をクリック\n\n**GitLabの場合：**\n1. GitLabにログイン\n2. 「New project」または「+」ボタンから「New project」を選択\n3. 「Create blank project」を選択\n4. プロジェクト名を入力\n5. 公開設定を選択（Private推奨）\n6. 「Create project」をクリック\n\nリポジトリの作成は完了しましたか？',
      options: ['作成完了', '作成中', 'エラーが発生'],
      inputType: 'select',
      checkGuide: {
        title: 'リポジトリ作成の確認ポイント',
        checkPoints: [
          'リポジトリ名が社内命名規則に従っている',
          '公開設定が適切（通常はPrivate推奨）',
          'リポジトリのURLを確認・コピー',
          'リポジトリが正常に作成されている',
        ],
        visualGuide: [
          'GitHub/GitLabのダッシュボードでリポジトリが表示される',
          'リポジトリのURLを確認（後で使用します）',
          'リポジトリの設定ページで公開設定を確認',
        ],
      },
    },
    {
      id: 'authentication-method',
      message: '認証方法を選択してください。\n\n**認証方法：**\n- **SSH鍵認証（推奨）**: セキュアで便利。一度設定すればパスワード入力不要\n- **HTTPS認証**: 簡単だが、毎回パスワードまたはトークン入力が必要\n\nどちらの認証方法を使用しますか？',
      options: ['SSH鍵認証を使用', 'HTTPS認証を使用', 'どちらかわからない'],
      inputType: 'select',
    },
    {
      id: 'ssh-key-generation',
      message: 'SSH鍵を生成します。\n\n**手順：**\n1. ターミナルを開く\n2. 以下のコマンドを実行：\n```bash\nssh-keygen -t ed25519 -C "your_email@example.com"\n```\n3. ファイル保存場所の確認（Enterでデフォルト）\n4. パスフレーズの設定（空でも可、セキュリティのため推奨）\n\n**注意：**\n- 既にSSH鍵がある場合は、新しい鍵を作成する必要はありません\n- `~/.ssh/id_ed25519.pub` が公開鍵ファイルです\n\nSSH鍵の生成は完了しましたか？',
      options: ['生成完了', '既に鍵がある', 'エラーが発生', 'HTTPS認証に変更'],
      inputType: 'select',
    },
    {
      id: 'ssh-key-registration-github',
      message: 'GitHubにSSH鍵を登録します。\n\n**手順：**\n1. 公開鍵をコピー：\n```bash\ncat ~/.ssh/id_ed25519.pub\n```\n2. GitHubにログイン\n3. 右上のプロフィールアイコン → 「Settings」\n4. 左メニューから「SSH and GPG keys」を選択\n5. 「New SSH key」をクリック\n6. Titleに任意の名前を入力（例: My Laptop）\n7. Keyに公開鍵を貼り付け\n8. 「Add SSH key」をクリック\n\n**確認：**\n```bash\nssh -T git@github.com\n```\n上記コマンドで「Hi [username]! You\'ve successfully authenticated...」と表示されれば成功です。\n\nSSH鍵の登録は完了しましたか？',
      options: ['登録完了', 'エラーが発生', '確認が必要'],
      inputType: 'select',
      checkGuide: {
        title: 'SSH鍵登録の確認ポイント',
        checkPoints: [
          '公開鍵が正しくコピーされている（ssh-ed25519で始まる）',
          'GitHubのSettingsページにアクセスできる',
          'SSH and GPG keysページが表示される',
          '登録後、鍵が一覧に表示される',
          'ssh -Tコマンドで認証成功メッセージが表示される',
        ],
        commands: [
          'cat ~/.ssh/id_ed25519.pub',
          'ssh -T git@github.com',
        ],
        visualGuide: [
          'GitHubのSettings → SSH and GPG keysページを開く',
          '登録した鍵が一覧に表示されているか確認',
          '鍵のタイトルと登録日時を確認',
        ],
      },
    },
    {
      id: 'ssh-key-registration-gitlab',
      message: 'GitLabにSSH鍵を登録します。\n\n**手順：**\n1. 公開鍵をコピー：\n```bash\ncat ~/.ssh/id_ed25519.pub\n```\n2. GitLabにログイン\n3. 右上のプロフィールアイコン → 「Preferences」\n4. 左メニューから「SSH Keys」を選択\n5. 「Key」に公開鍵を貼り付け\n6. 「Title」に任意の名前を入力（例: My Laptop）\n7. 「Add key」をクリック\n\n**確認：**\n```bash\nssh -T git@gitlab.com\n```\n上記コマンドで「Welcome to GitLab, @username!」と表示されれば成功です。\n\nSSH鍵の登録は完了しましたか？',
      options: ['登録完了', 'エラーが発生', '確認が必要'],
      inputType: 'select',
      checkGuide: {
        title: 'SSH鍵登録の確認ポイント',
        checkPoints: [
          '公開鍵が正しくコピーされている（ssh-ed25519で始まる）',
          'GitLabのPreferencesページにアクセスできる',
          'SSH Keysページが表示される',
          '登録後、鍵が一覧に表示される',
          'ssh -Tコマンドで認証成功メッセージが表示される',
        ],
        commands: [
          'cat ~/.ssh/id_ed25519.pub',
          'ssh -T git@gitlab.com',
        ],
        visualGuide: [
          'GitLabのPreferences → SSH Keysページを開く',
          '登録した鍵が一覧に表示されているか確認',
          '鍵のタイトルと登録日時を確認',
        ],
      },
    },
    {
      id: 'https-token-setup',
      message: 'HTTPS認証用のトークンを設定します。\n\n**GitHubの場合：**\n1. GitHubにログイン\n2. 右上のプロフィールアイコン → 「Settings」\n3. 左メニューから「Developer settings」→「Personal access tokens」→「Tokens (classic)」\n4. 「Generate new token (classic)」をクリック\n5. Noteに用途を入力（例: Git操作用）\n6. スコープで「repo」にチェック\n7. 「Generate token」をクリック\n8. 表示されたトークンをコピー（再表示されないため注意）\n\n**GitLabの場合：**\n1. GitLabにログイン\n2. 右上のプロフィールアイコン → 「Preferences」\n3. 左メニューから「Access Tokens」を選択\n4. Token nameに用途を入力\n5. スコープで「write_repository」にチェック\n6. 「Create personal access token」をクリック\n7. 表示されたトークンをコピー\n\n**注意：**\n- トークンはパスワードの代わりに使用します\n- トークンは安全に保管してください\n\nトークンの作成は完了しましたか？',
      options: ['作成完了', '作成中', 'エラーが発生'],
      inputType: 'select',
    },
    {
      id: 'remote-setup',
      message: 'リモートリポジトリを設定します。\n\n**SSH認証の場合：**\n```bash\ngit remote add origin git@github.com:username/repository-name.git\n# または\ngit remote add origin git@gitlab.com:username/repository-name.git\n```\n\n**HTTPS認証の場合：**\n```bash\ngit remote add origin https://github.com/username/repository-name.git\n# または\ngit remote add origin https://gitlab.com/username/repository-name.git\n```\n\n**プッシュ：**\n```bash\ngit push -u origin main\n```\n\nリモートリポジトリの設定は完了しましたか？',
      options: ['設定完了', 'エラーが発生'],
      inputType: 'select',
      checkGuide: {
        title: 'リモートリポジトリ設定の確認ポイント',
        checkPoints: [
          'リモートリポジトリURLが正しい（GitHub/GitLabのリポジトリページからコピー）',
          '認証方法に応じたURL形式を使用（SSH: git@...、HTTPS: https://...）',
          'リモートリポジトリが正しく追加されている',
          'プッシュが成功している',
        ],
        commands: [
          'git remote -v',
          'git push -u origin main',
          'git branch -a',
        ],
        visualGuide: [
          'GitHub/GitLabのリポジトリページでURLを確認',
          '「Code」ボタンからSSHまたはHTTPSのURLをコピー',
          'ターミナルで `git remote -v` を実行して設定を確認',
          'GitHub/GitLabのリポジトリページでコミットが表示されることを確認',
        ],
      },
    },
  ],
  setup: [
    {
      id: 'git-install',
      message: 'Gitのインストールを確認します。\n\n以下のコマンドを実行してください:\n```bash\ngit --version\n```',
      options: ['インストール済み', 'インストールが必要'],
      inputType: 'select',
    },
    {
      id: 'auth-setup',
      message: '認証情報を設定します。\n\n以下のコマンドを実行してください:\n```bash\ngit config --global user.name "Your Name"\ngit config --global user.email "your.email@example.com"\n```',
      options: ['設定完了', 'エラーが発生'],
      inputType: 'select',
    },
    {
      id: 'clone',
      message: 'リポジトリをクローンします。\n\n以下のコマンドを実行してください:\n```bash\ngit clone <repository-url>\n```',
      options: ['クローン完了', 'エラーが発生'],
      inputType: 'select',
    },
  ],
  verification: [
    {
      id: 'history-verification',
      message: '移行結果の検証を行います。\n\n**1. コミット履歴の確認**\n```bash\ngit log --oneline --all\n```\n\n**2. ブランチの確認**\n```bash\ngit branch -a\n```\n\n**3. タグの確認**\n```bash\ngit tag -l\n```\n\nすべての情報が正しく移行されていますか？',
      options: ['すべて正しく移行されている', '一部不完全', '確認が必要'],
      inputType: 'select',
      checkGuide: {
        title: '移行結果の検証ポイント',
        checkPoints: [
          'コミット履歴: すべてのコミットが表示される',
          'ブランチ: すべてのブランチが表示される（リモートブランチ含む）',
          'タグ: すべてのタグが表示される',
          'コミットメッセージ: 元のSubversionのコミットメッセージが保持されている',
          'コミット日時: 元の日時が正しく保持されている',
        ],
        commands: [
          'git log --oneline --all',
          'git branch -a',
          'git tag -l',
          'git log --graph --oneline --all',
        ],
        visualGuide: [
          'ターミナルで各コマンドを実行',
          '出力結果を確認',
          'Subversionの情報と比較',
          '不足している情報がないか確認',
        ],
      },
    },
    {
      id: 'code-verification',
      message: 'コードの整合性を確認します。\n\n**確認項目:**\n- ファイル構造が保持されているか\n- コードが正しく移行されているか\n- バイナリファイルが保持されているか\n\nコードの確認は完了しましたか？',
      options: ['確認完了、問題なし', '問題が見つかった', '確認が必要'],
      inputType: 'select',
      checkGuide: {
        title: 'コード整合性の確認ポイント',
        checkPoints: [
          'ファイル構造: ディレクトリ構造がSubversionと同じ',
          'ファイル数: ファイル数が一致している',
          'コード内容: 主要なファイルの内容が同じ',
          'バイナリファイル: 画像や実行ファイルが正しく保持されている',
          '文字エンコーディング: 日本語などの文字が正しく表示される',
        ],
        commands: [
          'find . -type f | wc -l',
          'ls -la',
          'git ls-files',
        ],
        visualGuide: [
          'ファイルエクスプローラーでディレクトリ構造を確認',
          '主要なファイルを開いて内容を確認',
          'バイナリファイルが正しく存在するか確認',
        ],
      },
    },
  ],
  rules: [
    {
      id: 'rules-info',
      message: '運用ルールについて説明します。\n\n**重要なルール:**\n- Cherry-pickは禁止されています\n- マージコミットを使用してください\n- ブランチ名は feature/ または fix/ で始めてください\n- コミットメッセージは明確に記述してください',
      options: ['理解しました', '質問があります'],
      inputType: 'select',
    },
  ],
  rollout: [
    {
      id: 'team-notification',
      message: 'チームメンバーへの通知を行います。\n\n**通知内容:**\n- GitリポジトリのURL\n- 移行完了日時\n- 新しい作業フロー\n- 移行スケジュール\n\nチームメンバーへの通知は完了しましたか？',
      options: ['通知完了', 'これから通知する'],
      inputType: 'select',
    },
    {
      id: 'svn-readonly',
      message: 'Subversionリポジトリを読み取り専用に設定します。\n\n**手順:**\n1. Subversionリポジトリの設定を変更\n2. 書き込み権限を削除\n3. 読み取り専用に設定\n\nSubversionリポジトリは読み取り専用になりましたか？',
      options: ['読み取り専用に設定済み', 'これから設定する'],
      inputType: 'select',
    },
    {
      id: 'migration-complete',
      message: '🎉 SubversionからGitへの移行が完了しました！\n\n**次のステップ:**\n- チームメンバーがGitリポジトリをクローン\n- 新しい作業フローで開発を開始\n- Subversionリポジトリはアーカイブとして保持\n\n移行作業は完了しました。お疲れ様でした！',
      options: ['完了を確認'],
      inputType: 'select',
    },
  ],
};

export const getNextStep = (
  phase: string,
  currentStepId: string,
  userInput?: string,
  gitMigrationPhase?: { environmentType?: 'saas' | 'self-hosted' }
): { nextPhase?: string; nextStepId?: string; completed?: boolean } => {
  const steps = gitMigrationScenario[phase];
  if (!steps) return {};

  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  if (currentIndex === -1) return {};

  // 最後のステップの場合
  if (currentIndex === steps.length - 1) {
    if (phase === 'rollout') {
      return { completed: true };
    }
    // 次のフェーズへ
    const phaseOrder = ['preparation', 'selection', 'account-creation', 'migration', 'repository', 'setup', 'verification', 'rules', 'rollout'];
    const currentPhaseIndex = phaseOrder.indexOf(phase);
    if (currentPhaseIndex < phaseOrder.length - 1) {
      // 環境選択の後、SaaS版の場合はアカウント作成、セルフホスト版の場合は移行実行へ
      if (phase === 'selection') {
        if (gitMigrationPhase?.environmentType === 'saas') {
          return { nextPhase: 'account-creation' };
        } else if (gitMigrationPhase?.environmentType === 'self-hosted') {
          return { nextPhase: 'migration' };
        }
      }
      // アカウント作成の後は移行実行へ
      if (phase === 'account-creation') {
        return { nextPhase: 'migration' };
      }
      return { nextPhase: phaseOrder[currentPhaseIndex + 1] };
    }
  }

  // 次のステップへ
  return { nextStepId: steps[currentIndex + 1]?.id };
};

