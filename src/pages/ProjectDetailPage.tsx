import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getCategoryIcon } from '../data/categories';
import { ModernizationCategory } from '../types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Users,
  FolderKanban,
  ChevronRight,
  Save,
  Check,
  HelpCircle,
  X,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

// 簡易ガイドの定義
type GuideKey = 'gettingStarted' | 'companyRules' | 'progressSave';

const QUICK_GUIDES: Record<GuideKey, {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
}> = {
  gettingStarted: {
    title: 'タスクの進め方',
    description: 'プロジェクトのモダナイゼーションを効率的に進めるためのガイドです。',
    steps: [
      '① まずは「Git切り替えガイド」から始めましょう',
      '② 各タスクをクリックすると詳細ガイドが表示されます',
      '③ 順番に進めることで、スムーズに移行できます',
    ],
    tips: [
      '💡 上から順番に進めるのがおすすめです',
      '💡 困ったら「わからない」と入力するとヘルプが表示されます',
    ],
  },
  companyRules: {
    title: '社内独自ルールについて',
    description: 'Git移行時に適用される社内ルールの概要です。',
    steps: [
      '📋 リポジトリ命名規則: prj-部署コード-システム名',
      '📋 Cherry-pick は社内禁止（マージコミットを推奨）',
      '📋 mainブランチへの直接pushは禁止',
    ],
    tips: [
      '💡 ルール違反があるとガイド内で警告が表示されます',
      '💡 紫色のハイライトは社内独自ルールの目印です',
    ],
  },
  progressSave: {
    title: '進捗の保存について',
    description: '進捗データの保存と復元についてのご案内です。',
    steps: [
      '✓ 進捗は自動的にブラウザに保存されます',
      '✓ ページを閉じても、次回アクセス時に続きから再開可能',
      '✓ 管理者画面で全プロジェクトの進捗を一覧確認できます',
    ],
    tips: [
      '💡 ブラウザのキャッシュをクリアすると進捗がリセットされます',
      '💡 定期的にスクリーンショットで記録を残すと安心です',
    ],
  },
};

// ステータスを進捗率から判定
const getStatusFromProgress = (progress: number): 'completed' | 'in_progress' | 'started' | 'not_started' => {
  if (progress === 100) return 'completed';
  if (progress >= 30) return 'in_progress';
  if (progress > 0) return 'started';
  return 'not_started';
};

