import { useStore } from '../store/useStore';
import { ChatArea } from './ChatArea';
import { Button } from './ui/button';
import { ArrowLeft, CheckCircle2, Circle, RotateCcw, HelpCircle, X, Lightbulb, ArrowRight } from 'lucide-react';
import { getStepStatus } from '../lib/gitSteps';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useState, useEffect, useLayoutEffect } from 'react';

export function GitGuideLayout() {
  const { gitMigrationPhase, progress, setGitMigrationPhase, resetChat, updateProgress, chatMessages, clearSavedProgress, setSelectedCategory, showHelpGuide, helpGuideContent, hideHelp } = useStore();
  const navigate = useNavigate();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  
  // マウント時にカテゴリーを設定（レンダリング前に同期的に実行）
  useLayoutEffect(() => {
    // 常にgit-migrationを選択状態にする
    setSelectedCategory('git-migration');
  }, [setSelectedCategory]);

  // 保存された進捗があるかチェック
  useEffect(() => {
    const gitProgress = progress.find(p => p.category === 'git-migration');
    const hasSavedProgress = chatMessages.length > 0 || gitMigrationPhase.phase !== 'preparation' || (gitProgress?.progress ?? 0) > 0;
    if (hasSavedProgress) {
      setShowRestoreDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const gitProgress = progress.find((p) => p.category === 'git-migration') || {
    progress: 0,
    level: 'Lv0' as const,
    completed: false,
  };
  
  const steps = getStepStatus(gitMigrationPhase.phase, gitProgress.progress);

  const handleStepClick = (step: { phase: string; id: string }) => {
    if (step.phase === gitMigrationPhase.phase) {
      return;
    }

    resetChat();
    setGitMigrationPhase({ phase: step.phase as any });

    const progressMap: Record<string, number> = {
      preparation: 0,
      selection: 11.1,
      'account-creation': 22.2,
      migration: 33.3,
      repository: 44.4,
      setup: 55.5,
      verification: 66.6,
      rules: 77.7,
      rollout: 88.8,
    };
    updateProgress('git-migration', progressMap[step.phase] || 0, 'Lv1');
  };

  const handleRestoreProgress = () => {
    setSelectedCategory('git-migration'); // カテゴリーを設定
    setShowRestoreDialog(false);
  };
  
  const handleStartFresh = () => {
    // リセット処理（selectedCategoryは維持）
    resetChat();
    setGitMigrationPhase({ phase: 'preparation' });
    updateProgress('git-migration', 0, 'Lv0');
    setSelectedCategory('git-migration'); // カテゴリーを確実に設定
    setShowRestoreDialog(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 進捗復元確認ダイアログ */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center">
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">保存された進捗があります</h3>
                <p className="text-base text-gray-600">前回の続きから始めますか？</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200">
              <p className="text-base text-gray-700 mb-2">
                <strong>現在の進捗:</strong> {progress.find(p => p.category === 'git-migration')?.progress || 0}%
              </p>
              <p className="text-base text-gray-700 mb-2">
                <strong>フェーズ:</strong> {
                  gitMigrationPhase.phase === 'preparation' ? '移行前準備' :
                  gitMigrationPhase.phase === 'selection' ? '環境方式の選択' :
                  gitMigrationPhase.phase === 'migration' ? 'Subversion移行実行' :
                  gitMigrationPhase.phase === 'repository' ? 'リポジトリ設定' :
                  gitMigrationPhase.phase === 'setup' ? 'ローカル環境セットアップ' :
                  gitMigrationPhase.phase === 'verification' ? '移行結果の検証' :
                  gitMigrationPhase.phase === 'rules' ? '運用ルール確認' :
                  gitMigrationPhase.phase === 'rollout' ? 'チームへの展開' : gitMigrationPhase.phase
                }
              </p>
              <p className="text-base text-gray-700">
                <strong>メッセージ数:</strong> {chatMessages.length}件
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={handleStartFresh}
                variant="outline"
                className="flex-1 h-12 text-base font-bold border-2 border-gray-300 hover:bg-gray-100"
              >
                最初から始める
              </Button>
              <Button
                onClick={handleRestoreProgress}
                className="flex-1 h-12 text-base font-bold bg-teal-500 hover:bg-teal-600 text-white"
              >
                続きから始める
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 左サイドバー - Progate風 */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-6">
          {/* 戻るボタン */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-base font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            メインページに戻る
          </Button>
          
          {/* タイトル */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Git切り替えガイド
            </h2>
            <p className="text-base text-gray-600">
              Subversion → Git への移行をサポート
            </p>
          </div>
          
          {/* 進捗サマリー - Progate風 */}
          <div className="bg-teal-500 rounded-2xl p-6 text-white mb-8 shadow-md">
            <div className="mb-2">
              <span className="text-sm font-semibold opacity-90">全体進捗</span>
            </div>
            <div className="text-5xl font-bold mb-4">
              {gitProgress.progress}%
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${gitProgress.progress}%` }}
              />
            </div>
          </div>
          
          {/* ステップ一覧 - Progate風 */}
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
              レッスン内容
            </h3>
            {steps.map((step, index) => {
              const isCurrentPhase = step.phase === gitMigrationPhase.phase;
              const isClickable = !isCurrentPhase;
              
              return (
                <div
                  key={step.id}
                  onClick={() => isClickable && handleStepClick(step)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl transition-all',
                    step.current 
                      ? 'bg-teal-50 border-2 border-teal-400' 
                      : step.completed
                      ? isClickable
                        ? 'hover:bg-gray-50 cursor-pointer'
                        : ''
                      : isClickable
                      ? 'hover:bg-gray-50 cursor-pointer'
                      : 'opacity-50'
                  )}
                >
                  {/* ステップ番号/チェックマーク */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold',
                    step.completed 
                      ? 'bg-teal-500 text-white' 
                      : step.current
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : step.current ? (
                      <Circle className="w-5 h-5 fill-current" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  
                  {/* ステップ情報 */}
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      'font-bold text-base mb-0.5',
                      step.current ? 'text-teal-700' : step.completed ? 'text-gray-700' : 'text-gray-500'
                    )}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ヘッダー - 進捗バー */}
        <div className="bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-gray-700">進捗状況</span>
            <span className="text-base font-bold text-teal-600">
              {gitProgress.progress}% 完了
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${gitProgress.progress}%` }}
            />
          </div>
        </div>
        
        {/* チャットエリア */}
        <ChatArea />
      </div>

      {/* 右側ヘルプパネル */}
      {showHelpGuide && helpGuideContent && (
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 animate-fade-in">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">操作ガイド</h3>
                  <p className="text-sm text-gray-500">困ったときのヘルプ</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={hideHelp}
                className="w-10 h-10 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            {/* ガイド内容 */}
            <div className="space-y-6">
              {/* タイトルと説明 */}
              <div className="p-5 bg-amber-50 rounded-xl border-2 border-amber-200">
                <div className="flex items-start gap-3 mb-3">
                  <Lightbulb className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {helpGuideContent.title}
                    </h4>
                    <p className="text-base text-gray-700 leading-relaxed">
                      {helpGuideContent.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* 手順 */}
              {helpGuideContent.steps && helpGuideContent.steps.length > 0 && (
                <div>
                  <h5 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-sm flex items-center justify-center">
                      📝
                    </span>
                    操作手順
                  </h5>
                  <div className="space-y-3">
                    {helpGuideContent.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <span className="w-8 h-8 rounded-full bg-teal-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-base text-gray-700 pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ヒント */}
              {helpGuideContent.tips && helpGuideContent.tips.length > 0 && (
                <div>
                  <h5 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">
                      💡
                    </span>
                    ヒント
                  </h5>
                  <div className="space-y-2">
                    {helpGuideContent.tips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-base text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 閉じるボタン */}
              <Button
                onClick={hideHelp}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
              >
                ガイドを閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
