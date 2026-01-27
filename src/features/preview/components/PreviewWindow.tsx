import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Share2,
  PanelRightClose,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileType,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Copy,
  Check,
  GripVertical,
  Eye,
  Code,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText,
  Table as TableIcon,
  Globe,
  RefreshCw,
  Lock,
  ExternalLink,
  Pencil,
  Trash2,
  Download,
  Save,
  MoreVertical,
  Loader2,
  Terminal,
  Zap,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PreviewWindowProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isSidebarOpen?: boolean;
  previewContent?: string | null;
  isLoading?: boolean;
}

interface FileNode {
  id?: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  isOpen?: boolean;
  content?: string;
}

// Initial Mock Data
const INITIAL_FILE_SYSTEM: FileNode[] = [
  {
    name: "src",
    type: "folder",
    isOpen: true,
    children: [
      {
        name: "components",
        type: "folder",
        isOpen: true,
        children: [
          {
            name: "Hero.tsx",
            type: "file",
            content: `import React from 'react';\n\nexport const Hero = () => {\n  return (\n    <section className="pt-32 pb-20 px-6">\n      <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">\n        Build faster.\n      </h1>\n      <p className="mt-6 text-xl text-gray-400">Deploy AI agents in seconds.</p>\n    </section>\n  );\n};`,
          },
          {
            name: "Navbar.tsx",
            type: "file",
            content: `import React from 'react';\n\nexport const Navbar = () => (\n  <nav className="fixed w-full z-50 bg-black/50 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center">\n    <div className="font-bold text-xl">Acme Inc</div>\n    <div className="flex gap-4">\n      <a href="#features">Features</a>\n      <a href="#pricing">Pricing</a>\n    </div>\n  </nav>\n);`,
          },
          {
            name: "Features.tsx",
            type: "file",
            content: `import React from 'react';\nimport { Zap, Shield, Globe } from 'lucide-react';\n\nexport const Features = () => {\n  return (\n    <div className="grid grid-cols-3 gap-8 p-10">\n      <div className="p-6 border border-white/10 rounded-xl">\n        <Zap className="text-yellow-400 mb-4" />\n        <h3 className="font-bold text-lg">Lightning Fast</h3>\n      </div>\n      {/* ... more features */}\n    </div>\n  );\n};`,
          },
        ],
      },
      {
        name: "App.tsx",
        type: "file",
        content: `import { Navbar } from './components/Navbar';\nimport { Hero } from './components/Hero';\nimport { Features } from './components/Features';\n\nfunction App() {\n  return (\n    <div className="min-h-screen bg-black text-white">\n      <Navbar />\n      <Hero />\n      <Features />\n    </div>\n  );\n}\n\nexport default App;`,
      },
    ],
  },
  {
    name: "public",
    type: "folder",
    isOpen: true,
    children: [
      {
        name: "logo.svg",
        type: "file",
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-box"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
      },
      {
        name: "hero-background.jpg",
        type: "file",
        content:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080&auto=format&fit=crop",
      },
      {
        name: "og-image.png",
        type: "file",
        content:
          "https://images.unsplash.com/photo-1614741118868-b4ab0a22ff52?q=80&w=800&auto=format&fit=crop",
      },
    ],
  },
  {
    name: "data",
    type: "folder",
    isOpen: false,
    children: [
      {
        name: "testimonials.json",
        type: "file",
        content: `[\n  {\n    "name": "Sarah Chen",\n    "role": "CTO at TechFlow",\n    "text": "This tool revolutionized our workflow."\n  },\n  {\n    "name": "Alex Miller",\n    "role": "Founder",\n    "text": "Incredible speed and accuracy."\n  }\n]`,
      },
    ],
  },
  {
    name: "README.md",
    type: "file",
    content: `# Modern Landing Page\n\nA high-conversion landing page built with React and Tailwind CSS.\n\n## Stack\n- React 19\n- Tailwind CSS\n- Framer Motion`,
  },
  {
    name: "package.json",
    type: "file",
    content: `{\n  "name": "landing-page",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  }\n}`,
  },
];

interface Log {
  time: string;
  type: "info" | "success" | "warning" | "error" | "command" | "system";
  msg: string;
}

