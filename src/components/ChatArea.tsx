import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, Info, AlertCircle, CheckCircle2, Lightbulb, ArrowRight, Eye, Terminal, RotateCcw } from 'lucide-react';
import { gitMigrationScenario, getNextStep } from '../lib/gitScenario';
import { cn } from '../lib/utils';

// ステップごとのヘルプガイド定義
const stepHelpGuides: Record<string, { title: string; description: string; steps?: string[]; tips?: string[] }> = {
  'welcome': {
    title: '準備を始める',
    description: 'SubversionからGitへの移行を開始します。',
    steps: [
      '「準備を始める」ボタンをクリックしてください',
    ],
    tips: [
      'ボタンをクリックすると次のステップに進みます',
    ],
  },
  'svn-repo-check': {
    title: 'SubversionリポジトリURLの確認',
    description: '現在使用しているSubversionリポジトリのURLを入力してください。',
    steps: [
      'TortoiseSVNを開く',
      'リポジトリブラウザを選択',
      'URLバーからURLをコピー',
      'このチャットに貼り付けて送信',
    ],
    tips: [
      'URLは通常 svn:// または https:// で始まります',
      'わからない場合はシステム管理者に確認してください',
    ],
  },
  'admin-id': {
    title: '管理者IDの入力',
    description: 'Gitリポジトリの管理者となるユーザーIDを入力します。',
    steps: [
      '社員IDまたはユーザー名を確認',
      '半角英数字とハイフンのみ使用可能',
      'テキストボックスに入力して送信',
    ],
    tips: [
      '例: tanaka-taro, admin, dev-team-lead',
      '通常は社員IDを使用します',
    ],
  },
  'system-name': {
    title: 'システム名の入力',
    description: '移行するシステムの名前を入力します。',
    steps: [
      'システムの正式名称を確認',
      '半角英数字とハイフンで入力',
      'テキストボックスに入力して送信',
    ],
    tips: [
      '例: inventory-system, sales-portal',
      'スペースは使用できません。ハイフン(-)を使用してください',
    ],
  },
  'environment-selection': {
    title: '環境方式の選択',
    description: 'Gitのホスティング環境を選択します。',
    steps: [
      'SaaS版（GitHub）またはセルフホスト版（GitLab）を選択',
      '該当するボタンをクリック',
    ],
    tips: [
      'SaaS版: インターネット経由でGitHubを使用',
      'セルフホスト版: 社内サーバーでGitLabを運用',
      '迷ったら管理者に確認してください',
    ],
  },
  // 🔴 つまづきやすいポイント1: リポジトリ名入力（社内命名規則）
  'repository-name': {
    title: '⚠️ リポジトリ名の入力【重要】',
    description: '社内独自の命名規則に従ってリポジトリ名を入力してください。',
    steps: [
      '① 形式: prj-部署コード-システム名',
      '② 部署コードは dev01, sales02 など',
      '③ システム名は小文字英数字とハイフンのみ',
      '④ 例: prj-dev01-inventory-system',
    ],
    tips: [
      '💡 形式が違うとエラーになります',
      '💡 紫色の警告は社内独自ルールを示します',
      '💡 不明な場合はシステム管理者に確認',
    ],
  },
  // 🔴 つまづきやすいポイント2: SSH鍵生成
  'ssh-key-generation': {
    title: '⚠️ SSH鍵の生成【技術的に重要】',
    description: 'SSH鍵を生成してGitHub/GitLabに登録します。初めての方は以下の手順に従ってください。',
    steps: [
      '① ターミナル（コマンドプロンプト）を開く',
      '② 以下のコマンドを実行:\n   ssh-keygen -t ed25519 -C "your_email@example.com"',
      '③ 保存先はEnterでデフォルト（~/.ssh/id_ed25519）',
      '④ パスフレーズは空でも可（セキュリティ上は設定推奨）',
      '⑤ 生成後、~/.ssh/id_ed25519.pub が公開鍵',
    ],
    tips: [
      '💡 既にSSH鍵がある場合は新規作成不要',
      '💡 公開鍵（.pub）のみをGitHubに登録します',
      '💡 秘密鍵は絶対に共有しないでください',
      '💡 エラーが出たらシステム管理者に連絡',
    ],
  },
  // 🔴 つまづきやすいポイント3: リモートリポジトリ設定
  'remote-setup': {
    title: '⚠️ リモートリポジトリ設定【プッシュ前の重要設定】',
    description: 'ローカルリポジトリをGitHub/GitLabに接続し、コードをプッシュします。',
    steps: [
      '① GitHubのリポジトリページで「Code」ボタンをクリック',
      '② SSH/HTTPSどちらかのURLをコピー',
      '③ ターミナルで以下を実行:\n   git remote add origin <コピーしたURL>',
      '④ プッシュ:\n   git push -u origin main',
    ],
    tips: [
      '💡 SSH: git@github.com:username/repo.git',
      '💡 HTTPS: https://github.com/username/repo.git',
      '💡 認証エラーが出たらSSH鍵/トークンを確認',
      '💡 ブランチ名が master の場合は main を master に変更',
    ],
  },
};

