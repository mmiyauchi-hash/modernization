import { useStore } from '../store/useStore';
import { getCategoryIcon } from '../data/categories';
import { ModernizationCategory } from '../types';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const { selectedCategory, progress, setSelectedCategory, categories } = useStore();
  const navigate = useNavigate();

  const getProgress = (category: ModernizationCategory) => {
    return progress.find((p) => p.category === category) || {
      progress: 0,
      level: 'Lv0' as const,
      completed: false,
    };
  };

  const categoryColors: Record<string, string> = {
    'git-migration': 'from-blue-500 to-cyan-500',
    'ci-cd': 'from-purple-500 to-pink-500',
    'unit-test': 'from-green-500 to-emerald-500',
    'e2e-test': 'from-orange-500 to-red-500',
    'monitoring': 'from-indigo-500 to-blue-500',
  };
  
  const getCategoryColor = (categoryId: string): string => {
    return categoryColors[categoryId] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="w-80 h-screen overflow-y-auto glass-strong border-r border-white/20">
      <div className="p-8 glass border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-modern">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              DevOps
            </h2>
            <p className="text-xs text-gray-600 font-medium">
              モダナイゼーション
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        {categories.map((category) => {
          const categoryProgress = getProgress(category.id);
          const Icon = getCategoryIcon(category.icon);
          const isSelected = selectedCategory === category.id;
          const isGitMigration = category.id === 'git-migration';
          const colorClass = getCategoryColor(category.id);

          return (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                // Git切り替えガイドの場合は専用ページに遷移
                if (category.id === 'git-migration') {
                  navigate('/guide/git-migration');
                } else {
                  navigate('/');
                }
              }}
              className={cn(
                'w-full text-left p-4 rounded-xl transition-all duration-300 group',
                isSelected
                  ? `bg-gradient-to-br ${colorClass} text-white shadow-modern-lg scale-[1.02]`
                  : 'bg-white/80 hover:bg-white/90 border border-gray-200/50 hover:border-gray-300 hover:shadow-modern'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                  isSelected 
                    ? 'bg-white/20 backdrop-blur-sm' 
                    : `bg-gradient-to-br ${colorClass} shadow-md group-hover:scale-110`
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn('font-semibold text-sm', isSelected ? 'text-white' : 'text-gray-900')}>
                      {category.name}
                    </h3>
                    {categoryProgress.completed && (
                      <CheckCircle2 className={cn('w-4 h-4 flex-shrink-0', isSelected ? 'text-white' : 'text-emerald-500')} />
                    )}
                  </div>
                  <p className={cn('text-xs mb-2 leading-relaxed', isSelected ? 'text-white/80' : 'text-gray-600')}>
                    {category.description}
                  </p>
                  
                  {/* 進捗表示（Git切り替えガイドのみ詳細表示、他は簡易表示） */}
                  {isGitMigration ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn('font-medium', isSelected ? 'text-white/90' : 'text-gray-700')}>進捗</span>
                      </div>
                      <div className={cn('h-1.5 rounded-full overflow-hidden', isSelected ? 'bg-white/20' : 'bg-gray-200')}>
                        <div 
                          className={cn('h-full rounded-full transition-all duration-500', `bg-gradient-to-r ${colorClass}`)}
                          style={{ width: `${categoryProgress.progress}%` }}
                        />
                      </div>
                      <div className={cn('text-xs font-semibold', isSelected ? 'text-white' : 'text-gray-700')}>
                        {categoryProgress.progress}%
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium', isSelected ? 'text-white/80' : 'text-gray-600')}>
                        {categoryProgress.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

