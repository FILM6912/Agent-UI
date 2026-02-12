import { CodeBlock } from "../components/CodeBlock";

interface UseMarkdownComponentsProps {
  onPreviewRequest?: (content: string) => void;
  onViewImage: (url: string) => void;
}

export const useMarkdownComponents = ({
  onPreviewRequest,
  onViewImage,
}: UseMarkdownComponentsProps) => {
  return {
    // Paragraphs
    p: ({ children }: any) => (
      <p className="mb-3 last:mb-0 leading-relaxed text-zinc-700 dark:text-zinc-300">
        {children}
      </p>
    ),

    // Bold & Italics
    strong: ({ children }: any) => (
      <strong className="font-bold">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-zinc-800 dark:text-zinc-200">{children}</em>
    ),

    // Headings
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 mt-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 mt-5">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2 mt-4">
        {children}
      </h3>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc pl-6 mb-4 space-y-1 text-zinc-700 dark:text-zinc-300 marker:text-zinc-400 dark:marker:text-zinc-500">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1 text-zinc-700 dark:text-zinc-300 marker:text-zinc-400 dark:marker:text-zinc-500">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="pl-1 leading-relaxed">{children}</li>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
      >
        {children}
      </a>
    ),

    // Images
    img: ({ src, alt }: any) => (
      <img
        src={src}
        alt={alt}
        onClick={() => onViewImage(src)}
        className="max-w-full rounded-lg my-2 cursor-zoom-in border border-zinc-200 dark:border-zinc-800 hover:opacity-90 transition-opacity"
      />
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-2 my-4 italic text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50 rounded-r-lg">
        {children}
      </blockquote>
    ),

    // Horizontal Rule
    hr: () => <hr className="border-zinc-200 dark:border-zinc-800 my-6" />,

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-zinc-100 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-200">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
        {children}
      </td>
    ),

    // Code
    code: ({ className, children, ...props }: any) => (
      <CodeBlock
        className={className}
        onPreviewRequest={onPreviewRequest}
        {...props}
      >
        {children}
      </CodeBlock>
    ),
  };
};
