import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Paperclip, Copy, RotateCw, Sparkles, Settings, Globe, X, Check, ChevronLeft, ChevronRight, File as FileIcon, Pencil, ImageIcon, ChevronUp, ChevronDown, Server, Trash2, Plug, Play, Mic, MicOff } from 'lucide-react';
import { Message, ModelConfig, AIProvider, Attachment } from '../types';
import { ProcessStep } from './ProcessStep';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../LanguageContext';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSend: (message: string, attachments: Attachment[]) => void;
  onRegenerate: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  isLoading: boolean;
  isStreaming?: boolean;
  modelConfig: ModelConfig;
  onModelConfigChange: (config: ModelConfig) => void;
  onProviderChange?: (provider: AIProvider) => void;
  onVersionChange?: (messageId: string, newIndex: number) => void;
  isPreviewOpen?: boolean;
  onPreviewRequest?: (content: string) => void;
  onOpenSettings?: () => void;
}

export const getPresetModels = (t: (key: string) => string): Record<AIProvider, { id: string; name: string; desc: string }[]> => ({
  google: [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash', desc: t('models.gemini-3-flash-preview') },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', desc: t('models.gemini-3-pro-preview') },
    { id: 'gemini-2.5-flash-lite-latest', name: 'Flash Lite', desc: t('models.gemini-2.5-flash-lite-latest') },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', desc: t('models.gpt-4o') },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: t('models.gpt-4-turbo') },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', desc: t('models.gpt-3.5-turbo') },
  ]
});

