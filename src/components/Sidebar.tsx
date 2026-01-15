import { useState } from 'react';
import { useStore, ProjectInfo } from '../store/useStore';
import { CheckCircle2, ChevronRight, Building2, FolderKanban, Save, Check, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

// ステータスを進捗率から判定
const getStatusFromProgress = (progress: number): 'completed' | 'in_progress' | 'started' | 'not_started' => {
  if (progress === 100) return 'completed';
  if (progress >= 30) return 'in_progress';
  if (progress > 0) return 'started';
  return 'not_started';
};

// ステータスに応じた色を返す
const getStatusColor = (status: 'completed' | 'in_progress' | 'started' | 'not_started') => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    case 'started': return 'bg-amber-500';
    case 'not_started': return 'bg-gray-400';
  }
};

// ステータスに応じたアイコンを返す
const getStatusIcon = (status: 'completed' | 'in_progress' | 'started' | 'not_started') => {
  switch (status) {
    case 'completed': return CheckCircle2;
    case 'in_progress': return TrendingUp;
    case 'started': return Clock;
    case 'not_started': return AlertCircle;
  }
};

export function Sidebar() {
  const { selectedProject, projects, progress } = useStore();
  const navigate = useNavigate();
  const [showSaved, setShowSaved] = useState(false);

  // 実際のコース進捗を取得（progressストアから）
  const getActualCourseProgress = (categoryId: string): number => {
    const progressItem = progress.find(p => p.category === categoryId);
    return progressItem?.progress || 0;
  };

  // プロジェクトの進捗を計算（選択中のプロジェクトは実際の進捗を使用）
  const getProjectCourseProgress = (project: ProjectInfo, categoryId: string): number => {
    // 選択中のプロジェクトの場合は実際のガイド進捗を反映
    if (project.id === selectedProject) {
      return getActualCourseProgress(categoryId);
    }
    // それ以外はモックデータの進捗を使用
    return project.courses[categoryId as keyof typeof project.courses] || 0;
  };

  // プロジェクトの全体進捗を計算
  const calculateProjectProgress = (project: ProjectInfo): number => {
    const courseIds = ['git-migration', 'ci-cd', 'unit-test', 'e2e-test', 'monitoring'];
    const total = courseIds.reduce((sum, id) => sum + getProjectCourseProgress(project, id), 0);
    return Math.round(total / courseIds.length);
  };

  // プロジェクトをクリック → 詳細ページへ遷移
  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  // 保存ボタン（実際には自動保存だが、視覚的フィードバックを提供）
  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="w-80 h-screen overflow-y-auto bg-white border-r border-gray-200 flex flex-col">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              DevOps
            </h2>
            <p className="text-base text-gray-600">
              モダナイゼーション
            </p>
          </div>
        </div>
      </div>
      
      {/* プロジェクト一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm font-bold text-gray-500 px-3 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          プロジェクト一覧
        </p>
        
        <div className="space-y-2">
          {projects.map((project) => {
            const overallProgress = calculateProjectProgress(project);
            const status = getStatusFromProgress(overallProgress);
            const statusColor = getStatusColor(status);
            const StatusIcon = getStatusIcon(status);
            const isSelected = selectedProject === project.id;

            return (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl transition-all border-2',
                  isSelected
                    ? 'bg-teal-50 border-teal-400 shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* プロジェクトアイコン */}
                  <div className={cn(
                    'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-teal-500' : 'bg-gray-100'
                  )}>
                    <FolderKanban className={cn(
                      'w-5 h-5',
                      isSelected ? 'text-white' : 'text-gray-600'
                    )} />
                  </div>
                  
                  {/* プロジェクト情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={cn(
                        'font-bold text-sm truncate',
                        isSelected ? 'text-teal-700' : 'text-gray-800'
                      )}>
                        {project.name}
                      </h3>
                      <StatusIcon className={cn(
                        'w-4 h-4 flex-shrink-0 ml-2',
                        status === 'completed' ? 'text-green-500' :
                        status === 'in_progress' ? 'text-blue-500' :
                        status === 'started' ? 'text-amber-500' : 'text-gray-400'
                      )} />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{project.team}</p>
                    
                    {/* 進捗バー */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full transition-all', statusColor)}
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-xs font-bold min-w-[32px] text-right',
                        isSelected ? 'text-teal-600' : 'text-gray-600'
                      )}>
                        {overallProgress}%
                      </span>
                    </div>
                  </div>

                  {/* 矢印 */}
                  <ChevronRight className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isSelected ? 'text-teal-500' : 'text-gray-400'
                  )} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button
          onClick={handleSave}
          className={cn(
            'w-full gap-2 font-bold transition-all',
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
        <p className="text-xs text-gray-500 text-center mt-2">
          ※ 進捗は自動保存されています
        </p>
      </div>
    </div>
  );
}
