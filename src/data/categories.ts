// カテゴリー情報

import { CategoryInfo } from '../types';
import { GitBranch, Workflow, TestTube, Monitor, Activity } from 'lucide-react';

export const categories: CategoryInfo[] = [
  {
    id: 'git-migration',
    name: 'Git切り替えガイド',
    description: 'Subversion → Git',
    icon: 'GitBranch',
  },
  {
    id: 'ci-cd',
    name: 'ビルド/デプロイ (CI/CD)',
    description: 'CI/CDパイプライン構築',
    icon: 'Workflow',
  },
  {
    id: 'unit-test',
    name: 'ユニットテスト',
    description: '単体テスト導入',
    icon: 'TestTube',
  },
  {
    id: 'e2e-test',
    name: 'E2Eテスト',
    description: 'エンドツーエンドテスト',
    icon: 'Monitor',
  },
  {
    id: 'monitoring',
    name: '運用監視',
    description: '監視・ログ管理',
    icon: 'Activity',
  },
];

export const getCategoryIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    GitBranch,
    Workflow,
    TestTube,
    Monitor,
    Activity,
  };
  return iconMap[iconName] || GitBranch;
};