interface CommandScenario {
  id: string;
  lines: { type: Log["type"]; msg: string; delay?: number }[];
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const getInitialLogs = (): Log[] => {
  const now = new Date();
  const t = (offsetSeconds: number) => {
    const d = new Date(now.getTime() - offsetSeconds * 1000);
    return formatTime(d);
  };

  return [
    { time: t(2), type: "system", msg: "System initialized." },
    { time: t(1), type: "info", msg: "Waiting for commands..." },
  ];
};

const COMMAND_SCENARIOS: CommandScenario[] = [
  {
    id: "build",
    lines: [
      { type: "command", msg: "npm run build", delay: 0 },
      {
        type: "info",
        msg: "vite v5.1.4 building for production...",
        delay: 500,
      },
      { type: "info", msg: "transforming...", delay: 800 },
      { type: "success", msg: "✓ 42 modules transformed.", delay: 1500 },
      { type: "info", msg: "rendering chunks...", delay: 1800 },
      {
        type: "info",
        msg: "dist/index.html                  0.45 kB │ gzip:  0.29 kB",
        delay: 2200,
      },
      {
        type: "info",
        msg: "dist/assets/index-D8s92.css      1.24 kB │ gzip:  0.64 kB",
        delay: 2300,
      },
      {
        type: "info",
        msg: "dist/assets/index-C8a9d.js     143.02 kB │ gzip: 46.12 kB",
        delay: 2400,
      },
      { type: "success", msg: "✓ built in 2.41s", delay: 2500 },
    ],
  },
  {
    id: "test",
    lines: [
      { type: "command", msg: "npm run test", delay: 0 },
      { type: "info", msg: "> vitest", delay: 600 },
      { type: "info", msg: "RUN  v1.3.1 /app", delay: 1000 },
      { type: "success", msg: "✓ src/App.test.tsx (2 tests)", delay: 1800 },
      {
        type: "success",
        msg: "✓ src/utils/format.test.ts (5 tests)",
        delay: 2200,
      },
      { type: "info", msg: "Test Files  2 passed (2)", delay: 2400 },
      { type: "success", msg: "Tests  7 passed (7)", delay: 2500 },
      {
        type: "info",
        msg: "Duration  1.45s (transform 34ms, setup 0ms, collect 24ms, tests 12ms)",
        delay: 2600,
      },
    ],
  },
  {
    id: "lint",
    lines: [
      { type: "command", msg: "npm run lint", delay: 0 },
      {
        type: "info",
        msg: "> eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        delay: 400,
      },
      { type: "info", msg: "Checking src/App.tsx...", delay: 1200 },
      {
        type: "info",
        msg: "Checking src/components/Sidebar.tsx...",
        delay: 1500,
      },
      {
        type: "warning",
        msg: 'Warning: React Hook useEffect has a missing dependency: "id".',
        delay: 1800,
      },
      { type: "success", msg: "Done in 2.1s.", delay: 2200 },
    ],
  },
  {
    id: "git",
    lines: [
      { type: "command", msg: "git add .", delay: 0 },
      { type: "command", msg: 'git commit -m "update components"', delay: 800 },
      { type: "info", msg: "[main 8a2b3c] update components", delay: 1200 },
      {
        type: "info",
        msg: " 3 files changed, 42 insertions(+), 12 deletions(-)",
        delay: 1400,
      },
      { type: "command", msg: "git push origin main", delay: 2000 },
      { type: "info", msg: "Enumerating objects: 11, done.", delay: 2500 },
      {
        type: "info",
        msg: "Counting objects: 100% (11/11), done.",
        delay: 2700,
      },
      {
        type: "info",
        msg: "Delta compression using up to 8 threads",
        delay: 2900,
      },
      {
        type: "info",
        msg: "Compressing objects: 100% (6/6), done.",
        delay: 3100,
      },
      {
        type: "info",
        msg: "Writing objects: 100% (6/6), 1.24 KiB | 1.24 MiB/s, done.",
        delay: 3300,
      },
      {
        type: "info",
        msg: "Total 6 (delta 4), reused 0 (delta 0), pack-reused 0",
        delay: 3500,
      },
      {
        type: "success",
        msg: "To https://github.com/user/project.git",
        delay: 3700,
      },
      { type: "success", msg: "   8a2b3c..9d4e5f  main -> main", delay: 3800 },
    ],
  },
  {
    id: "install",
    lines: [
      { type: "command", msg: "npm install lucide-react", delay: 0 },
      {
        type: "info",
        msg: "up to date, audited 245 packages in 843ms",
        delay: 1000,
      },
      { type: "info", msg: "34 packages are looking for funding", delay: 1200 },
      { type: "info", msg: "  run `npm fund` for details", delay: 1300 },
      { type: "success", msg: "found 0 vulnerabilities", delay: 1500 },
    ],
  },
];

const MOCK_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              background: '#09090b',
              foreground: '#fafafa',
              primary: '#6366f1',
              secondary: '#a1a1aa'
            }
          }
        }
      }
    </script>
    <style>
        body { background-color: #09090b; color: #fafafa; }
        .hero-gradient {
            background: radial-gradient(circle at top center, #1e1b4b 0%, #09090b 60%);
        }
        /* Hide scrollbar for cleaner preview */
        ::-webkit-scrollbar { width: 0px; background: transparent; }
    </style>
</head>
<body class="font-sans antialiased overflow-x-hidden selection:bg-primary/30">
    <!-- Navbar -->
    <nav class="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-xl tracking-tight">
                <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1-10-5-2 1 10 5zm0 2.5l-8-4-2 1 10 5 10-5-2-1-8 4z"/></svg>
                </div>
                Acme AI
            </div>
            <div class="hidden md:flex items-center gap-8 text-sm font-medium text-secondary">
                <a href="#" class="hover:text-white transition-colors">Features</a>
                <a href="#" class="hover:text-white transition-colors">Solutions</a>
                <a href="#" class="hover:text-white transition-colors">Pricing</a>
                <a href="#" class="hover:text-white transition-colors">Docs</a>
            </div>
            <div class="flex items-center gap-4">
                <a href="#" class="text-sm font-medium hover:text-white text-secondary hidden sm:block">Sign In</a>
                <a href="#" class="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">Get Started</a>
            </div>
        </div>
    </nav>
    <section class="hero-gradient pt-32 pb-20 px-6">
        <div class="max-w-7xl mx-auto text-center">
            <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Build software faster <br class="hidden md:block"/> with intelligent agents.
            </h1>
        </div>
    </section>
</body>
</html>`;

// Helper to render CSV/Excel like tables with dark theme
const SpreadsheetViewer: React.FC<{ content: string; isExcel?: boolean }> = ({
  content,
  isExcel,
}) => {
  const rows = content
    .trim()
    .split("\n")
    .map((row) => row.split(","));
  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#18181b] text-zinc-900 dark:text-zinc-300 overflow-hidden font-mono text-sm border border-zinc-200 dark:border-zinc-800 rounded-md shadow-inner transition-colors">
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <table className="w-full border-collapse min-w-max">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr className="bg-zinc-100 dark:bg-[#1e1e22] border-b border-zinc-300 dark:border-zinc-700">
              <th className="w-12 bg-zinc-200 dark:bg-[#27272a] border-r border-zinc-300 dark:border-zinc-800 text-center text-zinc-600 dark:text-zinc-500 font-normal select-none py-2 text-[11px]">
                #
              </th>
              {rows[0]?.map((_, i) => (
                <th
                  key={i}
                  className="border-r border-zinc-300 dark:border-zinc-700/50 bg-zinc-200 dark:bg-[#27272a] px-4 py-2 font-semibold text-zinc-600 dark:text-zinc-400 select-none text-left text-[11px] uppercase tracking-wider"
                >
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors group"
              >
                <td className="bg-zinc-50 dark:bg-zinc-900/40 border-r border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 dark:text-zinc-600 font-mono px-2 select-none text-[11px] group-hover:text-zinc-700 dark:group-hover:text-zinc-500">
                  {rowIndex + 1}
                </td>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-r border-zinc-200 dark:border-zinc-800/30 px-4 py-2 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getInitialExpandedPaths = (nodes: FileNode[], prefix = ""): string[] => {
  let paths: string[] = [];
  nodes.forEach((node) => {
    const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === "folder" && node.isOpen) {
      paths.push(currentPath);
    }
    if (node.children) {
      paths = [
        ...paths,
        ...getInitialExpandedPaths(node.children, currentPath),
      ];
    }
  });
  return paths;
};

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  onSelect: (node: FileNode) => void;
  currentPath: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onRename: (path: string, newName: string) => void;
  onDelete: (path: string) => void;
  onDownload: (node: FileNode) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  level,
  onSelect,
  currentPath,
  expandedPaths,
  onToggle,
  onRename,
  onDelete,
  onDownload,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const hasChildren =
    node.type === "folder" && node.children && node.children.length > 0;

  const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
  const isOpen = expandedPaths.has(nodePath);

  const handleRenameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim() && newName !== node.name) {
      onRename(nodePath, newName);
    }
    setIsRenaming(false);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "tsx":
      case "ts":
        return (
          <FileCode className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        );
      case "css":
        return <FileType className="w-4 h-4 text-sky-400 dark:text-sky-300" />;
      case "json":
        return (
          <FileJson className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
        );
      case "md":
        return (
          <FileIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-300" />
        );
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
      case "svg":
        return (
          <ImageIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
        );
      case "csv":
        return (
          <TableIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        );
      case "xlsx":
      case "xls":
        return (
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
        );
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500 dark:text-red-400" />;
      default:
        return <FileIcon className="w-4 h-4 text-zinc-500" />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isRenaming) return;
    if (node.type === "folder") {
      onToggle(nodePath);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1 px-2 hover:bg-zinc-200 dark:hover:bg-zinc-800/50 cursor-pointer text-sm select-none transition-colors relative pr-16 ${level === 0 ? "ml-0" : ""}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <div className="w-4 h-4 flex items-center justify-center text-zinc-500">
          {node.type === "folder" &&
            (isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            ))}
        </div>

        {node.type === "folder" ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          ) : (
            <Folder className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          )
        ) : (
          getFileIcon(node.name)
        )}

        {isRenaming ? (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white dark:bg-black border border-indigo-500 rounded px-1 py-0.5 text-xs outline-none w-24 text-zinc-900 dark:text-zinc-100"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              onBlur={() => handleRenameSubmit()}
            />
          </div>
        ) : (
          <span
            className={`truncate ${node.type === "folder" ? "text-zinc-800 dark:text-zinc-200 font-medium" : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-300"}`}
          >
            {node.name}
          </span>
        )}
        {!isRenaming && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-200 dark:bg-zinc-800/90 rounded px-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
              className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <Pencil className="w-3 h-3" />
            </button>
            {node.type === "file" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(node);
                }}
                className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <Download className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(nodePath);
              }}
              className="p-1 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {isOpen &&
        hasChildren &&
        node.children?.map((child, idx) => (
          <FileTreeItem
            key={idx}
            node={child}
            level={level + 1}
            onSelect={onSelect}
            currentPath={nodePath}
            expandedPaths={expandedPaths}
            onToggle={onToggle}
            onRename={onRename}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        ))}
    </div>
  );
};

