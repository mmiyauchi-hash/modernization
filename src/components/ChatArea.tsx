import { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, User, Bot, Info, AlertCircle, CheckCircle2, Lightbulb, ArrowRight, Eye, Terminal } from 'lucide-react';
import { gitMigrationScenario, getNextStep } from '../lib/gitScenario';
import { cn } from '../lib/utils';

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
  } = useStore();
  
  // チャットがリセットされた時にリセット
  useEffect(() => {
    if (chatMessages.length === 0) {
      initialMessageAddedRef.current.clear();
    }
  }, [chatMessages.length]);

  const [inputValue, setInputValue] = useState('');
  const [currentStepId, setCurrentStepIdLocal] = useState<string | null>(savedCurrentStepId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageAddedRef = useRef<Set<string>>(new Set()); // 既に追加されたフェーズを追跡
  
  // 保存されたステップIDと同期
  useEffect(() => {
    if (savedCurrentStepId !== currentStepId) {
      setCurrentStepIdLocal(savedCurrentStepId);
    }
  }, [savedCurrentStepId]);
  
  // ステップIDが変更されたらストアに保存
  const updateCurrentStepId = (stepId: string | null) => {
    setCurrentStepIdLocal(stepId);
    setCurrentStepId(stepId);
  };

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

    // 関連するルールを探す
    const relatedRule = localRules.find((r) => {
      // リポジトリ名入力の場合は命名規則を取得
      if (currentStep.id === 'repository-name' && r.type === 'naming') {
        return true;
      }
      // 他のステップでもルールタイプに応じて取得できるように拡張可能
      return false;
    });

    if (!relatedRule) return null;

    return {
      rule: relatedRule,
      step: currentStep,
    };
  }, [selectedCategory, currentStepId, gitMigrationPhase.phase, localRules]);

  // カテゴリー選択時またはフェーズ変更時に初期メッセージを追加
  useEffect(() => {
    const isGitMigration = selectedCategory === 'git-migration';
    if (!isGitMigration) {
      // カテゴリーが変更されたらリセット
      initialMessageAddedRef.current.clear();
      return;
    }

    const scenario = gitMigrationScenario[gitMigrationPhase.phase];
    if (!scenario || scenario.length === 0) return;

    const firstStep = scenario[0];
    const phaseKey = `${gitMigrationPhase.phase}-${firstStep.id}`;
    
    // 既にこのフェーズの初期メッセージを追加したかチェック
    if (initialMessageAddedRef.current.has(phaseKey)) {
      // 既に追加済みの場合は、ステップIDのみ更新
      if (currentStepId !== firstStep.id) {
        updateCurrentStepId(firstStep.id);
      }
      return;
    }
    
    // 既に同じ内容のメッセージがチャットに存在するかチェック
    const hasStepMessage = chatMessages.some(
      (msg) => {
        const isSameContent = msg.role === 'assistant' && msg.content === firstStep.message;
        const msgOptions = msg.options?.join(',') || '';
        const stepOptions = firstStep.options?.join(',') || '';
        const isSameOptions = msgOptions === stepOptions;
        return isSameContent && isSameOptions;
      }
    );
    
    // まだメッセージが存在しない場合のみ追加
    if (!hasStepMessage) {
      addChatMessage({
        role: 'assistant',
        content: firstStep.message,
        options: firstStep.options,
        checkGuide: firstStep.checkGuide,
      });
      updateCurrentStepId(firstStep.id);
      initialMessageAddedRef.current.add(phaseKey);
    } else {
      // メッセージは既に存在するが、まだマークされていない場合
      updateCurrentStepId(firstStep.id);
      initialMessageAddedRef.current.add(phaseKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, gitMigrationPhase.phase]);

  // メッセージが追加されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!inputValue.trim() || !selectedCategory) return;

    // ユーザーメッセージを追加
    addChatMessage({
      role: 'user',
      content: inputValue,
    });

    // Git移行ガイドの場合
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
      console.error('Scenario or currentStepId is missing', { phase, currentStepId });
      return;
    }

    const currentStep = scenario.find((s) => s.id === currentStepId);
    if (!currentStep) {
      console.error('Current step not found', { currentStepId, phase });
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
        });
        return;
      }

      // システム名、管理者ID、リポジトリ名を保存
      if (currentStep.id === 'system-name') {
        setGitMigrationPhase({ systemName: userInput });
      } else if (currentStep.id === 'admin-id') {
        setGitMigrationPhase({ adminId: userInput });
      } else if (currentStep.id === 'repository-name') {
        // リポジトリ名は保存（必要に応じて）
      }
    }

    // SubversionリポジトリURLの保存
    if (currentStepId === 'svn-repo-check') {
      setGitMigrationPhase({ svnRepositoryUrl: userInput });
    }

    // 環境選択の場合
    if (phase === 'selection' && currentStepId === 'environment-selection') {
      if (userInput.includes('SaaS') || userInput.includes('A')) {
        setGitMigrationPhase({ environmentType: 'saas' });
      } else if (userInput.includes('セルフホスト') || userInput.includes('B')) {
        setGitMigrationPhase({ environmentType: 'self-hosted' });
      }
    }
    
    // アカウント作成チェックの場合
    if (phase === 'account-creation' && currentStepId === 'account-check') {
      if (userInput.includes('セルフホスト')) {
        // セルフホスト版の場合はアカウント作成をスキップして移行実行へ
        setGitMigrationPhase({ phase: 'migration' });
        const nextStep = gitMigrationScenario['migration']?.[0];
        if (nextStep) {
          addChatMessage({
            role: 'assistant',
            content: nextStep.message,
            options: nextStep.options,
            checkGuide: nextStep.checkGuide,
          });
          updateCurrentStepId(nextStep.id);
        }
        return;
      } else if (userInput.includes('アカウントを持っている')) {
        // 既にアカウントがある場合は確認ステップへ
        const verificationStep = gitMigrationScenario['account-creation']?.find(s => s.id === 'account-verification');
        if (verificationStep) {
          addChatMessage({
            role: 'assistant',
            content: verificationStep.message,
            options: verificationStep.options,
            checkGuide: verificationStep.checkGuide,
          });
          updateCurrentStepId(verificationStep.id);
        }
        return;
      }
    }
    
    // GitHubアカウント作成の場合
    if (phase === 'account-creation' && currentStepId === 'github-account-creation') {
      if (userInput.includes('GitLab')) {
        // GitLabアカウント作成へ
        const gitlabStep = gitMigrationScenario['account-creation']?.find(s => s.id === 'gitlab-account-creation');
        if (gitlabStep) {
          addChatMessage({
            role: 'assistant',
            content: gitlabStep.message,
            options: gitlabStep.options,
            checkGuide: gitlabStep.checkGuide,
          });
          updateCurrentStepId(gitlabStep.id);
        }
        return;
      }
    }
    
    // アカウント作成完了の場合
    if (phase === 'account-creation' && (currentStepId === 'github-account-creation' || currentStepId === 'gitlab-account-creation')) {
      if (userInput.includes('作成完了')) {
        setGitMigrationPhase({ gitAccountCreated: true });
      }
    }
    
    // 認証方法選択の場合
    if (phase === 'repository' && currentStepId === 'authentication-method') {
      if (userInput.includes('SSH')) {
        // SSH鍵認証の場合は鍵生成へ
        const sshKeyStep = gitMigrationScenario['repository']?.find(s => s.id === 'ssh-key-generation');
        if (sshKeyStep) {
          addChatMessage({
            role: 'assistant',
            content: sshKeyStep.message,
            options: sshKeyStep.options,
            checkGuide: sshKeyStep.checkGuide,
          });
          updateCurrentStepId(sshKeyStep.id);
        }
        return;
      } else if (userInput.includes('HTTPS')) {
        // HTTPS認証の場合はトークン設定へ
        const tokenStep = gitMigrationScenario['repository']?.find(s => s.id === 'https-token-setup');
        if (tokenStep) {
          addChatMessage({
            role: 'assistant',
            content: tokenStep.message,
            options: tokenStep.options,
            checkGuide: tokenStep.checkGuide,
          });
          updateCurrentStepId(tokenStep.id);
        }
        return;
      }
    }
    
    // SSH鍵生成の場合
    if (phase === 'repository' && currentStepId === 'ssh-key-generation') {
      if (userInput.includes('HTTPS認証に変更')) {
        // HTTPS認証に変更
        const tokenStep = gitMigrationScenario['repository']?.find(s => s.id === 'https-token-setup');
        if (tokenStep) {
          addChatMessage({
            role: 'assistant',
            content: tokenStep.message,
            options: tokenStep.options,
            checkGuide: tokenStep.checkGuide,
          });
          updateCurrentStepId(tokenStep.id);
        }
        return;
      } else if (userInput.includes('生成完了') || userInput.includes('既に鍵がある')) {
        // GitHubまたはGitLabに鍵を登録
        const isGitHub = gitMigrationPhase.environmentType === 'saas'; // 環境タイプから判断
        const sshKeyStep = gitMigrationScenario['repository']?.find(s => 
          isGitHub ? s.id === 'ssh-key-registration-github' : s.id === 'ssh-key-registration-gitlab'
        );
        if (sshKeyStep) {
          addChatMessage({
            role: 'assistant',
            content: sshKeyStep.message,
            options: sshKeyStep.options,
            checkGuide: sshKeyStep.checkGuide,
          });
          updateCurrentStepId(sshKeyStep.id);
        }
        return;
      }
    }

    // 進捗更新（9フェーズ構成）
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

    // 次のステップを取得
    const next = getNextStep(phase, currentStepId, userInput, gitMigrationPhase);
    
    if (next.completed) {
      addChatMessage({
        role: 'assistant',
        content: '🎉 Git移行ガイドが完了しました！\n\n次のステップに進む準備ができました。',
      });
      updateProgress('git-migration', 100, 'Lv1');
      return;
    }

    if (next.nextPhase) {
      setGitMigrationPhase({ phase: next.nextPhase as any });
      const nextScenario = gitMigrationScenario[next.nextPhase];
      if (nextScenario && nextScenario.length > 0) {
        const nextStep = nextScenario[0];
        addChatMessage({
          role: 'assistant',
          content: nextStep.message,
          options: nextStep.options,
          checkGuide: nextStep.checkGuide,
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
        });
        updateCurrentStepId(next.nextStepId);
      }
    }
  };

  const handleOptionClick = (option: string) => {
    if (!selectedCategory) return;
    
    // ユーザーメッセージを追加
    addChatMessage({
      role: 'user',
      content: option,
    });

    // Git移行ガイドの場合
    const isGitMigration = selectedCategory === 'git-migration';
    if (isGitMigration) {
      handleGitMigrationResponse(option);
    }

    setInputValue('');
  };

  // Git切り替えガイド専用ページでは常にgit-migrationが選択されている
  const isGitMigration = selectedCategory === 'git-migration';

  if (!selectedCategory && !isGitMigration) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            カテゴリーを選択してください
          </h3>
          <p className="text-gray-600">
            左側のメニューからモダナイゼーション項目を選択して<br />
            ガイドを始めましょう！
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* チャットヘッダー（進捗ゲージはGitGuideLayoutで表示されるため、ここでは簡易表示） */}
      {!isGitMigration && (
        <div className="border-b glass-strong border-white/20 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-modern">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">ガイド</h2>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-full">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-modern">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] p-4 rounded-2xl shadow-modern',
                message.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                  : message.isCustomRule
                  ? 'glass-strong text-gray-900 border-2 border-amber-400 bg-gradient-to-br from-amber-50/90 to-orange-50/90 shadow-lg'
                  : 'glass-strong text-gray-900 border border-white/20'
              )}
            >
              {message.isCustomRule && (
                <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
                  <span className="text-xs font-bold">⚠️ 社内独自ルール</span>
                </div>
              )}
              <div className={cn(
                'whitespace-pre-wrap text-sm leading-relaxed font-medium',
                message.isCustomRule && 'text-gray-900'
              )}>{message.content}</div>
              
              {/* エラーガイド */}
              {message.errorGuide && (
                <div className={cn(
                  'mt-4 p-4 rounded-xl border-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300',
                  message.isCustomRule
                    ? 'bg-gradient-to-br from-amber-50/95 to-orange-50/95 border-amber-400'
                    : 'bg-gradient-to-br from-blue-50/95 to-indigo-50/95 border-indigo-300'
                )}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                      message.isCustomRule
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    )}>
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        'font-bold text-sm mb-2',
                        message.isCustomRule ? 'text-amber-900' : 'text-indigo-900'
                      )}>
                        {message.errorGuide.title}
                      </h4>
                      
                      {/* 修正手順 */}
                      {message.errorGuide.steps && message.errorGuide.steps.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">修正手順:</p>
                          <ol className="space-y-1.5 ml-2">
                            {message.errorGuide.steps.map((step, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                                <span className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5',
                                  message.isCustomRule
                                    ? 'bg-amber-400 text-white'
                                    : 'bg-indigo-500 text-white'
                                )}>
                                  {index + 1}
                                </span>
                                <span className="flex-1 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      
                      {/* 正しい例 */}
                      {message.errorGuide.examples && message.errorGuide.examples.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">正しい例:</p>
                          <div className="space-y-1.5">
                            {message.errorGuide.examples.map((example, index) => (
                              <div
                                key={index}
                                className={cn(
                                  'px-3 py-2 rounded-lg border font-mono text-xs',
                                  message.isCustomRule
                                    ? 'bg-amber-100/80 border-amber-300 text-amber-900'
                                    : 'bg-indigo-100/80 border-indigo-300 text-indigo-900'
                                )}
                              >
                                <CheckCircle2 className="w-3 h-3 inline mr-1.5" />
                                {example}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* ヒント */}
                      {message.errorGuide.tips && message.errorGuide.tips.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">💡 ヒント:</p>
                          <ul className="space-y-1 ml-2">
                            {message.errorGuide.tips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
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
                <div className="mt-4 p-4 rounded-xl border-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 bg-gradient-to-br from-blue-50/95 to-indigo-50/95 border-blue-300">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-2 text-indigo-900">
                        {message.checkGuide.title}
                      </h4>
                      
                      {/* 確認ポイント */}
                      {message.checkGuide.checkPoints && message.checkGuide.checkPoints.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">確認ポイント:</p>
                          <ul className="space-y-1.5 ml-2">
                            {message.checkGuide.checkPoints.map((point, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-600" />
                                <span className="flex-1 leading-relaxed">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* コマンド */}
                      {message.checkGuide.commands && message.checkGuide.commands.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Terminal className="w-3 h-3" />
                            確認用コマンド:
                          </p>
                          <div className="space-y-1.5">
                            {message.checkGuide.commands.map((cmd, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 rounded-lg border font-mono text-xs bg-blue-100/80 border-blue-300 text-blue-900"
                              >
                                {cmd}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 視覚的な確認方法 */}
                      {message.checkGuide.visualGuide && message.checkGuide.visualGuide.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">👀 視覚的な確認方法:</p>
                          <ul className="space-y-1 ml-2">
                            {message.checkGuide.visualGuide.map((guide, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-600" />
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
              
              {message.options && message.options.length > 0 && (
                <div className="mt-4 space-y-2">
                  {message.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full text-left justify-start rounded-lg font-medium transition-all hover:scale-[1.02]',
                        message.role === 'user' 
                          ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' 
                          : 'bg-white/60 hover:bg-white/80 text-gray-900 border border-gray-200/50 shadow-sm'
                      )}
                      onClick={() => handleOptionClick(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-modern">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t glass-strong border-white/20 p-4">
        <div className="w-full space-y-3">
          {/* ルールガイド（吹き出し） */}
          {currentStepRule && (
            <div className={cn(
              'relative rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300',
              currentStepRule.rule.isCustomRule
                ? 'bg-gradient-to-br from-amber-50/95 to-orange-50/95 border-2 border-amber-400'
                : 'glass-strong border border-indigo-200/50 bg-white/80'
            )}>
              {/* 吹き出しの矢印 */}
              <div className={cn(
                'absolute -top-2 left-6 w-4 h-4 rotate-45',
                currentStepRule.rule.isCustomRule
                  ? 'bg-gradient-to-br from-amber-50/95 to-orange-50/95 border-l-2 border-t-2 border-amber-400'
                  : 'bg-white/80 border-l border-t border-indigo-200/50'
              )} />
              
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                  currentStepRule.rule.isCustomRule
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                )}>
                  {currentStepRule.rule.isCustomRule ? (
                    <AlertCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Info className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  {currentStepRule.rule.isCustomRule && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                        社内独自ルール
                      </span>
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                    {currentStepRule.rule.name}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                    {currentStepRule.rule.description}
                  </p>
                  {currentStepRule.rule.example && (
                    <div className="mt-2 p-2 rounded-lg bg-gray-100/80 border border-gray-200/50">
                      <p className="text-xs text-gray-600 font-medium mb-1">例:</p>
                      <code className="text-xs text-gray-900 font-mono">{currentStepRule.rule.example}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={currentStepRule ? "上記のルールに従って入力してください..." : "メッセージを入力..."}
              className={cn(
                "flex-1 rounded-xl border focus:ring-2 px-4 py-3 text-sm bg-white/80 backdrop-blur-sm transition-all",
                currentStepRule?.rule.isCustomRule
                  ? "border-amber-300/50 focus:border-amber-500 focus:ring-amber-500/20"
                  : "border-gray-200/50 focus:border-indigo-500 focus:ring-indigo-500/20"
              )}
            />
            <Button 
              onClick={handleSend} 
              size="icon"
              className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-modern w-12 h-12 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

