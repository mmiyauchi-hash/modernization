import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, Info, AlertCircle, CheckCircle2, Lightbulb, ArrowRight, Eye, Terminal } from 'lucide-react';
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
  
  const [inputValue, setInputValue] = useState('');
  const [currentStepId, setCurrentStepIdLocal] = useState<string | null>(savedCurrentStepId || null);
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

  const handleSend = () => {
    if (!inputValue.trim() || !selectedCategory) return;

    addChatMessage({
      role: 'user',
      content: inputValue,
    });

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
      });
      updateProgress('git-migration', 100, 'Lv1');
      return;
    }

    if (next.nextPhase) {
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
    
    addChatMessage({
      role: 'user',
      content: option,
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
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'animate-fade-in',
                message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mr-4 shadow-sm">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-2xl rounded-2xl shadow-sm',
                  message.role === 'user'
                    ? 'bg-teal-500 text-white px-6 py-4'
                    : message.isCustomRule
                    ? 'bg-white border-2 border-amber-400 px-6 py-5'
                    : 'bg-white border border-gray-200 px-6 py-5'
                )}
              >
                {message.isCustomRule && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-sm font-bold">
                    ⚠️ 社内独自ルール
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
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-blue-50 border-blue-300'
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        message.isCustomRule ? 'bg-amber-500' : 'bg-blue-500'
                      )}>
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className={cn(
                          'font-bold text-lg mb-3',
                          message.isCustomRule ? 'text-amber-900' : 'text-blue-900'
                        )}>
                          {message.errorGuide.title}
                        </h4>
                        
                        {message.errorGuide.steps && message.errorGuide.steps.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-bold text-gray-700 mb-2">修正手順:</p>
                            <ol className="space-y-2">
                              {message.errorGuide.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-3 text-base text-gray-700">
                                  <span className={cn(
                                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white',
                                    message.isCustomRule ? 'bg-amber-500' : 'bg-blue-500'
                                  )}>
                                    {index + 1}
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
                              {message.errorGuide.examples.map((example, index) => (
                                <div
                                  key={index}
                                  className={cn(
                                    'px-4 py-3 rounded-lg font-mono text-sm flex items-center gap-2',
                                    message.isCustomRule
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
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
                              {message.errorGuide.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-base text-gray-600">
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
                              {message.checkGuide.checkPoints.map((point, index) => (
                                <li key={index} className="flex items-start gap-3 text-base text-gray-700">
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
                              {message.checkGuide.commands.map((cmd, index) => (
                                <div
                                  key={index}
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
                              {message.checkGuide.visualGuide.map((guide, index) => (
                                <li key={index} className="flex items-start gap-2 text-base text-gray-600">
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
                    {message.options.map((option, index) => (
                      <Button
                        key={index}
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
          ))}
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
                ? 'bg-amber-50 border-2 border-amber-400'
                : 'bg-blue-50 border-2 border-blue-200'
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  currentStepRule.rule.isCustomRule ? 'bg-amber-500' : 'bg-blue-500'
                )}>
                  {currentStepRule.rule.isCustomRule ? (
                    <AlertCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Info className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  {currentStepRule.rule.isCustomRule && (
                    <div className="mb-2">
                      <span className="px-3 py-1 text-sm font-bold rounded-full bg-amber-500 text-white">
                        社内独自ルール
                      </span>
                    </div>
                  )}
                  <h4 className="font-bold text-gray-900 text-lg mb-1">
                    {currentStepRule.rule.name}
                  </h4>
                  <p className="text-base text-gray-700 mb-3">
                    {currentStepRule.rule.description}
                  </p>
                  {currentStepRule.rule.example && (
                    <div className="p-3 rounded-lg bg-white border border-gray-200">
                      <p className="text-sm text-gray-600 font-medium mb-1">例:</p>
                      <code className="text-base text-gray-900 font-mono">{currentStepRule.rule.example}</code>
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