export const PreviewWindow: React.FC<PreviewWindowProps> = ({
  isOpen = true,
  onToggle,
  isMobile = false,
  isSidebarOpen = true,
  previewContent,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"process" | "files" | "web">(
    "process",
  );

  const [fileSystem, setFileSystem] = useState<FileNode[]>(INITIAL_FILE_SYSTEM);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(getInitialExpandedPaths(INITIAL_FILE_SYSTEM)),
  );
  const [terminalLogs, setTerminalLogs] = useState<Log[]>(getInitialLogs());
  const logEndRef = useRef<HTMLDivElement>(null);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const content = previewContent || MOCK_DASHBOARD_HTML;
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewContent]);

  // State for sequential terminal simulation
  const processingRef = useRef<{
    active: boolean;
    scenario?: CommandScenario;
    lineIndex: number;
    timeout: any;
  }>({
    active: false,
    lineIndex: 0,
    timeout: null,
  });

  useEffect(() => {
    // Refresh initial logs on mount to have current time
    setTerminalLogs(getInitialLogs());
  }, []);

  useEffect(() => {
    if (activeTab === "process") {
      const runLoop = () => {
        if (processingRef.current.active && processingRef.current.scenario) {
          // We are currently running a scenario
          const { scenario, lineIndex } = processingRef.current;

          if (lineIndex < scenario.lines.length) {
            // Add the next line
            const line = scenario.lines[lineIndex];
            const time = new Date().toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            setTerminalLogs((prev) => [
              ...prev,
              { time, type: line.type, msg: line.msg },
            ]);

            // Setup next step
            processingRef.current.lineIndex++;

            const nextLine = scenario.lines[processingRef.current.lineIndex];
            const delay = nextLine ? nextLine.delay || 500 : 2000; // Wait 2s after finished before potentially starting new one

            processingRef.current.timeout = setTimeout(runLoop, delay);
          } else {
            // Scenario finished
            processingRef.current.active = false;
            processingRef.current.timeout = setTimeout(
              runLoop,
              3000 + Math.random() * 5000,
            ); // Random wait before next command
          }
        } else {
          // Pick a new random scenario
          const randomScenario =
            COMMAND_SCENARIOS[
              Math.floor(Math.random() * COMMAND_SCENARIOS.length)
            ];
          processingRef.current = {
            active: true,
            scenario: randomScenario,
            lineIndex: 0,
            timeout: null,
          };

          // Start immediately
          runLoop();
        }
      };

      // Start the loop
      if (!processingRef.current.timeout) {
        processingRef.current.timeout = setTimeout(runLoop, 1000);
      }

      return () => {
        if (processingRef.current.timeout) {
          clearTimeout(processingRef.current.timeout);
          processingRef.current.timeout = null;
        }
      };
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "process") {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, activeTab]);

  const toggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleRename = (path: string, newName: string) => {
    const recursiveRename = (
      nodes: FileNode[],
      currentPath = "",
    ): FileNode[] => {
      return nodes.map((node) => {
        const nodePath = currentPath
          ? `${currentPath}/${node.name}`
          : node.name;
        if (nodePath === path) {
          if (
            selectedFile &&
            selectedFile.name === node.name &&
            nodePath === path
          ) {
            const updatedNode = { ...node, name: newName };
            setSelectedFile(updatedNode);
            return updatedNode;
          }
          return { ...node, name: newName };
        }
        if (node.children)
          return {
            ...node,
            children: recursiveRename(node.children, nodePath),
          };
        return node;
      });
    };
    setFileSystem((prev) => recursiveRename(prev));
  };

  const handleDelete = (path: string) => {
    const recursiveDelete = (
      nodes: FileNode[],
      currentPath = "",
    ): FileNode[] => {
      return nodes.filter((node) => {
        const nodePath = currentPath
          ? `${currentPath}/${node.name}`
          : node.name;
        if (nodePath === path) {
          if (selectedFile && selectedFile.name === node.name)
            setSelectedFile(null);
          return false;
        }
        if (node.children)
          node.children = recursiveDelete(node.children, nodePath);
        return true;
      });
    };
    setFileSystem((prev) => recursiveDelete(prev));
  };

  const handleDownload = (node: FileNode) => {
    if (!node.content) return;
    const blob = new Blob([node.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = node.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveContent = () => {
    if (!selectedFile) return;
    const recursiveUpdate = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.name === selectedFile.name && node.type === selectedFile.type)
          return { ...node, content: editContent };
        if (node.children)
          return { ...node, children: recursiveUpdate(node.children) };
        return node;
      });
    };
    setFileSystem((prev) => recursiveUpdate(prev));
    setSelectedFile((prev) =>
      prev ? { ...prev, content: editContent } : null,
    );
    setViewMode("code");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback mechanism without logging permission errors to console
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure element is part of DOM but not visibly affecting layout
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.setAttribute("readonly", ""); // Prevent keyboard on mobile

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999);

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
      } catch (e) {
        return false;
      }
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Agent Preview",
          text: "Check out this agent preview",
          url: url,
        });
        return;
      } catch (e) {
        // Fallback to clipboard if share was cancelled or failed
      }
    }

    const success = await copyToClipboard(url);
    if (success) {
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }
  };

  useEffect(() => {
    if (previewContent) setActiveTab("web");
  }, [previewContent]);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };
  const stopResizing = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const rawWidth = window.innerWidth - e.clientX;
      const sidebarW = isSidebarOpen ? 260 : 60;
      const minChatW = 380;
      const minPreviewW = 300;
      const maxAllowedWidth = window.innerWidth - sidebarW - minChatW;
      let newWidth = rawWidth;
      if (newWidth < minPreviewW) newWidth = minPreviewW;
      if (newWidth > maxAllowedWidth) newWidth = maxAllowedWidth;
      setWidth(newWidth);
    };
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing, isSidebarOpen]);

  const handleCopy = async () => {
    if (!selectedFile?.content) return;
    const success = await copyToClipboard(selectedFile.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileSelect = (node: FileNode) => {
    setSelectedFile(node);
    setEditContent(node.content || "");
    const ext = node.name.split(".").pop()?.toLowerCase();
    if (
      [
        "md",
        "png",
        "jpg",
        "jpeg",
        "gif",
        "webp",
        "svg",
        "csv",
        "xlsx",
        "xls",
        "pdf",
      ].includes(ext || "")
    )
      setViewMode("preview");
    else setViewMode("code");
  };
  const handleOpenInNewTab = () => {
    if (previewUrl) window.open(previewUrl, "_blank");
  };
  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };
  const getLanguage = (filename: string) => {
    if (filename.endsWith(".tsx") || filename.endsWith(".ts"))
      return "typescript";
    if (filename.endsWith(".js") || filename.endsWith(".jsx"))
      return "javascript";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".html") || filename.endsWith(".svg")) return "xml";
    if (filename.endsWith(".md")) return "markdown";
    return "plaintext";
  };

  const mobileClasses = `fixed inset-0 z-50 bg-white dark:bg-black flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`;
  const desktopClasses = `h-screen bg-white dark:bg-black border-l border-zinc-200 dark:border-zinc-900 flex flex-col flex-shrink-0 relative ease-in-out overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-full border-l-0 opacity-0"} ${isResizing ? "" : "transition-all duration-300"}`;

  const renderFileContent = () => {
    if (!selectedFile) return null;
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (viewMode === "code") {
      return (
        <div className="relative w-full h-full bg-white dark:bg-[#1e1e1e]">
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ padding: 0, margin: 0 }}
          >
            <SyntaxHighlighter
              language={getLanguage(selectedFile.name)}
              style={isDark ? vscDarkPlus : vs}
              customStyle={{
                margin: 0,
                padding: "1.5rem",
                height: "100%",
                width: "100%",
                background: "transparent",
                fontSize: "14px",
                lineHeight: "1.5",
                fontFamily: "monospace",
              }}
              codeTagProps={{
                style: {
                  fontFamily: "monospace",
                  fontSize: "14px",
                  lineHeight: "1.5",
                },
              }}
              wrapLongLines={false}
            >
              {editContent + "\n"}
            </SyntaxHighlighter>
          </div>
          <textarea
            className="absolute inset-0 w-full h-full bg-transparent text-transparent p-[1.5rem] font-mono text-[14px] leading-[1.5] outline-none resize-none caret-black dark:caret-white whitespace-pre"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            spellCheck={false}
            onScroll={(e) => {
              const container = e.currentTarget.parentElement;
              const pre = container?.querySelector("pre");
              if (pre) {
                pre.scrollTop = e.currentTarget.scrollTop;
                pre.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            style={{ fontFamily: "monospace" }}
          />
        </div>
      );
    }
    switch (ext) {
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
        return (
          <div className="flex items-center justify-center h-full bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-zinc-200 dark:bg-zinc-900 p-8">
            <img
              src={selectedFile.content}
              alt={selectedFile.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-zinc-300 dark:border-zinc-800"
            />
          </div>
        );
      case "svg":
        const svgContent = selectedFile.content || "";
        const isSvgUrl =
          svgContent.trim().startsWith("http") ||
          svgContent.trim().startsWith("data:");
        if (isSvgUrl) {
          return (
            <div className="flex items-center justify-center h-full bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-zinc-200 dark:bg-zinc-900 p-8">
              <img
                src={svgContent}
                alt={selectedFile.name}
                className="max-w-full max-h-full"
              />
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center h-full bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-zinc-200 dark:bg-zinc-900 p-8">
            <div
              dangerouslySetInnerHTML={{ __html: svgContent }}
              className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto text-zinc-900 dark:text-zinc-100"
            />
          </div>
        );
      case "pdf":
        return (
          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex flex-col">
            <div className="bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800 p-2 flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-400">
              <span>PDF Viewer</span>
              <a
                href={selectedFile.content}
                target="_blank"
                rel="noreferrer"
                className="hover:text-black dark:hover:text-white flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" /> Open external
              </a>
            </div>
            <iframe
              src={selectedFile.content}
              className="flex-1 w-full border-0 bg-white"
              title={selectedFile.name}
            />
          </div>
        );
      case "csv":
        return <SpreadsheetViewer content={selectedFile.content || ""} />;
      case "xlsx":
      case "xls":
        return (
          <SpreadsheetViewer content={selectedFile.content || ""} isExcel />
        );
      case "md":
        return (
          <div className="p-6 md:p-8 max-w-3xl mx-auto prose prose-zinc dark:prose-invert prose-sm">
            <Markdown remarkPlugins={[remarkGfm]}>
              {selectedFile.content || ""}
            </Markdown>
          </div>
        );
      default:
        return (
          <div className="relative w-full h-full bg-white dark:bg-[#1e1e1e]">
            <textarea
              className="absolute inset-0 w-full h-full bg-transparent text-transparent p-[1.5rem] font-mono text-[14px] leading-[1.5] outline-none resize-none caret-black dark:caret-white whitespace-pre"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              spellCheck={false}
            />
          </div>
        );
    }
  };

  return (
    <div
      className={isMobile ? mobileClasses : desktopClasses}
      style={!isMobile ? { width: isOpen ? width : 0 } : {}}
    >
      {!isMobile && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 z-50 transition-colors"
          onMouseDown={startResizing}
        />
      )}
      <div className={`w-full h-full flex flex-col`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-900">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
            {t("preview.title")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 relative"
              title="Share"
            >
              {showShareTooltip ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {showShareTooltip && (
                <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-zinc-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1">
                  {t("preview.shareSuccess")}
                </div>
              )}
            </button>
            <button
              onClick={onToggle}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-900/50">
          <button
            onClick={() => {
              setActiveTab("process");
              setSelectedFile(null);
            }}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === "process" ? "text-zinc-900 dark:text-zinc-200 border-zinc-900 dark:border-zinc-200" : "text-zinc-500 dark:text-zinc-600 border-transparent hover:text-zinc-700 dark:hover:text-zinc-400"}`}
          >
            {t("preview.tabProcess")}
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === "files" ? "text-zinc-900 dark:text-zinc-200 border-zinc-900 dark:border-zinc-200" : "text-zinc-500 dark:text-zinc-600 border-transparent hover:text-zinc-700 dark:hover:text-zinc-400"}`}
          >
            {t("preview.tabFiles")}
          </button>
          <button
            onClick={() => setActiveTab("web")}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === "web" ? "text-zinc-900 dark:text-zinc-200 border-zinc-900 dark:border-zinc-200" : "text-zinc-500 dark:text-zinc-600 border-transparent hover:text-zinc-700 dark:hover:text-zinc-400"}`}
          >
            {t("preview.tabPreview")}
          </button>
        </div>

        <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative flex flex-col">
          {activeTab === "web" ? (
            <div className="w-full h-full bg-white dark:bg-[#0d0d10] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-xl dark:shadow-2xl">
              <div className="h-10 bg-zinc-100 dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenInNewTab}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
                    title={t("preview.openInNewTab")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
                    title={t("preview.reload")}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-white relative">
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                  title="Live Preview"
                />
              </div>
            </div>
          ) : activeTab === "process" ? (
            /* Process Dashboard - Terminal Style */
            <div className="w-full h-full bg-white dark:bg-[#0c0c0e] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-2xl font-mono text-sm relative transition-colors duration-200">
              {/* CRT Scanline effect overlay - Dark mode only */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20 hidden dark:block"></div>

              {/* Header */}
              <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] flex items-center px-4 gap-3 select-none z-20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
                </div>
                <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium tracking-wide">
                    root@agent:~
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500/80 animate-pulse font-bold tracking-wider">
                    ● LIVE SESSION
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden z-0">
                {/* Right Terminal Log Panel */}
                <div className="flex-1 bg-white dark:bg-[#09090b] p-4 font-mono text-xs overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 relative">
                  <div className="space-y-1.5">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="flex gap-3 font-mono">
                        <span className="text-zinc-400 dark:text-zinc-600 select-none w-16 flex-shrink-0 text-right">
                          {log.time}
                        </span>

                        <span
                          className={`${
                            log.type === "info"
                              ? "text-blue-600 dark:text-blue-400"
                              : log.type === "success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : log.type === "warning"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : log.type === "error"
                                    ? "text-red-600 dark:text-red-400"
                                    : log.type === "command"
                                      ? "text-purple-600 dark:text-purple-400"
                                      : "text-zinc-500"
                          } w-16 select-none uppercase text-[10px] font-bold tracking-wider pt-0.5 text-center`}
                        >
                          {log.type === "command"
                            ? "SHELL"
                            : log.type === "info"
                              ? ""
                              : log.type}
                        </span>

                        <span
                          className={`flex-1 break-all ${log.type === "command" ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-zinc-700 dark:text-zinc-300"}`}
                        >
                          {log.type === "command" ? (
                            <span className="flex gap-2">
                              <span className="text-zinc-400 dark:text-zinc-500 select-none">
                                $
                              </span>
                              {log.msg}
                            </span>
                          ) : (
                            log.msg
                          )}
                        </span>
                      </div>
                    ))}
                    <div ref={logEndRef} />

                    <div className="flex gap-3 font-mono pt-2 animate-pulse opacity-50">
                      <span className="text-zinc-400 dark:text-zinc-700 select-none w-16 text-right">
                        --:--:--
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-700 w-16 text-center">
                        ...
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-zinc-400 dark:bg-zinc-500 inline-block align-bottom"></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* File Explorer / File Viewer */
            <div className="w-full h-full bg-white dark:bg-[#0d0d10] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-xl dark:shadow-2xl relative">
              {selectedFile ? (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-[#1e1e1e]">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b]">
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-zinc-200 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-300 dark:border-zinc-700/50 mr-2">
                        <button
                          onClick={() => setViewMode("code")}
                          className={`px-2 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 ${viewMode === "code" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                        >
                          <Code className="w-3 h-3" /> Code
                        </button>
                        {[
                          "md",
                          "png",
                          "jpg",
                          "jpeg",
                          "gif",
                          "webp",
                          "svg",
                          "csv",
                          "xlsx",
                          "xls",
                          "pdf",
                        ].includes(
                          selectedFile.name.split(".").pop()?.toLowerCase() ||
                            "",
                        ) && (
                          <button
                            onClick={() => setViewMode("preview")}
                            className={`px-2 py-1 text-[10px] rounded-md transition-all flex items-center gap-1.5 ${viewMode === "preview" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-600 dark:text-zinc-500">
                        {selectedFile.name}
                      </span>
                      {viewMode === "code" && (
                        <button
                          onClick={handleSaveContent}
                          className="p-1.5 text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                          title="Save"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(selectedFile)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="Copy code"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(selectedFile.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-white dark:bg-[#1e1e1e] scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                    {renderFileContent()}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-zinc-50 dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Generated Files</span>
                    {isLoading && (
                      <div className="flex items-center gap-1.5 text-indigo-500 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">GENERATING</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 font-mono">
                    {fileSystem.map((node, idx) => (
                      <FileTreeItem
                        key={idx}
                        node={node}
                        level={0}
                        onSelect={handleFileSelect}
                        currentPath=""
                        expandedPaths={expandedPaths}
                        onToggle={toggleFolder}
                        onRename={handleRename}
                        onDelete={handleDelete}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
