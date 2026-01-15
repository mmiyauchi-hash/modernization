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

  useEffect(() => {
    if (location.state && (location.state as any).openAdmin) {
      setViewMode('admin');
    }
  }, [location.state]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* ヘッダー - Progate風 */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          DevOpsモダナイゼーション支援エージェント
        </h1>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setViewMode('dashboard')}
            className={cn(
              'gap-2 rounded-lg font-semibold text-base px-5 py-2.5 transition-all',
              viewMode === 'dashboard' 
                ? 'bg-teal-500 text-white hover:bg-teal-600' 
                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            <BarChart3 className="w-5 h-5" />
            進捗ダッシュボード
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewMode('admin')}
            className={cn(
              'gap-2 rounded-lg font-semibold text-base px-5 py-2.5 transition-all',
              viewMode === 'admin' 
                ? 'bg-teal-500 text-white hover:bg-teal-600' 
                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            <Settings className="w-5 h-5" />
            管理者画面
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      {viewMode === 'main' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center p-16 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-xl">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-teal-500 flex items-center justify-center shadow-md">
              <span className="text-5xl">👋</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              カテゴリーを選択してください
            </h3>
            <p className="text-xl text-gray-600 leading-relaxed">
              左側のメニューからモダナイゼーション項目を選択して<br />
              ガイドを始めましょう
            </p>
          </div>
        </div>
      )}

      {viewMode === 'admin' && <AdminPanel />}

      {viewMode === 'dashboard' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center p-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gray-200 flex items-center justify-center">
              <BarChart3 className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              進捗ダッシュボード
            </h3>
            <p className="text-xl text-gray-500">実装中です</p>
          </div>
        </div>
      )}
    </div>
  );
}
