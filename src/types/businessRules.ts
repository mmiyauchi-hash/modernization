// 業務ルールの型定義

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  order: number; // 業務順序
  data: Record<string, any>; // 構造化されたデータ（AIが読み込みやすい形式）
  isCustomRule?: boolean; // 社内独自ルールフラグ
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };
}

export interface BusinessRuleCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  rules: BusinessRule[];
}

export interface BusinessRuleDirectory {
  id: string;
  name: string;
  description?: string;
  order: number;
  categories: BusinessRuleCategory[];
}

export interface BusinessRuleStructure {
  directories: BusinessRuleDirectory[];
}

