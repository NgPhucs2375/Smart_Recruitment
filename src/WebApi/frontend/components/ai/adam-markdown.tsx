import type {
  AnchorHTMLAttributes,
  BlockquoteHTMLAttributes,
  HTMLAttributes,
  LiHTMLAttributes,
  OlHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

type MarkdownProps<T> = T & { node?: unknown };

const withoutNode = ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLElement>>) => (
  <strong {...props} />
);

export const adamMarkdownComponents = {
  table: ({ node: _node, children, ...props }: MarkdownProps<TableHTMLAttributes<HTMLTableElement>>) => (
    <div className="adam-markdown-table" role="region" tabIndex={0} aria-label="Bảng dữ liệu">
      <table {...props}>{children}</table>
    </div>
  ),
  thead: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLTableSectionElement>>) => (
    <thead {...props} />
  ),
  tbody: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLTableSectionElement>>) => (
    <tbody {...props} />
  ),
  tr: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLTableRowElement>>) => <tr {...props} />,
  th: ({ node: _node, ...props }: MarkdownProps<ThHTMLAttributes<HTMLTableCellElement>>) => <th {...props} />,
  td: ({ node: _node, ...props }: MarkdownProps<TdHTMLAttributes<HTMLTableCellElement>>) => <td {...props} />,
  h1: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLHeadingElement>>) => <h1 {...props} />,
  h2: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLHeadingElement>>) => <h2 {...props} />,
  h3: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLHeadingElement>>) => <h3 {...props} />,
  p: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLParagraphElement>>) => <p {...props} />,
  ul: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLUListElement>>) => <ul {...props} />,
  ol: ({ node: _node, ...props }: MarkdownProps<OlHTMLAttributes<HTMLOListElement>>) => <ol {...props} />,
  li: ({ node: _node, ...props }: MarkdownProps<LiHTMLAttributes<HTMLLIElement>>) => <li {...props} />,
  blockquote: ({ node: _node, ...props }: MarkdownProps<BlockquoteHTMLAttributes<HTMLQuoteElement>>) => (
    <blockquote {...props} />
  ),
  code: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLElement>>) => <code {...props} />,
  pre: ({ node: _node, ...props }: MarkdownProps<HTMLAttributes<HTMLPreElement>>) => <pre {...props} />,
  a: ({ node: _node, ...props }: MarkdownProps<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a {...props} target="_blank" rel="noreferrer" />
  ),
  strong: withoutNode,
};

export const adamMessageView = {
  assistantMessage: {
    markdownRenderer: {
      components: adamMarkdownComponents,
    },
  },
};
