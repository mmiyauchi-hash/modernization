import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { 
  Settings, 
  Plus, 
  Folder, 
  FolderPlus,
  FileText, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Upload,
  MessageSquare,
  X,
  Save,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { BusinessRuleDirectory, BusinessRuleCategory, BusinessRule } from '../types/businessRules';
import { gitMigrationScenario } from '../lib/gitScenario';
import { gitSteps } from '../lib/gitSteps';
import { useStore } from '../store/useStore';
import { CategoryInfo } from '../types';
import { getCategoryIcon } from '../data/categories';
import { cn } from '../lib/utils';

// Git移行シナリオから全ステップを構造化データに変換
const createInitialStructure = (): BusinessRuleDirectory[] => {
  const phaseOrder = ['preparation', 'selection', 'migration', 'repository', 'setup', 'verification', 'rules', 'rollout'];
  
  const categories: BusinessRuleCategory[] = phaseOrder.map((phase, phaseIndex) => {
    const stepInfo = gitSteps.find(s => s.phase === phase);
    const scenarioSteps = gitMigrationScenario[phase] || [];
    
    const rules: BusinessRule[] = scenarioSteps.map((step, stepIndex) => {
      // ステップのメッセージから構造化データを作成
      const data: Record<string, any> = {
        message: step.message,
        inputType: step.inputType || 'select',
      };
      
      if (step.options) {
        data.options = step.options;
      }
      
      if (step.validation) {
        data.hasValidation = true;
      }
      
      // メッセージからステップを抽出
      const lines = step.message.split('\n').filter(l => l.trim());
      const steps: string[] = [];
      lines.forEach(line => {
        if (line.trim() && !line.startsWith('**') && !line.startsWith('```')) {
          steps.push(line.trim());
        }
      });
      if (steps.length > 0) {
        data.steps = steps;
      }
      
      // リポジトリ名入力は社内独自ルールとして設定
      const isCustomRule = step.id === 'repository-name';
      
      return {
        id: step.id,
        name: step.id === 'welcome' ? '開始メッセージ' : 
              step.id === 'svn-repo-check' ? 'SubversionリポジトリURL確認' :
              step.id === 'svn-structure-check' ? 'リポジトリ構造確認' :
              step.id === 'backup-confirm' ? 'バックアップ確認' :
              step.id === 'environment-selection' ? '環境方式選択' :
              step.id === 'account-check' ? 'アカウント確認' :
              step.id === 'github-account-creation' ? 'GitHubアカウント作成' :
              step.id === 'gitlab-account-creation' ? 'GitLabアカウント作成' :
              step.id === 'account-verification' ? 'アカウント確認完了' :
              step.id === 'migration-tool-selection' ? '移行ツール選択' :
              step.id === 'migration-execution' ? '移行実行' :
              step.id === 'migration-check' ? '移行結果確認' :
              step.id === 'system-name' ? 'システム名入力' :
              step.id === 'admin-id' ? '管理者ID入力' :
              step.id === 'repository-name' ? 'リポジトリ名入力' :
              step.id === 'repository-creation' ? 'リポジトリ作成' :
              step.id === 'authentication-method' ? '認証方法選択' :
              step.id === 'ssh-key-generation' ? 'SSH鍵生成' :
              step.id === 'ssh-key-registration-github' ? 'GitHub SSH鍵登録' :
              step.id === 'ssh-key-registration-gitlab' ? 'GitLab SSH鍵登録' :
              step.id === 'https-token-setup' ? 'HTTPSトークン設定' :
              step.id === 'remote-setup' ? 'リモートリポジトリ設定' :
              step.id === 'git-install' ? 'Gitインストール確認' :
              step.id === 'auth-setup' ? '認証情報設定' :
              step.id === 'clone' ? 'リポジトリクローン' :
              step.id === 'history-verification' ? '履歴検証' :
              step.id === 'code-verification' ? 'コード整合性確認' :
              step.id === 'rules-info' ? '運用ルール説明' :
              step.id === 'team-notification' ? 'チーム通知' :
              step.id === 'svn-readonly' ? 'Subversion読み取り専用化' :
              step.id === 'migration-complete' ? '移行完了' :
              step.id,
        description: step.message.split('\n')[0] || '',
        order: stepIndex + 1,
        data,
        isCustomRule: isCustomRule,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0'
        }
      };
    });
    
    return {
      id: `cat-${phase}`,
      name: stepInfo?.title || phase,
      description: stepInfo?.description || '',
      order: phaseIndex + 1,
      rules
    };
  });
  
  return [
    {
      id: 'dir-git-migration',
      name: 'Git移行業務',
      description: 'SubversionからGitへの移行に関するワークフロー',
      order: 1,
      categories
    }
  ];
};

// localStorageから保存されたstructureを読み込む
const STRUCTURE_STORAGE_KEY = 'admin-workflow-structure';

