import React from "react";

interface SpreadsheetViewerProps {
  content: string;
  isExcel?: boolean;
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  content,
  isExcel = false,
}) => {
  const rows = content.split("\n").filter((r) => r.trim());
  const headers = rows[0]?.split(",").map((h) => h.trim()) || [];
  const dataRows = rows.slice(1).map((r) => r.split(",").map((c) => c.trim()));

  return (
    <div className="overflow-auto h-full bg-zinc-950 p-4">
      <div className="inline-block min-w-full">
        <table className="border-collapse border border-zinc-700">
          <thead>
            <tr className="bg-zinc-800">
              <th className="border border-zinc-700 px-3 py-2 text-left text-xs font-semibold text-zinc-400 w-12">
                #
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="border border-zinc-700 px-3 py-2 text-left text-xs font-semibold text-zinc-300"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-800/50 transition-colors">
                <td className="border border-zinc-700 px-3 py-2 text-xs text-zinc-500 font-mono">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
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