// 🔴 自動でヘルプを表示するステップのリスト（つまづきやすいポイント）
const AUTO_HELP_STEPS = ['repository-name', 'ssh-key-generation', 'remote-setup'];

export function ChatArea() {
  const {
    selectedCategory,
    chatMessages,
    gitMigrationPhase,
    localRules,
    addChatMessage,
    setGitMigrationPhase,
    updateProgress,
    currentStepId: savedCurrentStepId,
    setCurrentStepId,
    showHelp,
    goToMessage,
  } = useStore();
  
  const [inputValue, setInputValue] = useState('');
  const [currentStepId, setCurrentStepIdLocal] = useState<string | null>(savedCurrentStepId || null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAddingMessageRef = useRef(false);
  
  // 保存されたステップIDと同期
  useEffect(() => {
    if (savedCurrentStepId !== currentStepId) {
      setCurrentStepIdLocal(savedCurrentStepId);
    }
  }, [savedCurrentStepId, currentStepId]);
  
  // ステップIDが変更されたらストアに保存
  const updateCurrentStepId = useCallback((stepId: string | null) => {
    setCurrentStepIdLocal(stepId);
    setCurrentStepId(stepId);
  }, [setCurrentStepId]);

  // 🔴 つまづきやすいステップに到達したら自動でヘルプを表示
  useEffect(() => {
    if (currentStepId && AUTO_HELP_STEPS.includes(currentStepId)) {
      const helpGuide = stepHelpGuides[currentStepId];
      if (helpGuide) {
        // 少し遅延させて、メッセージ表示後にヘルプを表示
        const timer = setTimeout(() => {
          showHelp(helpGuide);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStepId, showHelp]);

  // 現在のステップに関連するルールを取得
  const currentStepRule = useMemo(() => {
    if (!selectedCategory || selectedCategory !== 'git-migration' || !currentStepId) {
      return null;
    }

    const phase = gitMigrationPhase.phase;
    const scenario = gitMigrationScenario[phase];
    if (!scenario) return null;

    const currentStep = scenario.find((s) => s.id === currentStepId);
    if (!currentStep || currentStep.inputType !== 'text' || !currentStep.validation) {
      return null;
    }

    const relatedRule = localRules.find((r) => {
      if (currentStep.id === 'repository-name' && r.type === 'naming') {
        return true;
      }
      return false;
    });

    if (!relatedRule) return null;

    return {
      rule: relatedRule,
      step: currentStep,
    };
  }, [selectedCategory, currentStepId, gitMigrationPhase.phase, localRules]);

  // 初期メッセージを追加（一度だけ）
  useEffect(() => {
    const isGitMigration = selectedCategory === 'git-migration';
    if (!isGitMigration) {
      return;
    }

    // 既にメッセージがある場合はスキップ
    if (chatMessages.length > 0) {
      // ステップIDのみ更新
      const scenario = gitMigrationScenario[gitMigrationPhase.phase];
      if (scenario && scenario.length > 0 && !currentStepId) {
        updateCurrentStepId(scenario[0].id);
      }
      return;
    }

    // 重複追加防止
    if (isAddingMessageRef.current) {
      return;
    }

    const scenario = gitMigrationScenario[gitMigrationPhase.phase];
    if (!scenario || scenario.length === 0) return;

    const firstStep = scenario[0];
    
    // 初期メッセージを追加
    isAddingMessageRef.current = true;
    addChatMessage({
      role: 'assistant',
      content: firstStep.message,
      options: firstStep.options,
      checkGuide: firstStep.checkGuide,
      stepId: firstStep.id,
      phase: gitMigrationPhase.phase,
      phaseData: { ...gitMigrationPhase },
    });
    updateCurrentStepId(firstStep.id);
    
    // 少し遅延を入れてフラグをリセット
    setTimeout(() => {
      isAddingMessageRef.current = false;
    }, 100);
  }, [selectedCategory, gitMigrationPhase.phase, chatMessages.length, currentStepId, addChatMessage, updateCurrentStepId]);

  // メッセージが追加されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ヘルプが必要かどうかを判定
  const isHelpNeeded = (input: string): boolean => {
    const helpKeywords = [
      'わからない', 'わかりません', '分からない', '分かりません',
      'どこ', 'どうすれば', 'どうしたら', 'どうやって',
      'ヘルプ', 'help', '教えて', '助けて',
      '確認方法', '見方', '場所', 'どれ',
      '意味', '何を', 'なにを', '何が', 'なにが',
    ];
    const lowerInput = input.toLowerCase();
    return helpKeywords.some(keyword => lowerInput.includes(keyword));
  };

  // 現在のステップに対応するヘルプガイドを表示
  const showContextualHelp = () => {
    const helpGuide = currentStepId ? stepHelpGuides[currentStepId] : null;
    if (helpGuide) {
      showHelp(helpGuide);
    } else {
      // デフォルトのヘルプ
      showHelp({
        title: '操作ガイド',
        description: '現在のステップを進めるためのヘルプです。',
        steps: [
          'チャットの指示に従って操作してください',
          '選択肢がある場合はボタンをクリック',
          'テキスト入力が必要な場合は入力欄に入力して送信',
        ],
        tips: [
          '左側のメニューで進捗を確認できます',
          'わからないことがあれば質問してください',
        ],
      });
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || !selectedCategory) return;

    addChatMessage({
      role: 'user',
      content: inputValue,
      stepId: currentStepId || undefined,
      phase: gitMigrationPhase.phase,
      phaseData: { ...gitMigrationPhase },
    });

    // ヘルプが必要かどうかをチェック
    if (isHelpNeeded(inputValue)) {
      showContextualHelp();
      // ヘルプを求めている場合は、通常の応答も追加
      addChatMessage({
        role: 'assistant',
        content: '右側にガイドを表示しました。詳しい手順を確認してください。\n\n引き続き、上記の質問にお答えください。',
        stepId: currentStepId || undefined,
        phase: gitMigrationPhase.phase,
        phaseData: { ...gitMigrationPhase },
      });
      setInputValue('');
      return;
    }

    const isGitMigration = selectedCategory === 'git-migration';
    if (isGitMigration) {
      handleGitMigrationResponse(inputValue);
    }

    setInputValue('');
  };

  const handleGitMigrationResponse = (userInput: string) => {
    const phase = gitMigrationPhase.phase;
    const scenario = gitMigrationScenario[phase];
    if (!scenario || !currentStepId) {
      return;
    }

    const currentStep = scenario.find((s) => s.id === currentStepId);
    if (!currentStep) {
      return;
    }

    // テキスト入力の場合のバリデーション
    if (currentStep.inputType === 'text' && currentStep.validation) {
      const validation = currentStep.validation(userInput, localRules);
      if (!validation.valid) {
        addChatMessage({
          role: 'assistant',
          content: validation.message || '入力が正しくありません。',
          isCustomRule: validation.isCustomRule || false,
          errorGuide: validation.guide,
          stepId: currentStepId || undefined,
          phase: gitMigrationPhase.phase,
          phaseData: { ...gitMigrationPhase },
        });
        return;
      }

      if (currentStep.id === 'system-name') {
        setGitMigrationPhase({ systemName: userInput });
      } else if (currentStep.id === 'admin-id') {
        setGitMigrationPhase({ adminId: userInput });
      }
    }

    if (currentStepId === 'svn-repo-check') {
      setGitMigrationPhase({ svnRepositoryUrl: userInput });
    }

    if (phase === 'selection' && currentStepId === 'environment-selection') {
      if (userInput.includes('SaaS') || userInput.includes('A')) {
        setGitMigrationPhase({ environmentType: 'saas' });
      } else if (userInput.includes('セルフホスト') || userInput.includes('B')) {
        setGitMigrationPhase({ environmentType: 'self-hosted' });
      }
    }
    
    if (phase === 'account-creation' && currentStepId === 'account-check') {
      if (userInput.includes('セルフホスト')) {
        setGitMigrationPhase({ phase: 'migration' });
        const nextStep = gitMigrationScenario['migration']?.[0];
        if (nextStep) {
          addChatMessage({
            role: 'assistant',
            content: nextStep.message,
            options: nextStep.options,
            checkGuide: nextStep.checkGuide,
            stepId: nextStep.id,
            phase: 'migration',
            phaseData: { ...gitMigrationPhase, phase: 'migration' },
          });
          updateCurrentStepId(nextStep.id);
        }
        return;
      } else if (userInput.includes('アカウントを持っている')) {
        const verificationStep = gitMigrationScenario['account-creation']?.find(s => s.id === 'account-verification');
        if (verificationStep) {
          addChatMessage({
            role: 'assistant',
            content: verificationStep.message,
            options: verificationStep.options,
            checkGuide: verificationStep.checkGuide,
            stepId: verificationStep.id,
            phase: phase,
            phaseData: { ...gitMigrationPhase },
          });
          updateCurrentStepId(verificationStep.id);
        }
        return;
      }
    }
    
    if (phase === 'account-creation' && currentStepId === 'github-account-creation') {
      if (userInput.includes('GitLab')) {
        const gitlabStep = gitMigrationScenario['account-creation']?.find(s => s.id === 'gitlab-account-creation');
        if (gitlabStep) {
          addChatMessage({
            role: 'assistant',
            content: gitlabStep.message,
            options: gitlabStep.options,
            checkGuide: gitlabStep.checkGuide,
            stepId: gitlabStep.id,
            phase: phase,
            phaseData: { ...gitMigrationPhase },
          });
          updateCurrentStepId(gitlabStep.id);
        }
        return;
      }
    }
    
    if (phase === 'account-creation' && (currentStepId === 'github-account-creation' || currentStepId === 'gitlab-account-creation')) {
      if (userInput.includes('作成完了')) {
        setGitMigrationPhase({ gitAccountCreated: true });
      }
    }
    
    if (phase === 'repository' && currentStepId === 'authentication-method') {
      if (userInput.includes('SSH')) {
        const sshKeyStep = gitMigrationScenario['repository']?.find(s => s.id === 'ssh-key-generation');
        if (sshKeyStep) {
          addChatMessage({
            role: 'assistant',
            content: sshKeyStep.message,
            options: sshKeyStep.options,
            checkGuide: sshKeyStep.checkGuide,
            stepId: sshKeyStep.id,
            phase: phase,
            phaseData: { ...gitMigrationPhase },
          });
          updateCurrentStepId(sshKeyStep.id);
        }
        return;
      } else if (userInput.includes('HTTPS')) {
        const tokenStep = gitMigrationScenario['repository']?.find(s => s.id === 'https-token-setup');
        if (tokenStep) {
          addChatMessage({
            role: 'assistant',
            content: tokenStep.message,
            options: tokenStep.options,
            checkGuide: tokenStep.checkGuide,
            stepId: tokenStep.id,
            phase: phase,
            phaseData: { ...gitMigrationPhase },
          });
          updateCurrentStepId(tokenStep.id);
        }
        return;
      }
    }
    
    if (phase === 'repository' && currentStepId === 'ssh-key-generation') {
      if (userInput.includes('HTTPS認証に変更')) {
        const tokenStep = gitMigrationScenario['repository']?.find(s => s.id === 'https-token-setup');
        if (tokenStep) {
          addChatMessage({
            role: 'assistant',
            content: tokenStep.message,
            options: tokenStep.options,
            checkGuide: tokenStep.checkGuide,
            stepId: tokenStep.id,
            phase: phase,
            phaseData: { ...gitMigrationPhase },
          });
          updateCurrentStepId(tokenStep.id);
        }
        return;
      } else if (userInput.includes('生成完了') || userInput.includes('既に鍵がある')) {
        const isGitHub = gitMigrationPhase.environmentType === 'saas';
        const sshKeyStep = gitMigrationScenario['repository']?.find(s => 
          isGitHub ? s.id === 'ssh-key-registration-github' : s.id === 'ssh-key-registration-gitlab'
        );
        if (sshKeyStep) {
          addChatMessage({
            role: 'assistant',
            content: sshKeyStep.message,
            options: sshKeyStep.options,
            checkGuide: sshKeyStep.checkGuide,
            stepId: sshKeyStep.id,
            phase: phase,
            phaseData: { ...gitMigrationPhase },
          });
          updateCurrentStepId(sshKeyStep.id);
        }
        return;
      }
    }

    const progressMap: Record<string, number> = {
      preparation: 11.1,
      selection: 22.2,
      'account-creation': 33.3,
      migration: 44.4,
      repository: 55.5,
      setup: 66.6,
      verification: 77.7,
      rules: 88.8,
      rollout: 100,
    };
    updateProgress('git-migration', progressMap[phase] || 0, 'Lv1');

    const next = getNextStep(phase, currentStepId, userInput, gitMigrationPhase);
    
    if (next.completed) {
      addChatMessage({
        role: 'assistant',
        content: '🎉 Git移行ガイドが完了しました！\n\n次のステップに進む準備ができました。',
        stepId: currentStepId || undefined,
        phase: phase,
        phaseData: { ...gitMigrationPhase },
      });
      updateProgress('git-migration', 100, 'Lv1');
      return;
    }

    if (next.nextPhase) {
      const newPhaseData = { ...gitMigrationPhase, phase: next.nextPhase as any };
      setGitMigrationPhase({ phase: next.nextPhase as any });
      isAddingMessageRef.current = false; // フェーズ変更時にリセット
      const nextScenario = gitMigrationScenario[next.nextPhase];
      if (nextScenario && nextScenario.length > 0) {
        const nextStep = nextScenario[0];
        addChatMessage({
          role: 'assistant',
          content: nextStep.message,
          options: nextStep.options,
          checkGuide: nextStep.checkGuide,
          stepId: nextStep.id,
          phase: next.nextPhase as any,
          phaseData: newPhaseData,
        });
        updateCurrentStepId(nextStep.id);
      }
    } else if (next.nextStepId) {
      const nextStep = scenario.find((s) => s.id === next.nextStepId);
      if (nextStep) {
        addChatMessage({
          role: 'assistant',
          content: nextStep.message,
          options: nextStep.options,
          checkGuide: nextStep.checkGuide,
          stepId: next.nextStepId,
          phase: phase,
          phaseData: { ...gitMigrationPhase },
        });
        updateCurrentStepId(next.nextStepId);
      }
    }
  };

  const handleOptionClick = (option: string) => {
    if (!selectedCategory) return;
    
    addChatMessage({
      role: 'user',
      content: option,
      stepId: currentStepId || undefined,
      phase: gitMigrationPhase.phase,
      phaseData: { ...gitMigrationPhase },
    });

    const isGitMigration = selectedCategory === 'git-migration';
    if (isGitMigration) {
      handleGitMigrationResponse(option);
    }

    setInputValue('');
  };

  const isGitMigration = selectedCategory === 'git-migration';

  if (!selectedCategory && !isGitMigration) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-6xl mb-6">👋</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            カテゴリーを選択してください
          </h3>
          <p className="text-gray-600 text-lg">
            左側のメニューからモダナイゼーション項目を選択してガイドを始めましょう
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {chatMessages.map((message, index) => {
            const isLastMessage = index === chatMessages.length - 1;
            const canGoBack = !isLastMessage && message.role === 'assistant' && message.stepId;
            
            return (
              <div
                key={message.id}
                className={cn(
                  'animate-fade-in relative group',
                  message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                )}
                onMouseEnter={() => canGoBack && setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {message.role === 'assistant' && (
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mr-4 shadow-sm">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-2xl rounded-2xl relative',
                    message.role === 'user'
                      ? 'bg-teal-500 text-white px-6 py-4 shadow-sm'
                      : message.isCustomRule
                      ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-300 px-6 py-5 shadow-lg ring-2 ring-violet-200 ring-offset-2'
                      : 'bg-white border border-gray-200 px-6 py-5 shadow-sm',
                    canGoBack && hoveredMessageId === message.id && 'ring-2 ring-amber-400 ring-offset-2'
                  )}
                >
                  {/* この時点に戻るボタン */}
                  {canGoBack && hoveredMessageId === message.id && (
                    <button
                      onClick={() => {
                        if (window.confirm('この時点に戻りますか？\n以降のチャット履歴は削除されます。')) {
                          goToMessage(message.id);
                        }
                      }}
                      className="absolute -top-3 -right-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all z-10"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      この時点に戻る
                    </button>
                  )}
                    {message.isCustomRule && (
                    <div className="mb-4 flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-bold shadow-md animate-pulse">
                        <span className="text-lg">🏢</span>
                        社内独自ルール
                      </div>
                      <span className="text-xs text-violet-600 font-medium">※ 当社固有の規則です</span>
                    </div>
                  )}
                  <div className={cn(
                    'whitespace-pre-wrap text-base leading-relaxed',
                    message.role === 'user' ? 'text-white' : 'text-gray-800'
                  )}>
                    {message.content}
                  </div>
                  
                  {/* エラーガイド */}
                  {message.errorGuide && (
                    <div className={cn(
                      'mt-5 p-5 rounded-xl border-2 animate-fade-in',
                      message.isCustomRule
                        ? 'bg-violet-50 border-violet-300 shadow-md'
                        : 'bg-blue-50 border-blue-300'
                    )}>
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          message.isCustomRule ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-md' : 'bg-blue-500'
                        )}>
                          <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={cn(
                            'font-bold text-lg mb-3',
                            message.isCustomRule ? 'text-violet-900' : 'text-blue-900'
                          )}>
                            {message.errorGuide.title}
                          </h4>
                          
                          {message.errorGuide.steps && message.errorGuide.steps.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-bold text-gray-700 mb-2">修正手順:</p>
                              <ol className="space-y-2">
                                {message.errorGuide.steps.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-base text-gray-700">
                                    <span className={cn(
                                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white',
                                      message.isCustomRule ? 'bg-gradient-to-br from-violet-500 to-purple-500' : 'bg-blue-500'
                                    )}>
                                      {idx + 1}
                                    </span>
                                    <span className="flex-1 pt-0.5">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          
                          {message.errorGuide.examples && message.errorGuide.examples.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-bold text-gray-700 mb-2">正しい例:</p>
                              <div className="space-y-2">
                                {message.errorGuide.examples.map((example, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      'px-4 py-3 rounded-lg font-mono text-sm flex items-center gap-2',
                                      message.isCustomRule
                                        ? 'bg-violet-100 text-violet-900 border border-violet-300'
                                        : 'bg-blue-100 text-blue-900 border border-blue-300'
                                    )}
                                  >
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    {example}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {message.errorGuide.tips && message.errorGuide.tips.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-gray-700 mb-2">💡 ヒント:</p>
                              <ul className="space-y-1">
                                {message.errorGuide.tips.map((tip, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-base text-gray-600">
                                    <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 確認ポイントガイド */}
                  {message.checkGuide && (
                    <div className="mt-5 p-5 rounded-xl border-2 bg-teal-50 border-teal-300 animate-fade-in">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-teal-500">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-3 text-teal-900">
                            {message.checkGuide.title}
                          </h4>
                          
                          {message.checkGuide.checkPoints && message.checkGuide.checkPoints.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-bold text-gray-700 mb-2">確認ポイント:</p>
                              <ul className="space-y-2">
                                {message.checkGuide.checkPoints.map((point, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-base text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-teal-600" />
                                    <span className="flex-1">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {message.checkGuide.commands && message.checkGuide.commands.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                確認用コマンド:
                              </p>
                              <div className="space-y-2">
                                {message.checkGuide.commands.map((cmd, idx) => (
                                  <div
                                    key={idx}
                                    className="px-4 py-3 rounded-lg font-mono text-sm bg-gray-800 text-green-400 border border-gray-700"
                                  >
                                    $ {cmd}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {message.checkGuide.visualGuide && message.checkGuide.visualGuide.length > 0 && (
                            <div>
                              <p className="text-sm font-bold text-gray-700 mb-2">👀 視覚的な確認方法:</p>
                              <ul className="space-y-1">
                                {message.checkGuide.visualGuide.map((guide, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-base text-gray-600">
                                    <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-teal-600" />
                                    <span>{guide}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 選択肢ボタン */}
                  {message.options && message.options.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {message.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          className={cn(
                            'w-full text-left justify-start rounded-xl font-semibold text-base py-4 px-5 transition-all',
                            message.role === 'user' 
                              ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30' 
                              : 'bg-gray-50 hover:bg-teal-50 text-gray-800 border-2 border-gray-200 hover:border-teal-400'
                          )}
                          onClick={() => handleOptionClick(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="border-t border-gray-200 bg-white p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* ルールガイド */}
          {currentStepRule && (
            <div className={cn(
              'rounded-xl p-5 animate-fade-in',
              currentStepRule.rule.isCustomRule
                ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-400 shadow-lg ring-2 ring-violet-200 ring-offset-2'
                : 'bg-blue-50 border-2 border-blue-200'
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                  currentStepRule.rule.isCustomRule ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-md' : 'bg-blue-500'
                )}>
                  {currentStepRule.rule.isCustomRule ? (
                    <span className="text-xl">🏢</span>
                  ) : (
                    <Info className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  {currentStepRule.rule.isCustomRule && (
                    <div className="mb-3 flex items-center gap-3">
                      <span className="px-4 py-1.5 text-sm font-bold rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm">
                        🏢 社内独自ルール
                      </span>
                      <span className="text-xs text-violet-600 font-medium">※ 当社固有の規則です</span>
                    </div>
                  )}
                  <h4 className={cn(
                    'font-bold text-lg mb-1',
                    currentStepRule.rule.isCustomRule ? 'text-violet-900' : 'text-gray-900'
                  )}>
                    {currentStepRule.rule.name}
                  </h4>
                  <p className={cn(
                    'text-base mb-3',
                    currentStepRule.rule.isCustomRule ? 'text-violet-800' : 'text-gray-700'
                  )}>
                    {currentStepRule.rule.description}
                  </p>
                  {currentStepRule.rule.example && (
                    <div className={cn(
                      'p-3 rounded-lg border',
                      currentStepRule.rule.isCustomRule 
                        ? 'bg-violet-100 border-violet-300' 
                        : 'bg-white border-gray-200'
                    )}>
                      <p className="text-sm text-gray-600 font-medium mb-1">例:</p>
                      <code className={cn(
                        'text-base font-mono',
                        currentStepRule.rule.isCustomRule ? 'text-violet-900' : 'text-gray-900'
                      )}>
                        {currentStepRule.rule.example}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 入力フォーム */}
          <div className="flex gap-4">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={currentStepRule ? "上記のルールに従って入力してください..." : "メッセージを入力..."}
              className="flex-1 h-14 text-base px-5 rounded-xl border-2 border-gray-200 focus:border-teal-500 bg-white"
            />
            <Button 
              onClick={handleSend} 
              className="h-14 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-base shadow-sm transition-all hover:shadow-md"
            >
              <Send className="w-5 h-5 mr-2" />
              送信
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