const getInitialStructure = (): BusinessRuleDirectory[] => {
  try {
    const saved = localStorage.getItem(STRUCTURE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load structure from localStorage:', e);
  }
  return createInitialStructure();
};

type AdminViewMode = 'dashboard' | 'project-management' | 'task-management';

// コース定義
const courseDefinitions = [
  { id: 'git-migration', name: 'Git切り替え', icon: '🔄' },
  { id: 'ci-cd', name: 'CI/CD', icon: '🚀' },
  { id: 'unit-test', name: 'ユニットテスト', icon: '🧪' },
  { id: 'e2e-test', name: 'E2Eテスト', icon: '🎯' },
  { id: 'monitoring', name: '運用監視', icon: '📊' },
];

// ステータスを進捗率から判定
const getStatusFromProgress = (progress: number): 'completed' | 'in_progress' | 'started' | 'not_started' => {
  if (progress === 100) return 'completed';
  if (progress >= 30) return 'in_progress';
  if (progress > 0) return 'started';
  return 'not_started';
};

// ステータスに応じた色とラベルを返す
const getStatusConfig = (status: 'completed' | 'in_progress' | 'started' | 'not_started') => {
  switch (status) {
    case 'completed':
      return { color: 'bg-green-500', bgLight: 'bg-green-50', text: 'text-green-700', label: '完了', icon: CheckCircle2 };
    case 'in_progress':
      return { color: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-700', label: '進行中', icon: TrendingUp };
    case 'started':
      return { color: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-700', label: '着手', icon: Clock };
    case 'not_started':
      return { color: 'bg-gray-400', bgLight: 'bg-gray-50', text: 'text-gray-600', label: '未着手', icon: AlertCircle };
  }
};

export function AdminPanel() {
  const { categories, addCategory, updateCategory, deleteCategory, projects, progress, selectedProject, addProject, updateProject, deleteProject, addLocalRule, localRules } = useStore();
  
  // 実際のコース進捗を取得（progressストアから）
  const getActualCourseProgress = (categoryId: string): number => {
    const progressItem = progress.find(p => p.category === categoryId);
    return progressItem?.progress || 0;
  };

  // プロジェクトの進捗を計算（選択中のプロジェクトは実際の進捗を使用）
  const getProjectCourseProgress = (project: typeof projects[0], categoryId: string): number => {
    // 選択中のプロジェクトの場合は実際のガイド進捗を反映
    if (project.id === selectedProject) {
      return getActualCourseProgress(categoryId);
    }
    // それ以外はモックデータの進捗を使用
    return project.courses[categoryId as keyof typeof project.courses] || 0;
  };

  // プロジェクトの全体進捗を計算（実際の進捗を考慮）
  const calculateProjectProgress = (project: typeof projects[0]): number => {
    const courseIds = ['git-migration', 'ci-cd', 'unit-test', 'e2e-test', 'monitoring'] as const;
    const total = courseIds.reduce((sum, id) => sum + getProjectCourseProgress(project, id), 0);
    return Math.round(total / courseIds.length);
  };
  const [viewMode, setViewMode] = useState<AdminViewMode>('dashboard');
  const [structure, setStructure] = useState<BusinessRuleDirectory[]>(getInitialStructure);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['dir-git-migration']));
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => {
    const initial = getInitialStructure();
    return new Set(initial[0]?.categories.map(c => c.id) || []);
  });
  const [editingItem, setEditingItem] = useState<{
    type: 'directory' | 'category' | 'rule';
    id: string;
    parentId?: string;
  } | null>(null);
  const [markdownEditor, setMarkdownEditor] = useState<{ ruleId: string; content: string; naturalLanguage: string } | null>(null);
  
  // プロジェクト管理用state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectTeam, setEditingProjectTeam] = useState('');
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<string | null>(null);
  
  // タスク展開用state（クリックでワークフロー構造を表示）
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // メニュー管理用の状態
  const [menuCreationMode, setMenuCreationMode] = useState<'none' | 'markdown' | 'natural-language'>('none');
  
  // structureの変更をlocalStorageに保存し、isCustomRuleのルールをlocalRulesに同期
  useEffect(() => {
    // localStorageに保存
    try {
      localStorage.setItem(STRUCTURE_STORAGE_KEY, JSON.stringify(structure));
    } catch (e) {
      console.error('Failed to save structure to localStorage:', e);
    }
    
    // isCustomRule=trueのルールをlocalRulesに同期
    const customRules = structure.flatMap(dir => 
      dir.categories.flatMap(cat => 
        cat.rules.filter(rule => rule.isCustomRule).map(rule => ({
          id: rule.id,
          name: rule.name,
          type: 'naming' as const,
          pattern: '^.*$',
          description: rule.description,
          example: '',
          isCustomRule: true,
        }))
      )
    );
    
    // 既存のlocalRulesを更新（isCustomRuleのものを全て置換）
    if (customRules.length > 0) {
      const existingNonCustomRules = localRules.filter(r => !r.isCustomRule);
      const updatedRules = [...existingNonCustomRules, ...customRules];
      // 重複を除去
      const uniqueRules = updatedRules.filter((rule, index, self) => 
        self.findIndex(r => r.id === rule.id) === index
      );
      // localRulesと異なる場合のみ更新（無限ループ防止）
      const localRulesIds = localRules.map(r => r.id).sort().join(',');
      const uniqueRulesIds = uniqueRules.map(r => r.id).sort().join(',');
      if (localRulesIds !== uniqueRulesIds) {
        // updateLocalRulesは依存配列に入れない
      }
    }
  }, [structure]);
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [naturalLanguageChat, setNaturalLanguageChat] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  
  // ダッシュボード用の状態（展開中のプロジェクト）
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleDir = (dirId: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirId)) {
      newExpanded.delete(dirId);
    } else {
      newExpanded.add(dirId);
    }
    setExpandedDirs(newExpanded);
  };

  const toggleCat = (catId: string) => {
    const newExpanded = new Set(expandedCats);
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId);
    } else {
      newExpanded.add(catId);
    }
    setExpandedCats(newExpanded);
  };

  const addDirectory = () => {
    const newDir: BusinessRuleDirectory = {
      id: `dir-${Date.now()}`,
      name: '新しいディレクトリ',
      description: '',
      order: structure.length + 1,
      categories: []
    };
    setStructure([...structure, newDir]);
    setEditingItem({ type: 'directory', id: newDir.id });
    setExpandedDirs(new Set([...expandedDirs, newDir.id]));
  };

  const addCategoryToDirectory = (dirId: string) => {
    const dir = structure.find(d => d.id === dirId);
    if (!dir) return;

    const newCat: BusinessRuleCategory = {
      id: `cat-${Date.now()}`,
      name: '新しいカテゴリー',
      order: dir.categories.length + 1,
      rules: []
    };

    setStructure(structure.map(d => 
      d.id === dirId 
        ? { ...d, categories: [...d.categories, newCat] }
        : d
    ));
    setEditingItem({ type: 'category', id: newCat.id, parentId: dirId });
    setExpandedCats(new Set([...expandedCats, newCat.id]));
  };

  const addRule = (dirId: string, catId: string) => {
    const dir = structure.find(d => d.id === dirId);
    const cat = dir?.categories.find(c => c.id === catId);
    if (!cat) return;

    const newRule: BusinessRule = {
      id: `rule-${Date.now()}`,
      name: '新しいワークフロー',
      description: '',
      order: cat.rules.length + 1,
      data: {
        steps: [],
        validation: {}
      },
      isCustomRule: false, // デフォルトはfalse
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    setStructure(structure.map(d => 
      d.id === dirId 
        ? {
            ...d,
            categories: d.categories.map(c =>
              c.id === catId
                ? { ...c, rules: [...c.rules, newRule] }
                : c
            )
          }
        : d
    ));
    setEditingItem({ type: 'rule', id: newRule.id, parentId: catId });
  };

  const deleteItem = (type: 'directory' | 'category' | 'rule', id: string, parentId?: string) => {
    if (type === 'directory') {
      setStructure(structure.filter(d => d.id !== id));
    } else if (type === 'category' && parentId) {
      setStructure(structure.map(d =>
        d.id === parentId
          ? { ...d, categories: d.categories.filter(c => c.id !== id) }
          : d
      ));
    } else if (type === 'rule' && parentId) {
      setStructure(structure.map(d => ({
        ...d,
        categories: d.categories.map(c =>
          c.id === parentId
            ? { ...c, rules: c.rules.filter(r => r.id !== id) }
            : c
        )
      })));
    }
  };

  const updateItem = (type: 'directory' | 'category' | 'rule', id: string, updates: any, parentId?: string) => {
    if (type === 'directory') {
      setStructure(structure.map(d =>
        d.id === id ? { ...d, ...updates } : d
      ));
    } else if (type === 'category' && parentId) {
      setStructure(structure.map(d =>
        d.id === parentId
          ? {
              ...d,
              categories: d.categories.map(c =>
                c.id === id ? { ...c, ...updates } : c
              )
            }
          : d
      ));
    } else if (type === 'rule' && parentId) {
      setStructure(structure.map(d => ({
        ...d,
        categories: d.categories.map(c =>
          c.id === parentId
            ? {
                ...c,
                rules: c.rules.map(r =>
                  r.id === id ? { ...r, ...updates, metadata: { ...r.metadata, updatedAt: new Date().toISOString() } } : r
                )
              }
            : c
        )
      })));
    }
    setEditingItem(null);
  };

  const openMarkdownEditor = (rule: BusinessRule) => {
    // 既存のMarkdownデータがあれば自然言語として表示、なければ空文字
    let naturalLanguage = '';
    
    // 既存のdataから自然言語を生成
    if (rule.data && Object.keys(rule.data).length > 0) {
      // メッセージがあれば表示
      if (rule.data.message) {
        naturalLanguage += rule.data.message + '\n\n';
      }
      
      // ステップがあれば表示
      if (rule.data.steps && Array.isArray(rule.data.steps)) {
        naturalLanguage += 'ステップ:\n';
        rule.data.steps.forEach((step: string, index: number) => {
          naturalLanguage += `${index + 1}. ${step}\n`;
        });
        naturalLanguage += '\n';
      }
      
      // その他の情報があれば表示
      if (rule.data.options && Array.isArray(rule.data.options)) {
        naturalLanguage += '選択肢:\n';
        rule.data.options.forEach((opt: string) => {
          naturalLanguage += `- ${opt}\n`;
        });
        naturalLanguage += '\n';
      }
    }
    
    // 既存のMarkdownデータも保持（変換時に使用）
    const markdown = convertDataToMarkdown(rule.data);
    
    setMarkdownEditor({
      ruleId: rule.id,
      content: markdown,
      naturalLanguage: naturalLanguage.trim() || ''
    });
  };

  // 自然言語テキストをMarkdown形式に変換
  const convertNaturalLanguageToMarkdown = (naturalLanguage: string): string => {
    // 自然言語テキストをMarkdown形式に整形
    let markdown = naturalLanguage;
    
    // 基本的なMarkdown整形
    // ステップ番号をリスト形式に変換
    markdown = markdown.replace(/^(\d+)\.\s(.+)$/gm, '- $2');
    
    // 選択肢をリスト形式に変換
    markdown = markdown.replace(/^選択肢:\s*$/gm, '## 選択肢\n');
    markdown = markdown.replace(/^ステップ:\s*$/gm, '## ステップ\n');
    
    return markdown.trim();
  };

  const saveMarkdownEditor = (dirId: string, catId: string) => {
    if (!markdownEditor) return;

    // 確認ダイアログを表示
    const confirmed = window.confirm('自然言語の内容をMarkdown形式に変換して保存しますか？\n\n変換後、構造化データとして保存されます。');
    
    if (!confirmed) {
      return;
    }

    try {
      // 自然言語をMarkdown形式に変換
      const markdown = convertNaturalLanguageToMarkdown(markdownEditor.naturalLanguage);
      
      // Markdownから構造化データに変換
      const parsed = parseMarkdownToData(markdown);
      
      // 既存のデータ構造を保持しつつ、自然言語の内容を反映
      const rule = structure
        .find(d => d.id === dirId)
        ?.categories.find(c => c.id === catId)
        ?.rules.find(r => r.id === markdownEditor.ruleId);

      if (rule) {
        // 自然言語の内容をメッセージとして保存
        const updatedData = {
          ...rule.data,
          ...parsed,
          naturalLanguageContent: markdownEditor.naturalLanguage,
          markdownContent: markdown
        };
        
        updateItem('rule', markdownEditor.ruleId, { data: updatedData }, catId);
        setMarkdownEditor(null);
        
        alert('Markdown形式に変換して保存しました。');
      }
    } catch (e) {
      alert('変換中にエラーが発生しました: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  // 構造化データをMarkdown形式に変換
  const convertDataToMarkdown = (data: Record<string, any>): string => {
    let markdown = '';
    
    // ステップがある場合
    if (data.steps && Array.isArray(data.steps)) {
      markdown += '## ステップ\n\n';
      data.steps.forEach((step: string, index: number) => {
        markdown += `${index + 1}. ${step}\n`;
      });
      markdown += '\n';
    }

    // バリデーションがある場合
    if (data.validation) {
      markdown += '## バリデーション\n\n';
      if (data.validation.required) {
        markdown += `**必須項目**: ${data.validation.required.join(', ')}\n\n`;
      }
      if (data.validation.checks) {
        markdown += `**チェック項目**: ${data.validation.checks.join(', ')}\n\n`;
      }
    }

    // その他のデータをJSONコードブロックとして埋め込む
    const otherData = { ...data };
    delete otherData.steps;
    delete otherData.validation;
    
    if (Object.keys(otherData).length > 0) {
      markdown += '## その他のデータ\n\n';
      markdown += '```json\n';
      markdown += JSON.stringify(otherData, null, 2);
      markdown += '\n```\n';
    }

    return markdown.trim();
  };

  // Markdownから構造化データに変換
  const parseMarkdownToData = (markdown: string): Record<string, any> => {
    const data: Record<string, any> = {};
    const lines = markdown.split('\n');
    let currentSection = '';
    let jsonBlock = '';
    let inJsonBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // セクション見出し
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
        continue;
      }

      // JSONコードブロック
      if (line.startsWith('```json')) {
        inJsonBlock = true;
        jsonBlock = '';
        continue;
      }
      if (line.startsWith('```') && inJsonBlock) {
        inJsonBlock = false;
        try {
          const parsed = JSON.parse(jsonBlock);
          Object.assign(data, parsed);
        } catch (e) {
          // JSON解析エラーは無視
        }
        continue;
      }
      if (inJsonBlock) {
        jsonBlock += line + '\n';
        continue;
      }

      // ステップのリスト
      if (currentSection === 'ステップ' && /^\d+\.\s/.test(line)) {
        if (!data.steps) data.steps = [];
        const step = line.replace(/^\d+\.\s/, '').trim();
        data.steps.push(step);
        continue;
      }

      // バリデーション情報
      if (currentSection === 'バリデーション') {
        if (line.includes('**必須項目**:')) {
          const required = line.split('**必須項目**:')[1]?.trim();
          if (required) {
            data.validation = data.validation || {};
            data.validation.required = required.split(',').map((s: string) => s.trim());
          }
        }
        if (line.includes('**チェック項目**:')) {
          const checks = line.split('**チェック項目**:')[1]?.trim();
          if (checks) {
            data.validation = data.validation || {};
            data.validation.checks = checks.split(',').map((s: string) => s.trim());
          }
        }
      }
    }

    return data;
  };

  // 構造化データをMarkdown形式に変換
  const convertStructureToMarkdown = (): string => {
    let markdown = '# ワークフロー\n\n';
    markdown += 'このファイルはワークフローを構造化された形式で管理します。\n\n';
    markdown += '---\n\n';

    structure.forEach((dir) => {
      markdown += `## ${dir.name}\n\n`;
      if (dir.description) {
        markdown += `${dir.description}\n\n`;
      }

      dir.categories.forEach((cat) => {
        markdown += `### ${cat.name}\n\n`;

        cat.rules.forEach((rule) => {
          markdown += `#### ${rule.name}\n\n`;
          if (rule.description) {
            markdown += `${rule.description}\n\n`;
          }

          // 構造化データをMarkdown形式で記述
          const dataMarkdown = convertDataToMarkdown(rule.data);
          markdown += dataMarkdown;
          markdown += '\n\n';

          // メタデータ
          if (rule.metadata) {
            markdown += '**メタデータ**:\n';
            if (rule.metadata.createdAt) {
              markdown += `- 作成日: ${new Date(rule.metadata.createdAt).toLocaleString('ja-JP')}\n`;
            }
            if (rule.metadata.updatedAt) {
              markdown += `- 更新日: ${new Date(rule.metadata.updatedAt).toLocaleString('ja-JP')}\n`;
            }
            if (rule.metadata.version) {
              markdown += `- バージョン: ${rule.metadata.version}\n`;
            }
            markdown += '\n';
          }

          markdown += '---\n\n';
        });
      });
    });

    return markdown;
  };

  const handleSave = () => {
    // 構造化データをMarkdown形式で保存
    const markdown = convertStructureToMarkdown();
    console.log('保存するデータ:', markdown);
    
    // ダウンロード
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business-rules.md';
    a.click();
    URL.revokeObjectURL(url);
    alert('ワークフローが保存されました。Markdown形式でエクスポートされました。');
  };

  // マークダウンファイルのインポート処理
  const handleMarkdownImport = async (file: File) => {
    const text = await file.text();
    
    // マークダウンからカテゴリー情報を抽出（簡易版）
    const lines = text.split('\n');
    let name = '';
    let description = '';
    let icon = 'Workflow'; // デフォルト
    
    // タイトル（# で始まる行）を探す
    for (const line of lines) {
      if (line.startsWith('# ')) {
        name = line.replace('# ', '').trim();
      } else if (line.startsWith('## ')) {
        description = line.replace('## ', '').trim();
      }
    }
    
    if (!name) {
      alert('マークダウンファイルからカテゴリー名を抽出できませんでした。');
      return;
    }
    
    // 新しいカテゴリーIDを生成
    const newId = `custom-${Date.now()}`;
    const newCategory: CategoryInfo = {
      id: newId,
      name: name,
      description: description || 'カスタムガイド',
      icon: icon,
    };
    
    addCategory(newCategory);
    setMarkdownFile(null);
    setMenuCreationMode('none');
    alert('カテゴリーが作成されました。');
  };
  
  // 自然言語での対話型作成
  const handleNaturalLanguageSubmit = () => {
    if (!naturalLanguageInput.trim()) return;
    
    // ユーザーの入力をチャットに追加
    setNaturalLanguageChat([...naturalLanguageChat, { role: 'user', content: naturalLanguageInput }]);
    
    // 簡易的なAI応答（実際の実装ではLLM APIを呼び出す）
    const response = generateCategoryFromNaturalLanguage(naturalLanguageInput);
    setNaturalLanguageChat(prev => [...prev, { role: 'assistant', content: response.message }]);
    
    // カテゴリーが完成したら追加
    if (response.category) {
      addCategory(response.category);
      setNaturalLanguageInput('');
      setNaturalLanguageChat([]);
      setMenuCreationMode('none');
      alert('カテゴリーが作成されました。');
    } else {
      setNaturalLanguageInput('');
    }
  };
  
  // 自然言語からカテゴリーを生成（簡易版）
  const generateCategoryFromNaturalLanguage = (input: string): { message: string; category?: CategoryInfo } => {
    // 簡易的なパターンマッチング（実際の実装ではLLM APIを使用）
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('docker') || lowerInput.includes('コンテナ')) {
      const newId = `custom-${Date.now()}`;
      return {
        message: 'Docker/コンテナ関連のガイドを作成しますか？\n\nカテゴリー名: Docker導入ガイド\n説明: コンテナ化とDocker導入',
        category: {
          id: newId,
          name: 'Docker導入ガイド',
          description: 'コンテナ化とDocker導入',
          icon: 'Workflow',
        }
      };
    }
    
    if (lowerInput.includes('kubernetes') || lowerInput.includes('k8s')) {
      const newId = `custom-${Date.now()}`;
      return {
        message: 'Kubernetes関連のガイドを作成しますか？\n\nカテゴリー名: Kubernetes導入ガイド\n説明: K8sクラスター構築と運用',
        category: {
          id: newId,
          name: 'Kubernetes導入ガイド',
          description: 'K8sクラスター構築と運用',
          icon: 'Workflow',
        }
      };
    }
    
    // デフォルト応答
    return {
      message: `「${input}」について、どのようなガイドを作成したいですか？\n\n具体的に教えてください：\n- ガイドの目的\n- 対象となる技術やツール\n- 主な手順`,
    };
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                管理者画面
              </h2>
              <p className="text-base text-gray-600 mt-1">
                プロジェクトとタスクの管理
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setViewMode('dashboard')}
              variant={viewMode === 'dashboard' ? 'default' : 'outline'}
              className={cn(
                'gap-2 rounded-lg font-semibold text-base px-5 py-2.5',
                viewMode === 'dashboard' 
                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              <BarChart3 className="w-5 h-5" />
              進捗レポート
            </Button>
            <Button
              onClick={() => setViewMode('project-management')}
              variant={viewMode === 'project-management' ? 'default' : 'outline'}
              className={cn(
                'gap-2 rounded-lg font-semibold text-base px-5 py-2.5',
                viewMode === 'project-management' 
                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              <Folder className="w-5 h-5" />
              プロジェクト管理
            </Button>
            <Button
              onClick={() => setViewMode('task-management')}
              variant={viewMode === 'task-management' ? 'default' : 'outline'}
              className={cn(
                'gap-2 rounded-lg font-semibold text-base px-5 py-2.5',
                viewMode === 'task-management' 
                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              <FileText className="w-5 h-5" />
              タスク管理
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* ダッシュボードモード */}
          {viewMode === 'dashboard' && (
            <div className="space-y-6">
              {/* サマリーカード */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                      <p className="text-sm font-medium text-green-700">完了</p>
                      <p className="text-3xl font-bold text-green-800">
                        {projects.filter(p => getStatusFromProgress(calculateProjectProgress(p)) === 'completed').length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">進行中</p>
                      <p className="text-3xl font-bold text-blue-800">
                        {projects.filter(p => getStatusFromProgress(calculateProjectProgress(p)) === 'in_progress').length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">着手</p>
                      <p className="text-3xl font-bold text-amber-800">
                        {projects.filter(p => getStatusFromProgress(calculateProjectProgress(p)) === 'started').length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">未着手</p>
                      <p className="text-3xl font-bold text-gray-700">
                        {projects.filter(p => getStatusFromProgress(calculateProjectProgress(p)) === 'not_started').length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 全体進捗 */}
              <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">プロジェクト進捗サマリー</h3>
                      <p className="text-base text-gray-600">プロジェクトをクリックするとタスク別の進捗を確認できます</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">全体平均進捗</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {Math.round(projects.reduce((acc, p) => acc + calculateProjectProgress(p), 0) / projects.length)}%
                    </p>
                  </div>
                </div>

                {/* プロジェクト一覧（棒グラフ） */}
                <div className="space-y-3">
                  {projects.map((project) => {
                    const overallProgress = calculateProjectProgress(project);
                    const status = getStatusFromProgress(overallProgress);
                    const statusConfig = getStatusConfig(status);
                    const StatusIcon = statusConfig.icon;
                    const isExpanded = expandedProjects.has(project.id);
                    
                    return (
                      <div key={project.id} className="overflow-hidden rounded-xl border-2 border-gray-200 transition-all">
                        {/* メインの行（クリックで展開） */}
                        <div 
                          className={cn(
                            'p-4 cursor-pointer transition-all hover:bg-gray-50',
                            statusConfig.bgLight,
                            isExpanded && 'border-b-2 border-gray-200'
                          )}
                          onClick={() => toggleProject(project.id)}
                        >
                          <div className="flex items-center gap-4">
                            {/* 展開アイコン */}
                            <div className="w-8 flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-6 h-6 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-6 h-6 text-gray-500" />
                              )}
                            </div>
                            
                            {/* プロジェクト情報 */}
                            <div className="w-44 flex-shrink-0">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusIcon className={cn('w-4 h-4', statusConfig.text)} />
                                <span className={cn(
                                  'text-xs font-bold px-2 py-0.5 rounded-full',
                                  statusConfig.color, 'text-white'
                                )}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              <h4 className="font-bold text-gray-900 text-base">{project.name}</h4>
                              <p className="text-sm text-gray-500">{project.team}</p>
                            </div>
                            
                            {/* 棒グラフ */}
                            <div className="flex-1">
                              <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
                                <div 
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3',
                                    statusConfig.color
                                  )}
                                  style={{ width: `${Math.max(overallProgress, 5)}%` }}
                                >
                                  {overallProgress >= 20 && (
                                    <span className="text-white font-bold text-sm">{overallProgress}%</span>
                                  )}
                                </div>
                                {overallProgress < 20 && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-sm">
                                    {overallProgress}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* 期間 */}
                            <div className="w-40 text-right flex-shrink-0">
                              <p className="text-xs text-gray-500">期間</p>
                              <p className="text-sm text-gray-700 font-medium">
                                {project.startDate.slice(5)} 〜 {project.endDate.slice(5)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* 展開時：タスク別進捗 */}
                        {isExpanded && (
                          <div className="p-4 bg-white">
                            <div className="mb-3">
                              <h5 className="text-sm font-bold text-gray-600 mb-1">タスク別進捗状況</h5>
                              <p className="text-xs text-gray-500">各コースの進捗率から全体進捗が計算されます</p>
                            </div>
                            <div className="space-y-3">
                              {courseDefinitions.map((course) => {
                                const courseProgress = getProjectCourseProgress(project, course.id);
                                const courseStatus = getStatusFromProgress(courseProgress);
                                const courseStatusConfig = getStatusConfig(courseStatus);
                                
                                return (
                                  <div key={course.id} className="flex items-center gap-3">
                                    {/* コース名 */}
                                    <div className="w-36 flex-shrink-0 flex items-center gap-2">
                                      <span className="text-lg">{course.icon}</span>
                                      <span className="text-sm font-medium text-gray-700">{course.name}</span>
                                    </div>
                                    
                                    {/* 進捗バー */}
                                    <div className="flex-1">
                                      <div className="h-5 bg-gray-100 rounded-full overflow-hidden relative">
                                        <div 
                                          className={cn(
                                            'h-full rounded-full transition-all duration-300',
                                            courseStatusConfig.color
                                          )}
                                          style={{ width: `${Math.max(courseProgress, 2)}%` }}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* パーセント */}
                                    <div className="w-16 text-right flex-shrink-0">
                                      <span className={cn(
                                        'text-sm font-bold',
                                        courseProgress === 100 ? 'text-green-600' : 
                                        courseProgress > 0 ? 'text-blue-600' : 'text-gray-400'
                                      )}>
                                        {courseProgress}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* 計算式の説明 */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-600">
                                <span className="font-bold">全体進捗の計算:</span>{' '}
                                ({Object.values(project.courses).join(' + ')}) ÷ {Object.values(project.courses).length} = {overallProgress}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* フェーズ別進捗 */}
              <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">フェーズ別進捗状況</h3>
                    <p className="text-base text-gray-600">各移行フェーズの完了状況</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { phase: '準備フェーズ', completed: 6, total: 6, color: 'bg-green-500' },
                    { phase: '移行フェーズ', completed: 4, total: 6, color: 'bg-blue-500' },
                    { phase: '検証フェーズ', completed: 2, total: 6, color: 'bg-amber-500' },
                  ].map((item, index) => (
                    <div key={index} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800">{item.phase}</h4>
                        <span className="text-sm font-medium text-gray-600">
                          {item.completed}/{item.total} 完了
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full', item.color)}
                          style={{ width: `${(item.completed / item.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-right text-sm font-bold text-gray-700 mt-2">
                        {Math.round((item.completed / item.total) * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* プロジェクト管理モード */}
          {viewMode === 'project-management' && (
            <div className="space-y-6">
              <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                      <Folder className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">プロジェクト管理</h3>
                      <p className="text-base text-gray-600">プロジェクトの追加・削除・編集</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const newProject = {
                        id: `project-${Date.now()}`,
                        name: '新規プロジェクト',
                        team: '未設定',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: '',
                        courses: {
                          'git-migration': 0,
                          'ci-cd': 0,
                          'unit-test': 0,
                          'e2e-test': 0,
                          'monitoring': 0,
                        }
                      };
                      addProject(newProject);
                    }}
                    className="gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    プロジェクトを追加
                  </Button>
                </div>

                {/* プロジェクト一覧 */}
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">プロジェクトがありません</p>
                      <p className="text-sm">上のボタンからプロジェクトを追加してください</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {editingProjectId === project.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editingProjectName}
                                  onChange={(e) => setEditingProjectName(e.target.value)}
                                  placeholder="プロジェクト名"
                                  className="font-bold text-lg"
                                />
                                <Input
                                  value={editingProjectTeam}
                                  onChange={(e) => setEditingProjectTeam(e.target.value)}
                                  placeholder="担当チーム"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      updateProject(project.id, {
                                        name: editingProjectName,
                                        team: editingProjectTeam
                                      });
                                      setEditingProjectId(null);
                                    }}
                                    className="bg-teal-500 hover:bg-teal-600 text-white"
                                  >
                                    保存
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingProjectId(null)}
                                  >
                                    キャンセル
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-bold text-gray-900">{project.name}</h4>
                                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-700">
                                    {project.team}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>開始: {project.startDate || '未設定'}</span>
                                  <span>終了予定: {project.endDate || '未設定'}</span>
                                  <span className="font-medium text-teal-600">
                                    進捗: {calculateProjectProgress(project)}%
                                  </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {Object.entries(project.courses).map(([courseId, progress]) => {
                                    const courseDef = courseDefinitions.find(c => c.id === courseId);
                                    return (
                                      <span
                                        key={courseId}
                                        className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-600"
                                      >
                                        {courseDef?.name || courseId}: {progress}%
                                      </span>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                          {editingProjectId !== project.id && (
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingProjectId(project.id);
                                  setEditingProjectName(project.name);
                                  setEditingProjectTeam(project.team);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedProjectForTasks(project.id);
                                  setViewMode('task-management');
                                }}
                                className="text-teal-600 border-teal-200 hover:bg-teal-50"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                タスク管理
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm(`プロジェクト「${project.name}」を削除しますか？`)) {
                                    deleteProject(project.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* 説明カード */}
              <Card className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">💡</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">プロジェクト管理について</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      ここで追加したプロジェクトは通常画面のサイドバーにも反映されます。
                      各プロジェクトの「タスク管理」ボタンから、そのプロジェクトに含まれるタスクと業務フローを管理できます。
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* タスク管理モード */}
          {viewMode === 'task-management' && (
            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">タスク管理</h3>
                    <p className="text-base text-gray-600">
                      {selectedProjectForTasks 
                        ? `${projects.find(p => p.id === selectedProjectForTasks)?.name || 'プロジェクト'}のタスクを管理`
                        : '各プロジェクトのタスクと業務フローを管理'}
                    </p>
                  </div>
                </div>
                {selectedProjectForTasks && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProjectForTasks(null)}
                    className="gap-2"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    全タスク表示
                  </Button>
                )}
              </div>

              {/* 新規作成ボタン */}
              {menuCreationMode === 'none' && (
                <div className="mb-6 flex gap-3">
                  <Button
                    onClick={() => setMenuCreationMode('markdown')}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-sm transition-all h-12"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    マークダウンファイルから作成
                  </Button>
                  <Button
                    onClick={() => setMenuCreationMode('natural-language')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-sm transition-all h-12"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    自然言語で対話しながら作成
                  </Button>
                </div>
              )}

              {/* マークダウンインポート */}
              {menuCreationMode === 'markdown' && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">マークダウンファイルからインポート</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMenuCreationMode('none');
                        setMarkdownFile(null);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    ガイドの内容が記載されたMarkdownファイルをアップロードしてください。
                  </p>
                  <input
                    type="file"
                    accept=".md,.markdown"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setMarkdownFile(file);
                        handleMarkdownImport(file);
                      }
                    }}
                    className="hidden"
                    id="markdown-upload"
                  />
                  <label
                    htmlFor="markdown-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">ファイルを選択</span>
                  </label>
                  {markdownFile && (
                    <p className="text-xs text-gray-500 mt-2">選択中: {markdownFile.name}</p>
                  )}
                </div>
              )}

              {/* 自然言語での対話型作成 */}
              {menuCreationMode === 'natural-language' && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border border-blue-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">自然言語で対話しながら作成</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMenuCreationMode('none');
                        setNaturalLanguageInput('');
                        setNaturalLanguageChat([]);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* チャット履歴 */}
                  {naturalLanguageChat.length > 0 && (
                    <div className="mb-3 space-y-2 max-h-64 overflow-y-auto">
                      {naturalLanguageChat.map((msg, index) => (
                        <div
                          key={index}
                          className={cn(
                            'p-3 rounded-lg text-sm',
                            msg.role === 'user'
                              ? 'bg-blue-100 text-blue-900 ml-4'
                              : 'bg-white text-gray-900 mr-4'
                          )}
                        >
                          <div className="font-semibold mb-1 text-xs">
                            {msg.role === 'user' ? 'あなた' : 'AI'}
                          </div>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 入力エリア */}
                  <div className="flex gap-2">
                    <Input
                      value={naturalLanguageInput}
                      onChange={(e) => setNaturalLanguageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageSubmit()}
                      placeholder="例: Dockerコンテナの導入ガイドを作りたい"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleNaturalLanguageSubmit}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* タスク一覧 */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 mb-3">タスク一覧</h4>
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.icon);
                  const isEditing = editingCategory?.id === category.id;
                  const isExpanded = expandedTaskId === category.id;
                  
                  // このタスクに関連するワークフロー構造を取得
                  const taskWorkflowDir = structure.find(dir => 
                    dir.id === `dir-${category.id}` || dir.name.toLowerCase().includes(category.id.replace('-', ' '))
                  ) || structure[0]; // デフォルトはGit移行
                  
                  return (
                    <div
                      key={category.id}
                      className="rounded-xl border border-gray-200/50 bg-white/80 overflow-hidden transition-all"
                    >
                      {/* タスクヘッダー（クリックで展開） */}
                      <div
                        className={cn(
                          'p-4 cursor-pointer hover:bg-white/90 transition-all',
                          isExpanded && 'bg-teal-50/50 border-b border-gray-200/50'
                        )}
                        onClick={() => {
                          if (!isEditing) {
                            setExpandedTaskId(isExpanded ? null : category.id);
                          }
                        }}
                      >
                        {isEditing ? (
                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              placeholder="タスク名"
                              className="mb-2"
                            />
                            <Input
                              value={editingCategory.description}
                              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                              placeholder="説明"
                              className="mb-2"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (editingCategory) {
                                    updateCategory(category.id, {
                                      name: editingCategory.name,
                                      description: editingCategory.description,
                                      icon: editingCategory.icon,
                                    });
                                    setEditingCategory(null);
                                  }
                                }}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                              >
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCategory(null)}
                              >
                                キャンセル
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                                isExpanded 
                                  ? 'bg-teal-500' 
                                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                              )}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{category.name}</h5>
                                <p className="text-xs text-gray-600">{category.description}</p>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-teal-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingCategory(category)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm('このタスクを削除しますか？')) {
                                    deleteCategory(category.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* ワークフロー構造（展開時に表示） */}
                      {isExpanded && taskWorkflowDir && (
                        <div className="p-4 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <Folder className="w-4 h-4 text-teal-600" />
                              ワークフロー構造
                            </h5>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addCategoryToDirectory(taskWorkflowDir.id)}
                                className="text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                カテゴリー追加
                              </Button>
                            </div>
                          </div>
                          
                          {/* ワークフローカテゴリー */}
                          <div className="space-y-2">
                            {taskWorkflowDir.categories.map((cat) => (
                              <div key={cat.id} className="border border-gray-200/50 rounded-lg overflow-hidden bg-white">
                                <div className="p-3 pl-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <button
                                        onClick={() => toggleCat(cat.id)}
                                        className="p-1 hover:bg-gray-200/50 rounded transition-all"
                                      >
                                        {expandedCats.has(cat.id) ? (
                                          <ChevronDown className="w-4 h-4 text-gray-600" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-gray-600" />
                                        )}
                                      </button>
                                      <FileText className="w-4 h-4 text-purple-500" />
                                      <span className="font-medium text-gray-800">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => addRule(taskWorkflowDir.id, cat.id)}
                                        className="text-xs"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        ワークフロー
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          // このカテゴリ内のisCustomRule=trueのルールをlocalRulesに保存
                                          const customRulesInCat = cat.rules.filter(r => r.isCustomRule);
                                          if (customRulesInCat.length > 0) {
                                            customRulesInCat.forEach(rule => {
                                              addLocalRule({
                                                id: rule.id,
                                                name: rule.name,
                                                type: 'naming',
                                                pattern: '^.*$',
                                                description: rule.description,
                                                example: '',
                                                isCustomRule: true,
                                              });
                                            });
                                            alert(`「${cat.name}」の社内独自ルール（${customRulesInCat.length}件）を保存しました。`);
                                          } else {
                                            // structureをlocalStorageに保存（すでにuseEffectで自動保存されている）
                                            localStorage.setItem(STRUCTURE_STORAGE_KEY, JSON.stringify(structure));
                                            alert(`「${cat.name}」を保存しました。`);
                                          }
                                        }}
                                        className="bg-teal-500 hover:bg-teal-600 text-white text-xs"
                                      >
                                        <Save className="w-3 h-3 mr-1" />
                                        保存
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteItem('category', cat.id, taskWorkflowDir.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* ワークフロー詳細 */}
                                {expandedCats.has(cat.id) && (
                                  <div className="bg-gray-50/50 pl-8">
                                    {cat.rules.map((rule) => (
                                      <div key={rule.id} className="p-3 border-b border-gray-200/30 last:border-b-0">
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="font-semibold text-gray-900 text-sm">{rule.name}</h4>
                                              {rule.isCustomRule && (
                                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-sm">
                                                  社内独自ルール
                                                </span>
                                              )}
                                            </div>
                                            {rule.description && (
                                              <p className="text-xs text-gray-600 mb-2">{rule.description}</p>
                                            )}
                                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                              <input
                                                type="checkbox"
                                                checked={rule.isCustomRule || false}
                                                onChange={(e) => {
                                                  updateItem('rule', rule.id, { isCustomRule: e.target.checked }, cat.id);
                                                }}
                                                className="w-3 h-3 rounded border-gray-300 text-indigo-600"
                                              />
                                              <span className="text-gray-700">社内独自ルール</span>
                                            </label>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                // 社内独自ルールとして保存
                                                if (rule.isCustomRule) {
                                                  const localRule = {
                                                    id: rule.id,
                                                    name: rule.name,
                                                    type: 'naming' as const,
                                                    pattern: '^.*$',
                                                    description: rule.description,
                                                    example: '',
                                                    isCustomRule: true,
                                                  };
                                                  addLocalRule(localRule);
                                                  alert(`「${rule.name}」を社内独自ルールとして保存しました。`);
                                                } else {
                                                  alert('保存しました。');
                                                }
                                              }}
                                              className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-2 py-1"
                                            >
                                              <Save className="w-3 h-3 mr-1" />
                                              保存
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => openMarkdownEditor(rule)}
                                              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-2 py-1"
                                            >
                                              MD編集
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => deleteItem('rule', rule.id, cat.id)}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        {/* MDエディタ */}
                                        {markdownEditor && markdownEditor.ruleId === rule.id && (
                                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200/50">
                                            <div className="flex items-center justify-between mb-2">
                                              <h5 className="text-xs font-bold text-gray-900">自然言語で編集</h5>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setMarkdownEditor(null)}
                                                className="h-5 w-5 p-0"
                                              >
                                                ×
                                              </Button>
                                            </div>
                                            <textarea
                                              value={markdownEditor.naturalLanguage}
                                              onChange={(e) => setMarkdownEditor({ ...markdownEditor, naturalLanguage: e.target.value })}
                                              className="w-full h-32 text-xs p-2 rounded border border-gray-200 bg-white resize-y"
                                              placeholder="自然言語で自由に記述してください。"
                                            />
                                            <div className="mt-2 flex justify-end gap-2">
                                              <Button size="sm" variant="outline" onClick={() => setMarkdownEditor(null)}>
                                                キャンセル
                                              </Button>
                                              <Button
                                                size="sm"
                                                onClick={() => saveMarkdownEditor(taskWorkflowDir.id, cat.id)}
                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                                              >
                                                確定
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

