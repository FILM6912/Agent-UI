import React, { useRef, useEffect } from "react";
import { Terminal } from "lucide-react";
import { Log } from "./TerminalLogs";

interface ProcessTabProps {
  logs: Log[];
}

export const ProcessTab: React.FC<ProcessTabProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="w-full h-full bg-background rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-2xl font-mono text-sm relative transition-colors duration-200">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20 hidden dark:block"></div>

      <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 bg-muted flex items-center px-4 gap-3 select-none z-20">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
        </div>
        <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
        <div className="flex items-center gap-2 text-muted-foreground">
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

      <div className="flex-1 flex overflow-hidden z-0">
        <div className="flex-1 bg-background p-4 font-mono text-xs overflow-y-auto scrollbar-thin scrollbar-thumb-border relative">
          <div className="space-y-1.5">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 font-mono">
                <span className="text-muted-foreground/60 select-none w-16 shrink-0 text-right">
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
                  className={`flex-1 break-all ${log.type === "command" ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-foreground/80"}`}
                >
                  {log.type === "command" ? (
                    <span className="flex gap-2">
                      <span className="text-muted-foreground select-none">
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
              <span className="text-muted-foreground/40 select-none w-16 text-right">
                --:--:--
              </span>
              <span className="text-muted-foreground/40 w-16 text-center">
                ...
              </span>
              <span className="text-muted-foreground/50 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-muted-foreground/50 inline-block align-bottom"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
