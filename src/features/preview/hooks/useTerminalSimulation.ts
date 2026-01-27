import { useState, useEffect, useRef } from "react";
import { Log } from "../components/TerminalLogs";

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
];

export const useTerminalSimulation = (isActive: boolean) => {
  const [logs, setLogs] = useState<Log[]>(getInitialLogs());

  const processingRef = useRef<{
    active: boolean;
    scenario?: CommandScenario;
    lineIndex: number;
    timeout: NodeJS.Timeout | null;
  }>({
    active: false,
    lineIndex: 0,
    timeout: null,
  });

  useEffect(() => {
    setLogs(getInitialLogs());
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (processingRef.current.timeout) {
        clearTimeout(processingRef.current.timeout);
        processingRef.current.timeout = null;
      }
      return;
    }

    const runLoop = () => {
      if (processingRef.current.active && processingRef.current.scenario) {
        const { scenario, lineIndex } = processingRef.current;

        if (lineIndex < scenario.lines.length) {
          const line = scenario.lines[lineIndex];
          const time = formatTime(new Date());

          setLogs((prev) => [
            ...prev,
            { time, type: line.type, msg: line.msg },
          ]);

          processingRef.current.lineIndex++;

          const nextLine = scenario.lines[processingRef.current.lineIndex];
          const delay = nextLine ? nextLine.delay || 500 : 2000;

          processingRef.current.timeout = setTimeout(runLoop, delay);
        } else {
          processingRef.current.active = false;
          processingRef.current.timeout = setTimeout(
            runLoop,
            3000 + Math.random() * 5000,
          );
        }
      } else {
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

        runLoop();
      }
    };

    if (!processingRef.current.timeout) {
      processingRef.current.timeout = setTimeout(runLoop, 1000);
    }

    return () => {
      if (processingRef.current.timeout) {
        clearTimeout(processingRef.current.timeout);
        processingRef.current.timeout = null;
      }
    };
  }, [isActive]);

  return { logs };
};
