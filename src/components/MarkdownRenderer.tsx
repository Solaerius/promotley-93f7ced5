import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  return (
    <div className={`prose prose-sm md:prose-base dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Kodblock med kopiera-knapp
          code({ inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            
            if (!inline && match) {
              return (
                <CodeBlock code={code} language={match[1]} />
              );
            }
            
            return (
              <code className={`${className} bg-muted px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>
                {children}
              </code>
            );
          },
          // Tabeller - responsiva med overflow
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-border">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 bg-muted font-semibold text-left">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 border-t border-border">
                {children}
              </td>
            );
          },
          // Länkar - öppna i ny flik
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            );
          },
          // Bilder - lazy loading och responsiva
          img({ src, alt }) {
            return (
              <img
                src={src}
                alt={alt || ''}
                loading="lazy"
                className="max-w-full h-auto rounded-lg my-4"
              />
            );
          },
          // Listor
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>;
          },
          // Uppgiftslistor
          li({ children, className }) {
            const isTask = className?.includes('task-list-item');
            if (isTask) {
              return <li className="flex items-start gap-2">{children}</li>;
            }
            return <li className="my-1">{children}</li>;
          },
          input({ type, checked }) {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mt-1 mr-2 cursor-default"
                />
              );
            }
            return null;
          },
          // Rubriker
          h1({ children }) {
            return <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-lg font-semibold mt-3 mb-2">{children}</h4>;
          },
          h5({ children }) {
            return <h5 className="text-base font-semibold mt-2 mb-1">{children}</h5>;
          },
          h6({ children }) {
            return <h6 className="text-sm font-semibold mt-2 mb-1">{children}</h6>;
          },
          // Citatblock
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          // Horisontella linjer
          hr() {
            return <hr className="my-6 border-border" />;
          },
          // Stycken
          p({ children }) {
            return <p className="my-3 leading-relaxed">{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className="p-2 rounded-md bg-background/80 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Kopiera kod"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="bg-muted rounded-lg p-4 overflow-x-auto">
        <div className="text-xs text-muted-foreground mb-2">{language}</div>
        <pre className="text-sm">
          <code className="font-mono whitespace-pre">{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
