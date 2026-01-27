import React from "react";
import { Terminal } from "lucide-react";

export interface Log {
  time: string;
  type: "info" | "success" | "warning" | "error" | "command" | "system";
  msg: string;
}

interface TerminalLogsProps {
  logs: Log[];
}

const getLogColor = (type: Log["type"]) => {
  switch (type) {
    case "success":
      return "text-green-400";
    case "error":
      return "text-red-400";
    case "warning":
      return "text-yellow-400";
    case "command":
      return "text-blue-400";
    case "system":
      return "text-purple-400";
    default:
      return "text-zinc-400";
  }
};

const getLogPrefix = (type: Log["type"]) => {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✗";
    case "warning":
      return "⚠";
    case "command":
      return "$";
    case "system":
      return "⚙";
    default:
      return "•";
  }
};

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs }) => {
  return (
    <div className="h-full bg-zinc-950 overflow-auto font-mono text-xs">
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2 text-zinc-400">
        <Terminal className="w-4 h-4" />
        <span className="font-semibold">Terminal</span>
      </div>
      <div className="p-4 space-y-1">
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <span className="text-zinc-600 shrink-0 w-20">{log.time}</span>
            <span className={`shrink-0 w-4 ${getLogColor(log.type)}`}>
              {getLogPrefix(log.type)}
            </span>
            <span className={`flex-1 ${getLogColor(log.type)}`}>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
