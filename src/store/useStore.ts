// Zustand状態管理

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ModernizationCategory, ProgressStatus, ChatMessage, GitMigrationPhase, LocalRule, SystemProgress, CategoryInfo } from '../types';


// ヘルプガイドの型
interface HelpGuide {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
  image?: string;
}

interface AppState {
  // 現在選択中のカテゴリー
  selectedCategory: ModernizationCategory | null;
  
  // カテゴリー一覧（動的管理）
  categories: CategoryInfo[];
  
  // 進捗状況
  progress: ProgressStatus[];
  
  // チャットメッセージ
  chatMessages: ChatMessage[];
  
  // Git移行の状態
  gitMigrationPhase: GitMigrationPhase;
  
  // 現在のステップID（ChatAreaで使用）
  currentStepId: string | null;
  
  // ローカルルール
  localRules: LocalRule[];
  
  // 全システムの進捗（集計用）
  allSystemsProgress: SystemProgress[];
  
  // ヘルプガイド表示状態
  showHelpGuide: boolean;
  helpGuideContent: HelpGuide | null;
  
  // アクション
  setSelectedCategory: (category: ModernizationCategory | null) => void;
  setCategories: (categories: CategoryInfo[]) => void;
  addCategory: (category: CategoryInfo) => void;
  updateCategory: (id: string, updates: Partial<CategoryInfo>) => void;
  deleteCategory: (id: string) => void;
  updateProgress: (category: ModernizationCategory, progress: number, level?: 'Lv0' | 'Lv1' | 'Lv2') => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setGitMigrationPhase: (phase: Partial<GitMigrationPhase>) => void;
  setCurrentStepId: (stepId: string | null) => void;
  updateLocalRules: (rules: LocalRule[]) => void;
  addSystemProgress: (system: SystemProgress) => void;
  resetChat: () => void;
  clearSavedProgress: () => void;
  showHelp: (guide: HelpGuide) => void;
  hideHelp: () => void;
}

// Dateオブジェクトを文字列に変換するカスタムシリアライザー
const serializeChatMessage = (message: ChatMessage) => ({
  ...message,
  timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
});

const deserializeChatMessage = (message: any): ChatMessage => ({
  ...message,
  timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
});

// デフォルトカテゴリー
import { categories as defaultCategories } from '../data/categories';

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      selectedCategory: null,
      
      categories: defaultCategories,
      
      progress: [
        { category: 'git-migration', progress: 0, level: 'Lv0', completed: false },
        { category: 'ci-cd', progress: 0, level: 'Lv0', completed: false },
        { category: 'unit-test', progress: 0, level: 'Lv0', completed: false },
        { category: 'e2e-test', progress: 0, level: 'Lv0', completed: false },
        { category: 'monitoring', progress: 0, level: 'Lv0', completed: false },
      ],
      
      chatMessages: [],
      
      gitMigrationPhase: {
        phase: 'preparation',
      },
      
      currentStepId: null,
      
      localRules: [
        {
          id: 'naming-rule-1',
          name: 'リポジトリ命名規則',
          type: 'naming',
          pattern: '^prj-[a-z0-9]+-[a-z0-9-]+$',
          description: 'リポジトリ名は prj-[部署コード]-[システム名] の形式で命名してください',
          example: 'prj-dev01-my-system',
          isCustomRule: true, // 社内独自ルールとして設定
        },
        {
          id: 'prohibition-1',
          name: 'Cherry-pick禁止',
          type: 'prohibition',
          pattern: '',
          description: 'Cherry-pickは禁止されています。代わりにマージコミットを使用してください。',
          isCustomRule: false,
        },
      ],
      
      allSystemsProgress: [],
      
      showHelpGuide: false,
      helpGuideContent: null,
      
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      setCategories: (categories) => set({ categories }),
      
      addCategory: (category) => set((state) => ({ 
        categories: [...state.categories, category] 
      })),
      
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),
      
      updateProgress: (category, progress, level) => 
        set((state) => ({
          progress: state.progress.map((p) =>
            p.category === category
              ? { ...p, progress, level: level || p.level, completed: progress === 100 }
              : p
          ),
        })),
      
      addChatMessage: (message) =>
        set((state) => {
          // 最後のメッセージと同じ内容の場合は追加しない（重複防止）
          const lastMessage = state.chatMessages[state.chatMessages.length - 1];
          if (lastMessage && 
              lastMessage.role === message.role && 
              lastMessage.content === message.content) {
            return state; // 変更なし
          }
          
          return {
            chatMessages: [
              ...state.chatMessages,
              {
                ...message,
                id: `msg-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
              },
            ],
          };
        }),
      
      setGitMigrationPhase: (phase) =>
        set((state) => ({
          gitMigrationPhase: { ...state.gitMigrationPhase, ...phase },
        })),
      
      setCurrentStepId: (stepId) => set({ currentStepId: stepId }),
      
      updateLocalRules: (rules) => set({ localRules: rules }),
      
      addSystemProgress: (system) =>
        set((state) => ({
          allSystemsProgress: [...state.allSystemsProgress, system],
        })),
      
      resetChat: () => set((state) => ({ 
        chatMessages: [], 
        gitMigrationPhase: { ...state.gitMigrationPhase },
        currentStepId: null,
      })),
      
      clearSavedProgress: () => {
        localStorage.removeItem('devops-modernization-progress');
        set({
          selectedCategory: null,
          progress: [
            { category: 'git-migration', progress: 0, level: 'Lv0', completed: false },
            { category: 'ci-cd', progress: 0, level: 'Lv0', completed: false },
            { category: 'unit-test', progress: 0, level: 'Lv0', completed: false },
            { category: 'e2e-test', progress: 0, level: 'Lv0', completed: false },
            { category: 'monitoring', progress: 0, level: 'Lv0', completed: false },
          ],
          chatMessages: [],
          gitMigrationPhase: { phase: 'preparation' },
          currentStepId: null,
        });
      },
      
      showHelp: (guide) => set({ showHelpGuide: true, helpGuideContent: guide }),
      hideHelp: () => set({ showHelpGuide: false, helpGuideContent: null }),
    }),
    {
      name: 'devops-modernization-progress', // localStorageのキー名
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 保存する項目を指定（localRulesとallSystemsProgressは保存しない）
        selectedCategory: state.selectedCategory,
        categories: state.categories,
        progress: state.progress,
        chatMessages: state.chatMessages.map(serializeChatMessage),
        gitMigrationPhase: state.gitMigrationPhase,
        currentStepId: state.currentStepId,
      }),
      // 復元時の処理
      onRehydrateStorage: () => (state) => {
        if (state) {
          // ChatMessageのtimestampをDateオブジェクトに変換
          state.chatMessages = state.chatMessages.map(deserializeChatMessage);
        }
      },
    }
  )
);

