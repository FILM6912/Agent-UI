
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, Brain, FileEdit, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { ProcessStep as ProcessStepType } from '../types';
import { useLanguage } from '../LanguageContext';

interface ProcessStepProps {
  step: ProcessStepType;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({ step }) => {
  const { t } = useLanguage();
  // Default commands to expanded so the terminal is visible immediately
  const [expanded, setExpanded] = useState(step.type === 'command' ? true : (step.isExpanded ?? false));

  const getIcon = () => {
    switch (step.type) {
      case 'thinking': return <Brain className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case 'command': return <Terminal className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'edit': return <FileEdit className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case 'error': return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default: return <Sparkles className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getTitle = () => {
    if (step.title === 'Deep Thinking' || step.type === 'thinking') return t('process.thinking');
    if (step.title === 'Reasoning') return t('process.thinking');
    
    if (step.title) return step.title;

    switch (step.type) {
      case 'command': return t('process.command');
      case 'edit': return t('process.edit');
      default: return t('process.default');
    }
  };
  
  const getContent = () => {
      if (step.content.includes("Analyzing technical requirements")) return t('process.analyzing') + "...";
      if (step.content.includes("Deconstructing the problem")) return t('process.deconstructing') + "...";
      return step.content;
  };

  const isCommand = step.type === 'command';

  return (
    <div className="mb-2 last:mb-0 rounded-xl border border-zinc-200 dark:border-zinc-800/40 bg-zinc-50 dark:bg-[#0c0c0e] overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all duration-200 shadow-sm dark:shadow-none">
      <div 
        className="flex items-center gap-3 p-3 min-h-[44px] cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center w-4 h-4 text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-800 dark:group-hover:text-zinc-400 transition-colors">
             {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
        
        <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
           <div className="flex-shrink-0 flex items-center justify-center">
             {getIcon()}
           </div>
           
           <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap flex-shrink-0">
             {getTitle()}
           </span>
           
           {/* If collapsed, show a preview snippet for non-thinking steps */}
           {!expanded && isCommand && (
             <div className="flex-1 min-w-0 ml-2">
                <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                  {step.content}
                </div>
             </div>
           )}
        </div>
        
        <div className="flex items-center gap-3 pl-2 flex-shrink-0">
          {step.duration && (
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{step.duration}</span>
          )}
          {step.status === 'running' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-500" />
          ) : step.status === 'completed' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : null}
        </div>
      </div>

      {expanded && (
        <div className="pl-10 pr-4 pb-3">
           {step.type === 'thinking' && (
               <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-1">
                   {getContent()}
               </div>
           )}
           
           {step.type === 'command' && (
             <div className="mt-1 rounded-lg overflow-hidden bg-[#0c0c0c] border border-zinc-800 font-mono text-xs shadow-inner animate-in fade-in slide-in-from-top-1 duration-200 group/terminal">
                <div className="flex items-center justify-between px-3 py-2 bg-[#18181b] border-b border-zinc-800/50">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50 group-hover/terminal:bg-red-500 transition-colors" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50 group-hover/terminal:bg-amber-500 transition-colors" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 group-hover/terminal:bg-emerald-500 transition-colors" />
                    </div>
                    <div className="text-[10px] text-zinc-600 font-medium">terminal</div>
                </div>
                <div className="p-3 text-zinc-300 overflow-x-auto">
                    <div className="flex gap-2 whitespace-nowrap">
                        <span className="text-emerald-500 font-bold select-none">➜</span>
                        <span className="text-blue-400 font-bold select-none">~</span>
                        <span className="opacity-90">{step.content}</span>
                    </div>
                    {step.status === 'completed' && (
                       <div className="mt-1.5 text-zinc-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                          <span>Done in {step.duration || '0.5s'}</span>
                       </div>
                    )}
                </div>
            </div>
           )}

           {step.type !== 'thinking' && step.type !== 'command' && (
             <div className="text-xs font-mono text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900/30 p-2 rounded border border-zinc-200 dark:border-zinc-800/30 break-all whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200">
                {step.content}
             </div>
           )}
        </div>
      )}
    </div>
  );
};
