import { useState } from 'react';
import { useStore, ProjectInfo } from '../store/useStore';
import { getCategoryIcon } from '../data/categories';
import { ModernizationCategory } from '../types';
import { CheckCircle2, ChevronRight, ChevronDown, Building2, FolderKanban } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// プロジェクトの全体進捗を計算
const calculateOverallProgress = (courses: ProjectInfo['courses']): number => {
  const values = Object.values(courses);
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
};

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

export function Sidebar() {
  const { selectedCategory, selectedProject, projects, setSelectedCategory, setSelectedProject, categories } = useStore();
  const navigate = useNavigate();
  const [expandedProject, setExpandedProject] = useState<string | null>(selectedProject);

  // プロジェクトを選択してコース一覧を展開
  const handleProjectClick = (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      setSelectedProject(projectId);
    }
  };

  // コースを選択
  const handleCourseClick = (projectId: string, categoryId: ModernizationCategory) => {
    setSelectedProject(projectId);
    setSelectedCategory(categoryId);
    if (categoryId === 'git-migration') {
      navigate('/guide/git-migration');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-80 h-screen overflow-y-auto bg-white border-r border-gray-200">
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
      <div className="p-4">
        <p className="text-sm font-bold text-gray-500 px-3 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          プロジェクト一覧
        </p>
        
        <div className="space-y-2">
          {projects.map((project) => {
            const overallProgress = calculateOverallProgress(project.courses);
            const status = getStatusFromProgress(overallProgress);
            const statusColor = getStatusColor(status);
            const isExpanded = expandedProject === project.id;
            const isSelected = selectedProject === project.id;

            return (
              <div key={project.id} className="overflow-hidden rounded-xl border-2 border-gray-100">
                {/* プロジェクト行 */}
                <button
                  onClick={() => handleProjectClick(project.id)}
                  className={cn(
                    'w-full text-left p-3 transition-all',
                    isSelected
                      ? 'bg-teal-50 border-teal-400'
                      : 'bg-white hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* 展開アイコン */}
                    <div className="w-6 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {/* プロジェクトアイコン */}
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
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
                        {overallProgress === 100 && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{project.team}</p>
                      
                      {/* 進捗バー */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={cn('h-full rounded-full transition-all', statusColor)}
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-xs font-bold',
                          isSelected ? 'text-teal-600' : 'text-gray-600'
                        )}>
                          {overallProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
                
                {/* 展開時：コース一覧 */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    {categories.map((category) => {
                      const courseProgress = project.courses[category.id as keyof typeof project.courses] || 0;
                      const Icon = getCategoryIcon(category.icon);
                      const isCourseSelected = selectedProject === project.id && selectedCategory === category.id;

                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCourseClick(project.id, category.id)}
                          className={cn(
                            'w-full text-left p-3 pl-12 transition-all border-b border-gray-100 last:border-b-0',
                            isCourseSelected
                              ? 'bg-teal-100'
                              : 'hover:bg-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {/* コースアイコン */}
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                              isCourseSelected ? 'bg-teal-500' : 'bg-white border border-gray-200'
                            )}>
                              <Icon className={cn(
                                'w-4 h-4',
                                isCourseSelected ? 'text-white' : 'text-gray-500'
                              )} />
                            </div>
                            
                            {/* コース情報 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  'text-sm font-medium truncate',
                                  isCourseSelected ? 'text-teal-700' : 'text-gray-700'
                                )}>
                                  {category.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  {courseProgress === 100 && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  )}
                                  <span className={cn(
                                    'text-xs font-bold',
                                    courseProgress === 100 ? 'text-green-600' :
                                    courseProgress > 0 ? 'text-blue-600' : 'text-gray-400'
                                  )}>
                                    {courseProgress}%
                                  </span>
                                </div>
                              </div>
                              
                              {/* 進捗バー */}
                              <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    courseProgress === 100 ? 'bg-green-500' :
                                    courseProgress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                                  )}
                                  style={{ width: `${courseProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