// Separated CodeBlock component to manage state (Preview vs Code)
const CodeBlock = React.memo(({ className, children, onPreviewRequest, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const content = String(children).replace(/\n$/, '');
  const isInline = !match && !content.includes('\n');
  
  const isPreviewable = ['html', 'svg'].includes(language);
  const [isPreview, setIsPreview] = useState(false);

  if (isInline) {
     return <code className="bg-zinc-200 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-zinc-300 dark:border-zinc-700/50" {...props}>{children}</code>;
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] overflow-hidden my-4 w-full shadow-md group">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
           <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
           </div>
           <span className="text-xs text-zinc-500 font-mono font-medium ml-2">{language || 'text'}</span>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Run Button for HTML */}
            {language === 'html' && onPreviewRequest && (
                <button
                    onClick={() => onPreviewRequest(content)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 rounded transition-colors"
                >
                    <Play className="w-3 h-3" />
                    Run / Preview
                </button>
            )}

            {isPreviewable && (
                <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
                    <button 
                    onClick={() => setIsPreview(false)}
                    className={`px-2 py-1 text-xs rounded-md transition-all font-medium ${!isPreview ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                    Code
                    </button>
                    <button 
                    onClick={() => setIsPreview(true)}
                    className={`px-2 py-1 text-xs rounded-md transition-all font-medium ${isPreview ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                    Preview
                    </button>
                </div>
            )}
        </div>
      </div>
      
      {isPreview && isPreviewable ? (
        <div className="bg-white p-0 overflow-hidden relative">
           <iframe 
             srcDoc={content}
             className="w-full border-0 min-h-[300px]"
             sandbox="allow-scripts"
             title="Preview"
           />
        </div>
      ) : (
        <div className="p-4 overflow-x-auto text-sm">
          <code className={`font-mono text-zinc-800 dark:text-zinc-300 ${className}`} {...props}>
            {children}
          </code>
        </div>
      )}
    </div>
  );
});

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, input, setInput, onSend, onRegenerate, onEdit, isLoading, isStreaming, modelConfig, onModelConfigChange, onProviderChange, onVersionChange, isPreviewOpen = false, onPreviewRequest, onOpenSettings
}) => {
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Menu Refs for click outside handling
  const mcpMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Dropdown States
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showMcpMenu, setShowMcpMenu] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const PRESET_MODELS = getPresetModels(t);
  
  // Load agent flows from API
  const [agentModels, setAgentModels] = useState<{ id: string; name: string; desc: string }[]>([]);
  
  // Store config in ref to avoid dependency array issues
  const langflowConfigRef = useRef({ url: modelConfig.langflowUrl, apiKey: modelConfig.langflowApiKey });
  
  useEffect(() => {
    langflowConfigRef.current = { url: modelConfig.langflowUrl, apiKey: modelConfig.langflowApiKey };
  }, [modelConfig.langflowUrl, modelConfig.langflowApiKey]);
  
  useEffect(() => {
    const loadAgentModels = async () => {
      const { url, apiKey } = langflowConfigRef.current;
      
      // Fetch from LangFlow API instead of localStorage
      if (!url || !apiKey) {
        setAgentModels([]);
        return;
      }
      
      try {
        const baseUrl = url.replace(/\/+$/, "");
        const apiUrl = new URL(`${baseUrl}/api/v1/flows/`);
        apiUrl.searchParams.append('remove_example_flows', 'false');
        apiUrl.searchParams.append('components_only', 'false');
        apiUrl.searchParams.append('get_all', 'true');
        apiUrl.searchParams.append('header_flows', 'false');
        apiUrl.searchParams.append('page', '1');
        apiUrl.searchParams.append('size', '50');
        apiUrl.searchParams.append('x-api-key', apiKey);
        
        const response = await fetch(apiUrl.toString(), {
          headers: { "accept": "application/json" }
        });
        
        if (!response.ok) {
          console.error("Failed to fetch agents:", response.status);
          setAgentModels([]);
          return;
        }
        
        const flows = await response.json();
        if (!Array.isArray(flows)) {
          setAgentModels([]);
          return;
        }
        
        const agents = flows.map((flow: any) => ({
          id: flow.id, // Use flow ID as model ID
          name: flow.name, // Display name
          desc: flow.description || "LangFlow Agent"
        }));
        
        setAgentModels(agents);
      } catch (error) {
        console.error("Failed to load agent models:", error);
        setAgentModels([]);
      }
    };
    
    loadAgentModels();
    
    // Reload when window gains focus (after settings change)
    const handleFocus = () => loadAgentModels();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []); // Empty dependency array, use ref for config


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isStreaming, editingId, input]);

  // Click outside handler for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (showModelMenu && modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
            setShowModelMenu(false);
        }
        if (showMcpMenu && mcpMenuRef.current && !mcpMenuRef.current.contains(event.target as Node)) {
            setShowMcpMenu(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelMenu, showMcpMenu]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'th' ? 'th-TH' : 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                 setInput(prev => {
                     const trailingSpace = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                     return prev + trailingSpace + finalTranscript;
                 });
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            if (event.error === 'network') {
                setSpeechError('Network error: Check connection');
            } else if (event.error === 'not-allowed') {
                setSpeechError('Microphone denied');
            } else {
                setSpeechError('Speech failed');
            }
            setTimeout(() => setSpeechError(null), 3000);
        };
        
        recognition.onend = () => {
             setIsListening(false);
        };

        recognitionRef.current = recognition;
    }
  }, [setInput, language]);

  // Update language for speech recognition if changed
  useEffect(() => {
    if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'th' ? 'th-TH' : 'en-US';
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        setSpeechError("Speech recognition not supported");
        setTimeout(() => setSpeechError(null), 3000);
        return;
    }
    
    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        try {
            recognitionRef.current.start();
            setIsListening(true);
            setSpeechError(null);
        } catch (e) {
            console.error(e);
            setIsListening(false);
        }
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Resize when input changes (including from speech)
  useEffect(() => {
      autoResize();
  }, [input]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const processFiles = async (files: File[]) => {
      const newAttachments: Attachment[] = [];
      for (const file of files) {
        try {
            if (file.type.startsWith('image/')) {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                newAttachments.push({ name: file.name, type: 'image', content: base64, mimeType: file.type });
            } else {
                const text = await file.text();
                newAttachments.push({ name: file.name, type: 'file', content: text, mimeType: file.type || 'text/plain' });
            }
        } catch (err) {
            console.error("Failed to read file", file.name);
        }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) files.push(file);
        }
    }
    if (files.length > 0) {
        e.preventDefault();
        await processFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await processFiles(Array.from(e.dataTransfer.files));
      }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendClick = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isStreaming) return;
    
    onSend(input, attachments);
    setAttachments([]);
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        handleSendClick(); 
    }
  };

  const startEditing = (msg: Message) => {
      setEditingId(msg.id);
      setEditValue(msg.content);
  };

  const submitEdit = (id: string) => {
      if (editValue.trim() && onEdit) {
          onEdit(id, editValue);
          setEditingId(null);
          setEditValue('');
      }
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditValue('');
  };

  const MarkdownComponents = {
    // Paragraphs
    p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</p>,
    
    // Bold & Italics - Added to ensure they render correctly
    strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-zinc-50">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-zinc-800 dark:text-zinc-200">{children}</em>,

    // Headings
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 mt-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 mt-5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2 mt-4">{children}</h3>,
    
    // Lists
    ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1 text-zinc-700 dark:text-zinc-300 marker:text-zinc-400 dark:marker:text-zinc-500">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-zinc-700 dark:text-zinc-300 marker:text-zinc-400 dark:marker:text-zinc-500">{children}</ol>,
    li: ({ children }: any) => <li className="pl-1 leading-relaxed">{children}</li>,
    
    // Links
    a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors">{children}</a>,
    
    // Images
    img: ({ src, alt }: any) => (
        <img 
            src={src} 
            alt={alt} 
            onClick={() => setViewingImage(src)}
            className="max-w-full rounded-lg my-2 cursor-zoom-in border border-zinc-200 dark:border-zinc-800 hover:opacity-90 transition-opacity" 
        />
    ),

    // Blockquotes
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-2 my-4 italic text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50 rounded-r-lg">{children}</blockquote>,
    
    // Horizontal Rule
    hr: () => <hr className="border-zinc-200 dark:border-zinc-800 my-6" />,

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-sm">
        <table className="w-full text-left text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-100 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-200">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">{children}</tbody>,
    tr: ({ children }: any) => <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">{children}</tr>,
    th: ({ children }: any) => <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">{children}</td>,

    // Code
    code: ({className, children, ...props}: any) => (
        <CodeBlock className={className} onPreviewRequest={onPreviewRequest} {...props}>{children}</CodeBlock>
    )
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090b] relative transition-colors duration-200">
      {/* Settings Button - Top Right */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className={`absolute top-4 z-30 p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all ${
            isPreviewOpen ? 'right-4' : 'right-12'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto scroll-smooth" ref={scrollRef}>
        <div className="max-w-5xl mx-auto px-4 pb-32 md:pb-40 pt-8 space-y-8">
            {messages.map((msg, index) => {
            const isLastMessage = index === messages.length - 1;
            const isAssistant = msg.role === 'assistant';
            const isGenerating = isStreaming && isAssistant && (isLastMessage || !msg.content);
            const hasVersions = msg.versions && msg.versions.length > 1;
            const currentVersion = (msg.currentVersionIndex || 0) + 1;
            const totalVersions = msg.versions?.length || 1;
            const isEditing = editingId === msg.id;

            return (
                <div key={msg.id} className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="mb-2 flex items-center gap-2 px-1">
                    {isAssistant && <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Sparkles className="w-3 h-3 text-white" /></div>}
                    <span className="text-xs text-zinc-500 font-medium">{msg.role === 'user' ? t('chat.you') : modelConfig.name.toUpperCase()}</span>
                </div>
                
                {isAssistant && msg.steps && <div className="w-full mb-4 space-y-1">{msg.steps.map(step => <ProcessStep key={step.id} step={step} />)}</div>}
                
                <div className={`text-sm md:text-base leading-relaxed group relative ${
                    msg.role === 'user' 
                    ? 'w-full flex flex-col items-end' 
                    : 'w-full text-zinc-800 dark:text-zinc-300 pl-1'
                }`}>
                    {msg.role === 'user' ? (
                        isEditing ? (
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-700/50">
                                <textarea 
                                    value={editValue} 
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 resize-none outline-none text-sm leading-relaxed p-1"
                                    rows={Math.max(2, editValue.split('\n').length)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/50">
                                    <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 rounded-lg transition-colors">{t('chat.cancel')}</button>
                                    <button onClick={() => submitEdit(msg.id)} className="px-3 py-1.5 text-xs font-medium bg-black dark:bg-zinc-100 text-white dark:text-black hover:opacity-90 rounded-lg transition-colors">{t('chat.saveSubmit')}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-end gap-1 w-full">
                            {/* Attachments Display */}
                            {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap justify-end gap-2 mb-1 w-full">
                                        {msg.attachments.map((att, i) => (
                                            att.type === 'image' ? (
                                                <div 
                                                    key={i} 
                                                    onClick={() => setViewingImage(att.content)}
                                                    className="group/img relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-zoom-in"
                                                >
                                                    <img src={att.content} alt={att.name} className="max-w-[150px] max-h-[150px] object-cover hover:scale-105 transition-transform duration-300" />
                                                </div>
                                            ) : (
                                                <div key={i} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-700 dark:text-zinc-300">
                                                    <FileIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                                    <span className="truncate max-w-[120px]">{att.name}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                            )}

                            {msg.content && (
                                <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm dark:shadow-md border border-zinc-200 dark:border-zinc-700/30 whitespace-pre-wrap text-left relative group">
                                    {msg.content}
                                </div>
                            )}
                            
                            {/* User Message Controls (Edit / Versions) */}
                            <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                    {hasVersions && onVersionChange && (
                                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
                                            <button 
                                            onClick={() => onVersionChange(msg.id, (msg.currentVersionIndex || 0) - 1)} 
                                            disabled={(msg.currentVersionIndex || 0) === 0}
                                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </button>
                                            <span className="text-[10px] font-medium text-zinc-500 px-1 min-w-[24px] text-center">
                                                {currentVersion} / {totalVersions}
                                            </span>
                                            <button 
                                            onClick={() => onVersionChange(msg.id, (msg.currentVersionIndex || 0) + 1)} 
                                            disabled={currentVersion === totalVersions}
                                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={() => startEditing(msg)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" title={t('chat.edit')}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" title={t('chat.copy')}>
                                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                            </div>
                            </div>
                        )
                    ) : (
                    <>
                        {msg.content ? (
                        <Markdown remarkPlugins={[remarkGfm]} components={MarkdownComponents as any}>{msg.content}</Markdown>
                        ) : (
                        // Show dots animation when content is empty (e.g. during regeneration or initial load)
                        <div className="flex space-x-1.5 py-2 h-6 items-center">
                            <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
                        </div>
                        )}
                    </>
                    )}
                </div>

                {/* Assistant Message Controls */}
                {isAssistant && !isGenerating && (
                    <div className="flex items-center gap-4 mt-3 pl-1 select-none">
                    {hasVersions && onVersionChange && (
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
                            <button 
                            onClick={() => onVersionChange(msg.id, (msg.currentVersionIndex || 0) - 1)} 
                            disabled={(msg.currentVersionIndex || 0) === 0}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-medium text-zinc-500 px-1 min-w-[30px] text-center">
                                {currentVersion} / {totalVersions}
                            </span>
                            <button 
                            onClick={() => onVersionChange(msg.id, (msg.currentVersionIndex || 0) + 1)} 
                            disabled={currentVersion === totalVersions}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" title={t('chat.copy')}>
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => onRegenerate(msg.id)} disabled={isLoading || isStreaming} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" title={t('chat.regenerate')}>
                            <RotateCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    </div>
                )}
                </div>
            );
            })}
            {isLoading && (
                <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 items-start">
                <div className="mb-2 flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">{modelConfig.name.toUpperCase()}</span>
                </div>
                <div className="pl-4 py-2">
                    <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
                    </div>
                </div>
                </div>
            )}
        </div>
      </div>

      {/* Image Lightbox - Portaled */}
      {viewingImage && createPortal(
        <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setViewingImage(null)}
        >
            <button 
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors"
                onClick={() => setViewingImage(null)}
            >
                <X className="w-6 h-6" />
            </button>
            <img 
                src={viewingImage} 
                alt="Full size preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()} 
            />
        </div>,
        document.body
      )}

      {/* Input Area */}
      <div className="absolute bottom-6 left-0 w-full px-4 z-20 pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                multiple 
            />
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border rounded-2xl shadow-2xl transition-all relative ${
                    isDragging 
                    ? 'border-indigo-500 border-2 border-dashed bg-indigo-50/50 dark:bg-indigo-900/20' 
                    : 'border-zinc-200 dark:border-zinc-700/80 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-1'
                }`}
            >
            
            {/* Overlay for drag state */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400 animate-bounce">
                        <Paperclip className="w-8 h-8" />
                        <span className="font-semibold">Drop files here</span>
                    </div>
                </div>
            )}
            
            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-4 pb-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg pl-2 pr-2 py-1.5 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 group relative overflow-hidden">
                            {file.type === 'image' ? (
                                <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 border border-zinc-300 dark:border-zinc-600">
                                    <img src={file.content} alt={file.name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <FileIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            )}
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button onClick={() => removeAttachment(index)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <textarea 
                ref={textareaRef} 
                value={input} 
                onChange={(e) => { setInput(e.target.value); autoResize(); }} 
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={t('chat.placeholder')} 
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 px-4 py-4 pr-12 outline-none resize-none max-h-[30vh] min-h-[56px] text-sm leading-relaxed" 
                rows={1} 
                disabled={isLoading || isStreaming} 
            />
            
            <div className="flex justify-between items-center px-3 pb-3 pt-1">
                <div className="flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"><Paperclip className="w-4 h-4" /></button>
                    
                    {/* MCP Quick Select Dropdown */}
                    <div className="relative" ref={mcpMenuRef}>
                        {showMcpMenu && (
                            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between items-center">
                                    <span>{t('chat.mcpTitle')}</span>
                                    <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 rounded-sm">{modelConfig.mcpServers?.length || 0}</span>
                                </div>
                                <div className="p-2 max-h-48 overflow-y-auto">
                                        {(!modelConfig.mcpServers || modelConfig.mcpServers.length === 0) ? (
                                        <div className="text-xs text-zinc-500 text-center py-4 italic">
                                            No servers connected
                                        </div>
                                        ) : (
                                        modelConfig.mcpServers.map(server => (
                                            <div key={server} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex-1">{server}</span>
                                            </div>
                                        ))
                                        )}
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={() => setShowMcpMenu(!showMcpMenu)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                                showMcpMenu || (modelConfig.mcpServers && modelConfig.mcpServers.length > 0)
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-zinc-800 text-emerald-700 dark:text-emerald-400'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                            }`}
                            title={t('chat.mcpTitle')}
                        >
                            <Plug className="w-3.5 h-3.5" />
                            {(modelConfig.mcpServers && modelConfig.mcpServers.length > 0) && (
                                <span className="text-xs font-bold">{modelConfig.mcpServers.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Model Selector Dropdown */}
                    <div className="relative" ref={modelMenuRef}>
                        {showModelMenu && (
                            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                    {t('chat.availableModels')}
                                </div>
                                <div className="p-1 max-h-60 overflow-y-auto">
                                    {/* Agent Models */}
                                    {agentModels.map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => {
                                                onModelConfigChange({...modelConfig, modelId: m.id, name: m.name});
                                                setShowModelMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${modelConfig.modelId === m.id ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${modelConfig.modelId === m.id ? 'bg-indigo-500' : 'bg-zinc-400 dark:bg-zinc-700'}`}></div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium truncate">{m.name}</span>
                                                <span className="text-[10px] opacity-60 truncate">{m.desc}</span>
                                            </div>
                                            {modelConfig.modelId === m.id && <Check className="w-3 h-3 ml-auto text-emerald-500" />}
                                        </button>
                                    ))}
                                    
                                    {/* Show message if no agents */}
                                    {agentModels.length === 0 && (
                                        <div className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                                            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="mb-1">No agents available</p>
                                            <p className="text-[10px]">Configure agents in Settings</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                                showModelMenu
                                ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                            title={t('chat.modelSettings')}
                        >
                            <div className={`w-2 h-2 rounded-full ${modelConfig.provider === 'google' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                            <span className="text-xs font-medium max-w-[100px] truncate">{modelConfig.name}</span>
                            <ChevronUp className={`w-3 h-3 text-zinc-500 ml-1 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    <div className="relative">
                        {speechError && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-[10px] px-2 py-1 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-1 z-50 pointer-events-none font-medium">
                                {speechError}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500"></div>
                            </div>
                        )}
                        <button
                            onClick={toggleListening}
                            className={`p-2 rounded-xl transition-all ${
                                isListening 
                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' 
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                            title={isListening ? "Stop recording" : "Start recording"}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                    </div>

                    <button onClick={handleSendClick} disabled={(!input.trim() && attachments.length === 0) || isLoading || isStreaming}
                        className={`p-2 rounded-xl transition-all ${((input.trim() || attachments.length > 0) && !isLoading && !isStreaming) ? 'bg-black dark:bg-zinc-100 text-white dark:text-black hover:opacity-90' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 opacity-50'}`}><Send className="w-4 h-4" /></button>
                </div>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};