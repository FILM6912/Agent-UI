import React from "react";

interface SpreadsheetViewerProps {
  content: string;
  isExcel?: boolean;
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  content,
  isExcel = false,
}) => {
  let headers: string[] = [];
  let dataRows: string[][] = [];

  try {
    if (isExcel) {
      // Try to parse as JSON first
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.length > 0) {
          headers = data[0].map((h: any) => String(h || ""));
          dataRows = data.slice(1).map((row: any[]) => row.map((c: any) => String(c || "")));
        }
      } catch (e) {
        // If JSON parse fails, check if it looks like raw binary (starts with PK)
        if (content.startsWith("PK")) {
          return (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <div className="text-center">
                <p>Unable to preview Excel file content.</p>
                <p className="text-xs mt-2 text-zinc-500">The file content appears to be raw binary data.</p>
              </div>
            </div>
          );
        }
        throw e;
      }
    } else {
      const rows = content.split("\n").filter((r) => r.trim());
      headers = rows[0]?.split(",").map((h) => h.trim()) || [];
      dataRows = rows.slice(1).map((r) => r.split(",").map((c) => c.trim()));
    }
  } catch (error) {
    console.error("Failed to parse spreadsheet content:", error);
    // Fallback or empty state
  }

  return (
    <div className="overflow-auto h-full bg-zinc-950 p-4">
      <div className="inline-block min-w-full">
        <table className="border-collapse border border-zinc-700">
          <thead>
            <tr className="bg-zinc-800">
              <th className="border border-zinc-700 px-3 py-2 text-left text-xs font-semibold text-zinc-400 w-12 sticky left-0 bg-zinc-800 z-10">
                #
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="border border-zinc-700 px-3 py-2 text-left text-xs font-semibold text-zinc-300 min-w-[100px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-800/50 transition-colors">
                <td className="border border-zinc-700 px-3 py-2 text-xs text-zinc-500 font-mono sticky left-0 bg-zinc-950 z-10">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="border border-zinc-700 px-3 py-2 text-sm text-zinc-300 whitespace-nowrap"
                  >
                    {cell}
                  </td>
                ))}
                {/* Fill empty cells if row length doesn't match header length */}
                {Array.from({ length: Math.max(0, headers.length - row.length) }).map((_, i) => (
                  <td
                    key={`empty-${i}`}
                    className="border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
