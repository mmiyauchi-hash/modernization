import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Settings, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { AdminPanel } from '../components/AdminPanel';
import { useLocation } from 'react-router-dom';

type ViewMode = 'main' | 'admin' | 'dashboard';

export default function HomePage() {
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('main');

  // ナビゲーションstateから管理者画面を開く
  useEffect(() => {
    if (location.state && (location.state as any).openAdmin) {
      setViewMode('admin');
    }
  }, [location.state]);

  return (
    <div className="flex-1 flex flex-col">
      {/* ヘッダー */}
      <div className="border-b glass-strong border-white/20 px-8 py-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          DevOpsモダナイゼーション支援エージェント
        </h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('dashboard')}
            className={cn(
              'gap-2 rounded-lg font-medium transition-all',
              viewMode === 'dashboard' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-modern hover:shadow-modern-lg' 
                : 'text-gray-700 hover:bg-gray-100/50'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            進捗ダッシュボード
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('admin')}
            className={cn(
              'gap-2 rounded-lg font-medium transition-all',
              viewMode === 'admin' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-modern hover:shadow-modern-lg' 
                : 'text-gray-700 hover:bg-gray-100/50'
            )}
          >
            <Settings className="w-4 h-4" />
            管理者画面
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      {viewMode === 'main' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center p-12 glass-strong rounded-2xl shadow-modern-lg max-w-lg border border-white/20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-modern">
              <span className="text-4xl">👋</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              カテゴリーを選択してください
            </h3>
            <p className="text-gray-600 leading-relaxed">
              左側のメニューからモダナイゼーション項目を選択して<br />
              ガイドを始めましょう
            </p>
          </div>
        </div>
      )}
      {viewMode === 'admin' && <AdminPanel />}
      {viewMode === 'dashboard' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-gray-600">進捗ダッシュボード（実装中）</p>
          </div>
        </div>
      )}
    </div>
  );
}

