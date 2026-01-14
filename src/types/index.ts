// 型定義

export type ModernizationCategory = 
  | 'git-migration'
  | 'ci-cd'
  | 'unit-test'
  | 'e2e-test'
  | 'monitoring'
  | string; // カスタムカテゴリー用

export interface CategoryInfo {
  id: ModernizationCategory;
  name: string;
  description: string;
  icon: string;
}

export interface ProgressStatus {
  category: ModernizationCategory;
  progress: number; // 0-100
  level: 'Lv0' | 'Lv1' | 'Lv2';
  completed: boolean;
}

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  options?: string[]; // 選択肢がある場合
  isCustomRule?: boolean; // 社内独自ルールフラグ
  errorGuide?: {
    // エラーガイド情報
    title: string;
    steps: string[];
    examples?: string[];
    tips?: string[];
  };
  checkGuide?: {
    // 確認ポイントガイド情報
    title: string;
    checkPoints: string[];
    commands?: string[];
    visualGuide?: string[];
  };
};

export interface GitMigrationPhase {
  phase: 'preparation' | 'selection' | 'account-creation' | 'migration' | 'repository' | 'setup' | 'verification' | 'rules' | 'rollout';
  environmentType?: 'saas' | 'self-hosted';
  systemName?: string;
  adminId?: string;
  svnRepositoryUrl?: string;
  gitAccountCreated?: boolean;
}

export interface LocalRule {
  id: string;
  name: string;
  type: 'naming' | 'prohibition' | 'recommendation';
  pattern: string; // 正規表現パターン
  description: string;
  example?: string;
  isCustomRule?: boolean; // 社内独自ルールフラグ
}

export interface SystemProgress {
  systemId: string;
  systemName: string;
  progress: ProgressStatus[];
  lastUpdated: Date;
}