// ステータスに応じた色とラベルを返す
const getStatusConfig = (status: 'completed' | 'in_progress' | 'started' | 'not_started') => {
  switch (status) {
    case 'completed':
      return { color: 'bg-green-500', bgLight: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: '完了', icon: CheckCircle2 };
    case 'in_progress':
      return { color: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: '進行中', icon: TrendingUp };
    case 'started':
      return { color: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: '着手', icon: Clock };
    case 'not_started':
      return { color: 'bg-gray-400', bgLight: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: '未着手', icon: AlertCircle };
  }
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, categories, progress, setSelectedProject, setSelectedCategory } = useStore();
  const [showSaved, setShowSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<GuideKey>('gettingStarted');

  // プロジェクトを取得
  const project = projects.find(p => p.id === projectId);

  // プロジェクト選択を設定
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId, setSelectedProject]);

  // 初回表示時（未着手タスクが多い場合）にガイドを自動表示
  useEffect(() => {
    const notStartedCount = categories.filter(c => {
      const progressItem = progress.find(p => p.category === c.id);
      return !progressItem || progressItem.progress === 0;
    }).length;
    
    // 未着手が3つ以上の場合、初回ガイドを表示
    if (notStartedCount >= 3) {
      setCurrentGuide('gettingStarted');
      setShowGuide(true);
    }
  }, [categories, progress]);

  // ガイドを表示
  const showHelpGuide = (guideKey: GuideKey) => {
    setCurrentGuide(guideKey);
    setShowGuide(true);
  };

  // 実際のコース進捗を取得（progressストアから）
  const getActualCourseProgress = (categoryId: string): number => {
    const progressItem = progress.find(p => p.category === categoryId);
    return progressItem?.progress || 0;
  };

  // プロジェクトの進捗を計算
  const getProjectCourseProgress = (categoryId: string): number => {
    // 選択中のプロジェクトの場合は実際のガイド進捗を反映
    return getActualCourseProgress(categoryId);
  };

  // プロジェクトの全体進捗を計算
  const calculateProjectProgress = (): number => {
    const courseIds = ['git-migration', 'ci-cd', 'unit-test', 'e2e-test', 'monitoring'];
    const total = courseIds.reduce((sum, id) => sum + getProjectCourseProgress(id), 0);
    return Math.round(total / courseIds.length);
  };

  // コースをクリック
  const handleCourseClick = (categoryId: ModernizationCategory) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'git-migration') {
      navigate('/guide/git-migration');
    } else {
      // 他のコースは未実装のためホームへ（将来的には各ガイドページへ）
      navigate('/');
    }
  };

  // 保存ボタン
  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">プロジェクトが見つかりません</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ホームに戻る
          </Button>
        </div>
      </div>
    );
  }

  const overallProgress = calculateProjectProgress();
  const overallStatus = getStatusFromProgress(overallProgress);
  const overallStatusConfig = getStatusConfig(overallStatus);
  const OverallStatusIcon = overallStatusConfig.icon;

  const guide = QUICK_GUIDES[currentGuide];

  return (
    <div className="flex-1 flex min-h-screen bg-gray-50">
      {/* メインコンテンツ */}
      <div className={cn(
        'flex-1 flex flex-col transition-all duration-300',
        showGuide ? 'mr-80' : ''
      )}>
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-base font-medium">ホームに戻る</span>
              </button>
              
              {/* ヘルプボタン */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => showHelpGuide('gettingStarted')}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                ヘルプ
              </Button>
            </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg">
                <FolderKanban className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
                <div className="flex items-center gap-4 text-base text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{project.team}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{project.startDate} 〜 {project.endDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 進捗サマリー */}
            <div className="flex items-center gap-4">
              <div className={cn(
                'px-4 py-2 rounded-full flex items-center gap-2',
                overallStatusConfig.bgLight,
                overallStatusConfig.border,
                'border'
              )}>
                <OverallStatusIcon className={cn('w-5 h-5', overallStatusConfig.text)} />
                <span className={cn('font-bold', overallStatusConfig.text)}>
                  {overallStatusConfig.label}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">全体進捗</p>
                <p className="text-3xl font-bold text-teal-600">{overallProgress}%</p>
              </div>
            </div>
          </div>

          {/* 全体進捗バー */}
          <div className="mt-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', overallStatusConfig.color)}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">タスク一覧</h2>
            <p className="text-base text-gray-500">
              {categories.filter(c => getProjectCourseProgress(c.id) === 100).length} / {categories.length} 完了
            </p>
          </div>

          <div className="grid gap-4">
            {categories.map((category, index) => {
              const courseProgress = getProjectCourseProgress(category.id);
              const status = getStatusFromProgress(courseProgress);
              const statusConfig = getStatusConfig(status);
              const CategoryIcon = getCategoryIcon(category.icon);

              return (
                <Card
                  key={category.id}
                  className={cn(
                    'p-5 cursor-pointer transition-all hover:shadow-lg border-2',
                    statusConfig.border,
                    'hover:border-teal-400'
                  )}
                  onClick={() => handleCourseClick(category.id)}
                >
                  <div className="flex items-center gap-5">
                    {/* 番号 */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                      courseProgress === 100 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    )}>
                      {courseProgress === 100 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* アイコン */}
                    <div className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center',
                      statusConfig.bgLight
                    )}>
                      <CategoryIcon className={cn('w-7 h-7', statusConfig.text)} />
                    </div>

                    {/* コース情報 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-bold',
                          statusConfig.color, 'text-white'
                        )}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-base text-gray-600 mb-3">{category.description}</p>

                      {/* 進捗バー */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-300', statusConfig.color)}
                            style={{ width: `${courseProgress}%` }}
                          />
                        </div>
                        <span className={cn('text-sm font-bold min-w-[48px] text-right', statusConfig.text)}>
                          {courseProgress}%
                        </span>
                      </div>
                    </div>

                    {/* 矢印 */}
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

        {/* フッター（保存ボタン） */}
        <div className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-500">
              ※ 進捗は自動保存されています
            </p>
            <Button
              onClick={handleSave}
              className={cn(
                'gap-2 font-bold px-6 transition-all',
                showSaved 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-teal-500 hover:bg-teal-600'
              )}
            >
              {showSaved ? (
                <>
                  <Check className="w-5 h-5" />
                  保存しました
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  進捗を保存
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 右側ヘルプガイドパネル */}
      {showGuide && (
        <div className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-50">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-teal-600 text-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                <span className="font-bold">ヘルプガイド</span>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold">{guide.title}</h3>
            <p className="text-sm text-teal-100 mt-1">{guide.description}</p>
          </div>

          {/* コンテンツ */}
          <div className="p-5 space-y-6">
            {/* ステップ */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-teal-500" />
                ポイント
              </h4>
              <div className="space-y-3">
                {guide.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 rounded-lg">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ヒント */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="text-sm font-bold text-amber-800 mb-2">💡 ヒント</h4>
              <div className="space-y-2">
                {guide.tips.map((tip, index) => (
                  <p key={index} className="text-sm text-amber-700">{tip}</p>
                ))}
              </div>
            </div>

            {/* ガイド切り替えボタン */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">その他のガイド</p>
              <div className="space-y-2">
                {(Object.keys(QUICK_GUIDES) as GuideKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setCurrentGuide(key)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      currentGuide === key
                        ? 'bg-teal-100 text-teal-700 font-bold'
                        : 'hover:bg-gray-100 text-gray-600'
                    )}
                  >
                    {QUICK_GUIDES[key].title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

