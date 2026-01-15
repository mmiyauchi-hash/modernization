import { useStore } from '../store/useStore';
import { getCategoryIcon } from '../data/categories';
import { ModernizationCategory } from '../types';
import { CheckCircle2, ChevronRight } from 'lucide-react';
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
      
      {/* メニュー一覧 */}
      <div className="p-4">
        <p className="text-sm font-bold text-gray-500 px-3 mb-4 uppercase tracking-wider">
          コース一覧
        </p>
        
        <div className="space-y-2">
          {categories.map((category) => {
            const categoryProgress = getProgress(category.id);
            const Icon = getCategoryIcon(category.icon);
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  if (category.id === 'git-migration') {
                    navigate('/guide/git-migration');
                  } else {
                    navigate('/');
                  }
                }}
                className={cn(
                  'w-full text-left p-4 rounded-xl transition-all',
                  isSelected
                    ? 'bg-teal-50 border-2 border-teal-400'
                    : 'bg-white hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* アイコン */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
                    isSelected ? 'bg-teal-500' : 'bg-gray-100'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6',
                      isSelected ? 'text-white' : 'text-gray-600'
                    )} />
                  </div>
                  
                  {/* テキスト */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={cn(
                        'font-bold text-base',
                        isSelected ? 'text-teal-700' : 'text-gray-800'
                      )}>
                        {category.name}
                      </h3>
                      {categoryProgress.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className={cn(
                          'w-5 h-5 flex-shrink-0',
                          isSelected ? 'text-teal-500' : 'text-gray-400'
                        )} />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2 truncate">
                      {category.description}
                    </p>
                    
                    {/* 進捗バー */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isSelected ? 'bg-teal-500' : 'bg-gray-400'
                          )}
                          style={{ width: `${categoryProgress.progress}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-sm font-bold min-w-[40px] text-right',
                        isSelected ? 'text-teal-600' : 'text-gray-600'
                      )}>
                        {categoryProgress.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
