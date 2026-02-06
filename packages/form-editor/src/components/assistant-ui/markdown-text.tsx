"use client";

import { memo } from "react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";

// Custom component overrides for styling within the chat theme
export const defaultComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }: any) => <li className="mb-1">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-bold mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
  code: ({ className, children, ...props }: any) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto my-2">
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  a: ({ href, children }: any) => (
    <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-slate-300 pl-3 italic my-2">{children}</blockquote>
  ),
};

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      className="aui-md"
      components={defaultComponents}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);
