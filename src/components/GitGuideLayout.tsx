import { useStore } from '../store/useStore';
import { ChatArea } from './ChatArea';
import { Button } from './ui/button';
import { ArrowLeft, CheckCircle2, Settings, BookOpen, ExternalLink, Info, RotateCcw } from 'lucide-react';
import { getStepStatus } from '../lib/gitSteps';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export function GitGuideLayout() {
  const { gitMigrationPhase, progress, setGitMigrationPhase, resetChat, updateProgress, localRules, chatMessages, clearSavedProgress } = useStore();
  const navigate = useNavigate();
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  
  // 保存された進捗があるかチェック
  useEffect(() => {
    const gitProgress = progress.find(p => p.category === 'git-migration');
    const hasSavedProgress = chatMessages.length > 0 || gitMigrationPhase.phase !== 'preparation' || (gitProgress?.progress ?? 0) > 0;
    if (hasSavedProgress) {
      setShowRestoreDialog(true);
    }
  }, []); // 初回マウント時のみ実行
  
  const gitProgress = progress.find((p) => p.category === 'git-migration') || {
    progress: 0,
    level: 'Lv0' as const,
    completed: false,
  };
  
  const steps = getStepStatus(gitMigrationPhase.phase, gitProgress.progress);

  // ステップをクリックしてそのフェーズから開始する（戻ることも可能）
  const handleStepClick = (step: { phase: string; id: string }) => {
    // 現在のフェーズと同じ場合は何もしない
    if (step.phase === gitMigrationPhase.phase) {
      return;
    }

    // チャットをリセット
    resetChat();
    
    // フェーズを変更（ChatAreaのuseEffectが自動的に初期メッセージを追加する）
    setGitMigrationPhase({ phase: step.phase as any });

    // 進捗を更新（フェーズに応じた進捗率を設定）
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
    setShowRestoreDialog(false);
    // 進捗は既に復元されているので、何もしない
  };
  
  const handleStartFresh = () => {
    clearSavedProgress();
    resetChat();
    setGitMigrationPhase({ phase: 'preparation' });
    updateProgress('git-migration', 0, 'Lv0');
    setShowRestoreDialog(false);
  };

  return (
    <div className="flex h-screen">
      {/* 進捗復元確認ダイアログ */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-modern-lg border border-gray-200/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-modern">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">保存された進捗があります</h3>
                <p className="text-sm text-gray-600">前回の続きから始めますか？</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 rounded-lg bg-indigo-50/80 border border-indigo-200/50">
              <p className="text-xs text-gray-700 mb-1">
                <strong>現在の進捗:</strong> {progress.find(p => p.category === 'git-migration')?.progress || 0}%
              </p>
              <p className="text-xs text-gray-700 mb-1">
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
              <p className="text-xs text-gray-700">
                <strong>メッセージ数:</strong> {chatMessages.length}件
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleStartFresh}
                variant="outline"
                className="flex-1"
              >
                最初から始める
              </Button>
              <Button
                onClick={handleRestoreProgress}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                続きから始める
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 左側：ステップ一覧 */}
      <div className="w-80 glass-strong border-r border-white/20 overflow-y-auto">
        <div className="p-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            メインページに戻る
          </Button>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
              Git切り替えガイド
            </h2>
            <p className="text-xs text-gray-600 font-medium">
              Subversion → Git への移行をサポート
            </p>
          </div>
          
          {/* 進捗サマリー */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white mb-6 shadow-modern-lg">
            <div className="mb-3">
              <span className="text-xs font-medium opacity-90">全体進捗</span>
            </div>
            <div className="text-4xl font-bold mb-3 tracking-tight">
              {gitProgress.progress}%
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-300 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${gitProgress.progress}%` }}
              />
            </div>
          </div>
          
          {/* ステップ一覧 */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-wider">
              完了までの流れ
            </h3>
            {steps.map((step, index) => {
              const isCurrentPhase = step.phase === gitMigrationPhase.phase;
              const isClickable = !isCurrentPhase; // 現在のフェーズ以外はすべてクリック可能
              
              return (
              <div
                key={step.id}
                onClick={() => isClickable && handleStepClick(step)}
                className={cn(
                  'p-4 rounded-xl border transition-all duration-300',
                  step.current 
                    ? 'glass bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-300/50 shadow-modern' 
                    : step.completed
                    ? isClickable
                      ? 'bg-emerald-50/80 border-emerald-200/50 hover:bg-emerald-100/80 hover:border-emerald-300/50 cursor-pointer hover:shadow-modern'
                      : 'bg-emerald-50/80 border-emerald-200/50'
                    : isClickable
                    ? 'bg-white/60 border-gray-200/50 hover:bg-white/80 hover:border-indigo-300/50 cursor-pointer hover:shadow-modern'
                    : 'bg-white/60 border-gray-200/50 opacity-60'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                    step.completed 
                      ? 'bg-emerald-500 text-white shadow-modern' 
                      : step.current
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-modern'
                      : 'bg-gray-300 text-gray-600'
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      'font-semibold text-sm mb-1',
                      step.current ? 'text-indigo-700' : step.completed ? 'text-emerald-700' : 'text-gray-700'
                    )}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* 中央：チャットエリア（固定幅） */}
      <div className="w-[800px] flex flex-col flex-shrink-0">
        {/* 進捗ゲージ（チャット上部） */}
        <div className="border-b glass-strong border-white/20 p-5">
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">進捗状況</span>
              <span className="text-sm font-bold text-gray-900">
                {gitProgress.progress}% 完了
              </span>
            </div>
            <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${gitProgress.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 font-medium">
              <span>開始</span>
              <span>完了</span>
            </div>
          </div>
        </div>
        
        {/* チャットエリア */}
        <ChatArea />
      </div>

      {/* 右側：業務ルール確認パネル（オーバーレイまたは固定位置） */}
      {showRulesPanel && (
        <div className="w-80 glass-strong border-l border-white/20 overflow-y-auto flex-shrink-0">
          <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-modern">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">業務ルール</h3>
                <p className="text-xs text-gray-600 font-medium">適用中のルールを確認</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRulesPanel(false)}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>

          {/* 管理者画面へのリンク */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">管理者画面</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              業務ルールの編集や追加は管理者画面で行えます
            </p>
            <Button
              onClick={() => {
                navigate('/', { state: { openAdmin: true } });
              }}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              管理者画面を開く
            </Button>
          </div>

          {/* 適用中のルール一覧 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 mb-3">適用中のルール</h4>
            {localRules.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/50 text-center">
                <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">適用中のルールはありません</p>
              </div>
            ) : (
              localRules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    rule.isCustomRule
                      ? "bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-amber-300/50"
                      : "bg-white/80 border-gray-200/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-sm text-gray-900">{rule.name}</h5>
                        {rule.isCustomRule && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                            社内独自
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mb-2">
                        {rule.description}
                      </p>
                      {rule.example && (
                        <div className="p-2 rounded-lg bg-gray-100/80 border border-gray-200/50">
                          <p className="text-xs text-gray-500 mb-1">例:</p>
                          <code className="text-xs text-gray-900 font-mono">{rule.example}</code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200/50">
                    <span className="text-xs text-gray-500">
                      タイプ: {rule.type === 'naming' ? '命名規則' : rule.type === 'prohibition' ? '禁止事項' : '推奨事項'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      )}

      {/* 業務ルールパネルを開くボタン（右側に固定） */}
      {!showRulesPanel && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <Button
            onClick={() => setShowRulesPanel(true)}
            className="rounded-full w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-modern-lg hover:shadow-modern-xl transition-all hover:scale-110"
          >
            <BookOpen className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

