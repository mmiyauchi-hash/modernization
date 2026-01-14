import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { 
  Settings, 
  Save, 
  Plus, 
  Folder, 
  FileText, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  FolderPlus,
  Upload,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import { BusinessRuleDirectory, BusinessRuleCategory, BusinessRule } from '../types/businessRules';
import { gitMigrationScenario } from '../lib/gitScenario';
import { gitSteps } from '../lib/gitSteps';
import { useStore } from '../store/useStore';
import { CategoryInfo, ModernizationCategory } from '../types';
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

type AdminViewMode = 'business-rules' | 'menu-management';

export function AdminPanel() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [viewMode, setViewMode] = useState<AdminViewMode>('business-rules');
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
      id: newId as ModernizationCategory,
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
          id: newId as ModernizationCategory,
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
          id: newId as ModernizationCategory,
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
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b glass-strong border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-modern">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                管理者画面
              </h2>
              <p className="text-xs text-gray-600 font-medium">
                業務ルールとメニューの管理
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode('business-rules')}
              variant={viewMode === 'business-rules' ? 'default' : 'outline'}
              className={cn(
                'gap-2 rounded-xl',
                viewMode === 'business-rules' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                  : 'border-gray-200/50 hover:bg-gray-100/50'
              )}
            >
              <FileText className="w-4 h-4" />
              業務ルール
            </Button>
            <Button
              onClick={() => setViewMode('menu-management')}
              variant={viewMode === 'menu-management' ? 'default' : 'outline'}
              className={cn(
                'gap-2 rounded-xl',
                viewMode === 'menu-management' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                  : 'border-gray-200/50 hover:bg-gray-100/50'
              )}
            >
              <Menu className="w-4 h-4" />
              メニュー管理
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* ディレクトリ構造 */}
          <Card className="p-6 glass-strong rounded-2xl shadow-modern-lg border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-modern">
                <Folder className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
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
        </div>
      </div>
    </div>
  );
}

