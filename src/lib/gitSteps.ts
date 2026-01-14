// Git切り替え完了までのステップ定義

export interface GitStep {
  id: string;
  phase: 'preparation' | 'selection' | 'account-creation' | 'migration' | 'repository' | 'setup' | 'verification' | 'rules' | 'rollout';
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export const gitSteps: GitStep[] = [
  {
    id: 'preparation',
    phase: 'preparation',
    title: '移行前準備',
    description: 'Subversionリポジトリの確認とバックアップ',
    completed: false,
    current: false,
  },
  {
    id: 'selection',
    phase: 'selection',
    title: '環境方式の選択',
    description: 'SaaS版またはセルフホスト版を選択',
    completed: false,
    current: false,
  },
  {
    id: 'account-creation',
    phase: 'account-creation',
    title: 'Gitアカウント作成',
    description: 'GitHub/GitLabアカウントの作成と設定',
    completed: false,
    current: false,
  },
  {
    id: 'migration',
    phase: 'migration',
    title: 'Subversion移行実行',
    description: '移行ツールを使用してGitリポジトリへ移行',
    completed: false,
    current: false,
  },
  {
    id: 'repository',
    phase: 'repository',
    title: 'リポジトリ設定',
    description: 'システム名、管理者ID、リポジトリ名を設定',
    completed: false,
    current: false,
  },
  {
    id: 'setup',
    phase: 'setup',
    title: 'ローカル環境セットアップ',
    description: 'Gitインストール、認証設定、リポジトリクローン',
    completed: false,
    current: false,
  },
  {
    id: 'verification',
    phase: 'verification',
    title: '移行結果の検証',
    description: '履歴、ブランチ、タグの確認',
    completed: false,
    current: false,
  },
  {
    id: 'rules',
    phase: 'rules',
    title: '運用ルール確認',
    description: '運用ルールの説明とQ&A',
    completed: false,
    current: false,
  },
  {
    id: 'rollout',
    phase: 'rollout',
    title: 'チームへの展開',
    description: 'チームメンバーへの通知と移行実行',
    completed: false,
    current: false,
  },
];

export const getStepStatus = (
  currentPhase: string,
  progress: number
): GitStep[] => {
  const phaseOrder = ['preparation', 'selection', 'account-creation', 'migration', 'repository', 'setup', 'verification', 'rules', 'rollout'];
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
  
  return gitSteps.map((step, index) => {
    const stepPhaseIndex = phaseOrder.indexOf(step.phase);
    const isCompleted = stepPhaseIndex < currentPhaseIndex || 
                       (stepPhaseIndex === currentPhaseIndex && progress >= 100);
    const isCurrent = stepPhaseIndex === currentPhaseIndex && progress < 100;
    
    return {
      ...step,
      completed: isCompleted,
      current: isCurrent,
    };
  });
};

