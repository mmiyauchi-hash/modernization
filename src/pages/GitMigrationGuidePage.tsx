import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { GitGuideLayout } from '../components/GitGuideLayout';

export default function GitMigrationGuidePage() {
  const { setSelectedCategory } = useStore();

  useEffect(() => {
    // ページ読み込み時にGit切り替えガイドを選択状態にする
    setSelectedCategory('git-migration');
  }, [setSelectedCategory]);

  return <GitGuideLayout />;
}

