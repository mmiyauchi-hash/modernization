import { useState } from 'react';
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
  Menu,
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
      description: 'SubversionからGitへの移行に関する業務ルール',
      order: 1,
      categories
    }
  ];
};

const initialStructure = createInitialStructure();

type AdminViewMode = 'business-rules' | 'menu-management' | 'dashboard';

// プロジェクト進捗モックデータ
const mockProjects = [
  { 
    id: 'proj-1',
    name: '基幹システムA', 
    progress: 100, 
    status: 'completed' as const,
    team: '情報システム部',
    startDate: '2025-10-01',
    endDate: '2025-12-15'
  },
  { 
    id: 'proj-2',
    name: '顧客管理システム', 
    progress: 75, 
    status: 'in_progress' as const,
    team: '営業支援部',
    startDate: '2025-11-01',
    endDate: '2026-02-28'
  },
  { 
    id: 'proj-3',
    name: '社内ポータル', 
    progress: 45, 
    status: 'in_progress' as const,
    team: '総務部',
    startDate: '2025-12-01',
    endDate: '2026-03-31'
  },
  { 
    id: 'proj-4',
    name: '在庫管理システム', 
    progress: 30, 
    status: 'in_progress' as const,
    team: '物流部',
    startDate: '2026-01-05',
    endDate: '2026-04-30'
  },
  { 
    id: 'proj-5',
    name: '経費精算システム', 
    progress: 10, 
    status: 'started' as const,
    team: '経理部',
    startDate: '2026-01-10',
    endDate: '2026-05-31'
  },
  { 
    id: 'proj-6',
    name: '人事評価システム', 
    progress: 0, 
    status: 'not_started' as const,
    team: '人事部',
    startDate: '2026-02-01',
    endDate: '2026-06-30'
  },
];

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
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [viewMode, setViewMode] = useState<AdminViewMode>('dashboard');
  const [structure, setStructure] = useState<BusinessRuleDirectory[]>(initialStructure);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['dir-git-migration']));
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(initialStructure[0]?.categories.map(c => c.id) || []));
  const [editingItem, setEditingItem] = useState<{
    type: 'directory' | 'category' | 'rule';
    id: string;
    parentId?: string;
  } | null>(null);
  const [markdownEditor, setMarkdownEditor] = useState<{ ruleId: string; content: string; naturalLanguage: string } | null>(null);
  
  // メニュー管理用の状態
  const [menuCreationMode, setMenuCreationMode] = useState<'none' | 'markdown' | 'natural-language'>('none');
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [naturalLanguageChat, setNaturalLanguageChat] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);

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
      name: '新しい業務ルール',
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
    let markdown = '# 業務ルール\n\n';
    markdown += 'このファイルは業務ルールを構造化された形式で管理します。\n\n';
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
    alert('業務ルールが保存されました。Markdown形式でエクスポートされました。');
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
                業務ルールとメニューの管理
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
              onClick={() => setViewMode('business-rules')}
              variant={viewMode === 'business-rules' ? 'default' : 'outline'}
              className={cn(
                'gap-2 rounded-lg font-semibold text-base px-5 py-2.5',
                viewMode === 'business-rules' 
                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              <FileText className="w-5 h-5" />
              業務ルール
            </Button>
            <Button
              onClick={() => setViewMode('menu-management')}
              variant={viewMode === 'menu-management' ? 'default' : 'outline'}
              className={cn(
                'gap-2 rounded-lg font-semibold text-base px-5 py-2.5',
                viewMode === 'menu-management' 
                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              <Menu className="w-5 h-5" />
              メニュー管理
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
                        {mockProjects.filter(p => p.status === 'completed').length}
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
                        {mockProjects.filter(p => p.status === 'in_progress').length}
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
                        {mockProjects.filter(p => p.status === 'started').length}
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
                        {mockProjects.filter(p => p.status === 'not_started').length}
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
                      <p className="text-base text-gray-600">Git移行プロジェクト全体の進捗状況</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">全体平均進捗</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {Math.round(mockProjects.reduce((acc, p) => acc + p.progress, 0) / mockProjects.length)}%
                    </p>
                  </div>
                </div>

                {/* プロジェクト一覧（棒グラフ） */}
                <div className="space-y-4">
                  {mockProjects.map((project) => {
                    const statusConfig = getStatusConfig(project.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div key={project.id} className={cn(
                        'p-4 rounded-xl border-2 transition-all hover:shadow-md',
                        statusConfig.bgLight,
                        'border-gray-200'
                      )}>
                        <div className="flex items-center gap-4">
                          {/* プロジェクト情報 */}
                          <div className="w-48 flex-shrink-0">
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
                                style={{ width: `${Math.max(project.progress, 5)}%` }}
                              >
                                {project.progress >= 20 && (
                                  <span className="text-white font-bold text-sm">{project.progress}%</span>
                                )}
                              </div>
                              {project.progress < 20 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-sm">
                                  {project.progress}%
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

          {/* メニュー管理モード */}
          {viewMode === 'menu-management' && (
            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                  <Menu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">メニュー管理</h3>
                  <p className="text-base text-gray-600">サイドバーに表示されるメニューを管理</p>
                </div>
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

              {/* 既存メニュー一覧 */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 mb-3">メニュー一覧</h4>
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.icon);
                  const isEditing = editingCategory?.id === category.id;
                  
                  return (
                    <div
                      key={category.id}
                      className="p-4 rounded-xl border border-gray-200/50 bg-white/80 hover:bg-white/90 transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            placeholder="カテゴリー名"
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
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{category.name}</h5>
                              <p className="text-xs text-gray-600">{category.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
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
                                if (confirm('このメニューを削除しますか？')) {
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
                  );
                })}
              </div>
            </Card>
          )}

          {/* 業務ルール管理モード */}
          {viewMode === 'business-rules' && (
            <>
              {/* ツールバー */}
              <div className="flex gap-3 mb-4 justify-end">
                <Button
                  onClick={addDirectory}
                  variant="outline"
                  className="gap-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 font-semibold"
                >
                  <FolderPlus className="w-5 h-5" />
                  ディレクトリ追加
                </Button>
                <Button
                  onClick={handleSave}
                  className="gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-sm transition-all"
                >
                  <Save className="w-5 h-5" />
                  保存・エクスポート
                </Button>
              </div>

              {/* ディレクトリ構造 */}
              <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                <Folder className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                業務ルール構造
              </h3>
            </div>

            <div className="space-y-2">
              {structure.map((dir) => (
                <div key={dir.id} className="border border-gray-200/50 rounded-xl overflow-hidden">
                  {/* ディレクトリ */}
                  <div className="bg-white/60 hover:bg-white/80 transition-all p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => toggleDir(dir.id)}
                          className="p-1 hover:bg-gray-200/50 rounded transition-all"
                        >
                          {expandedDirs.has(dir.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <Folder className="w-4 h-4 text-indigo-500" />
                        {editingItem?.type === 'directory' && editingItem.id === dir.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={dir.name}
                              onChange={(e) => updateItem('directory', dir.id, { name: e.target.value })}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => setEditingItem(null)}
                              variant="ghost"
                            >
                              保存
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                              onClick={() => setEditingItem({ type: 'directory', id: dir.id })}
                            >
                              {dir.name}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingItem({ type: 'directory', id: dir.id })}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {dir.description && (
                          <span className="text-xs text-gray-500 ml-2">({dir.description})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addCategoryToDirectory(dir.id)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          カテゴリー
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteItem('directory', dir.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* カテゴリー */}
                  {expandedDirs.has(dir.id) && (
                    <div className="bg-gray-50/50 border-t border-gray-200/50">
                      {dir.categories.map((cat) => (
                        <div key={cat.id} className="border-b border-gray-200/30 last:border-b-0">
                          <div className="p-4 pl-8">
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
                                {editingItem?.type === 'category' && editingItem.id === cat.id ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <Input
                                      value={cat.name}
                                      onChange={(e) => updateItem('category', cat.id, { name: e.target.value }, dir.id)}
                                      className="flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => setEditingItem(null)}
                                      variant="ghost"
                                    >
                                      保存
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="font-medium text-gray-800 cursor-pointer hover:text-purple-600"
                                      onClick={() => setEditingItem({ type: 'category', id: cat.id, parentId: dir.id })}
                                    >
                                      {cat.name}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingItem({ type: 'category', id: cat.id, parentId: dir.id })}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addRule(dir.id, cat.id)}
                                  className="text-xs"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  業務
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteItem('category', cat.id, dir.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* 業務ルール */}
                          {expandedCats.has(cat.id) && (
                            <div className="bg-white/30 pl-16">
                              {cat.rules.map((rule) => (
                                <div key={rule.id} className="p-4 border-b border-gray-200/30 last:border-b-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      {editingItem?.type === 'rule' && editingItem.id === rule.id ? (
                                        <div className="space-y-2">
                                          <Input
                                            value={rule.name}
                                            onChange={(e) => updateItem('rule', rule.id, { name: e.target.value }, cat.id)}
                                            placeholder="業務名"
                                            className="mb-2"
                                            autoFocus
                                          />
                                          <Input
                                            value={rule.description}
                                            onChange={(e) => updateItem('rule', rule.id, { description: e.target.value }, cat.id)}
                                            placeholder="説明"
                                          />
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                                            {rule.isCustomRule && (
                                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                                                社内独自ルール
                                              </span>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setEditingItem({ type: 'rule', id: rule.id, parentId: cat.id })}
                                              className="h-6 w-6 p-0"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                          {rule.description && (
                                            <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                                          )}
                                          <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>データ構造: {Object.keys(rule.data).length} フィールド</span>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={rule.isCustomRule || false}
                                                onChange={(e) => {
                                                  updateItem('rule', rule.id, { isCustomRule: e.target.checked }, cat.id);
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                                              />
                                              <span className="text-gray-700 font-medium">社内独自ルール</span>
                                            </label>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => openMarkdownEditor(rule)}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-sm hover:shadow-md transition-all text-xs px-3 py-1.5"
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
                                  
                                  {/* 自然言語エディタ（業務ルールの直下に表示） */}
                                  {markdownEditor && markdownEditor.ruleId === rule.id && (
                                    <div className="mt-4 p-4 bg-gray-50/80 rounded-xl border border-gray-200/50">
                                      <div className="flex items-center justify-between mb-3">
                                        <div>
                                          <h5 className="text-sm font-bold text-gray-900">自然言語で編集</h5>
                                          <p className="text-xs text-gray-500 mt-1">
                                            自由に自然言語で記述してください。確定ボタンを押すとMarkdown形式に変換されます。
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setMarkdownEditor(null)}
                                          className="h-6 w-6 p-0"
                                        >
                                          ×
                                        </Button>
                                      </div>
                                      <textarea
                                        value={markdownEditor.naturalLanguage}
                                        onChange={(e) => setMarkdownEditor({ ...markdownEditor, naturalLanguage: e.target.value })}
                                        className="w-full h-64 text-sm p-3 rounded-lg border border-gray-200/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white/90 backdrop-blur-sm resize-y"
                                        placeholder="自然言語で自由に記述してください。&#10;&#10;例：&#10;SubversionからGitへの移行を始めます。&#10;&#10;ステップ:&#10;1. SubversionリポジトリのURLを確認&#10;2. ブランチとタグの有無を確認&#10;3. リポジトリサイズを確認"
                                      />
                                      <div className="mt-3 flex justify-end gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setMarkdownEditor(null)}
                                        >
                                          キャンセル
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            saveMarkdownEditor(dir.id, cat.id);
                                          }}
                                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-sm hover:shadow-md transition-all"
                                        >
                                          確定（Markdownに変換）
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
                  )}
                </div>
              ))}
            </div>
          </Card>


          {/* 説明カード */}
          <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-modern-lg border-0">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-bold">
                AIが読み込みやすい構造化データ形式
              </h3>
            </div>
            <p className="text-sm mb-4 opacity-90 leading-relaxed">
              この管理画面で作成した業務ルールは、以下の形式で保存されます：
            </p>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-4">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`# 業務ルール

## Git移行業務

### 移行前準備

#### リポジトリ確認

SubversionリポジトリのURLと構造を確認する

## ステップ

1. SubversionリポジトリのURLを確認
2. ブランチとタグの有無を確認
3. リポジトリサイズを確認

## バリデーション

**必須項目**: url, structure
**チェック項目**: url_format, accessibility

**メタデータ**:
- 作成日: 2025/1/9 12:00:00
- 更新日: 2025/1/9 12:00:00
- バージョン: 1.0
`}
              </pre>
            </div>
            <p className="text-sm opacity-90">
              AIはこのMarkdown形式を読み込んで、業務ルールに基づいたガイドを提供できます。
              構造化データはMarkdown内に埋め込まれ、人間にも読みやすい形式です。
            </p>
          </Card>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

