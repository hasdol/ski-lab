'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Markdown({ children, className = '' }) {
  const content = typeof children === 'string' ? children : '';

  if (!content.trim()) return null;

  return (
    <div className={['space-y-3 text-text', className].join(' ')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Do not allow raw HTML in user content.
        skipHtml
        components={{
          h1: (props) => <h3 className="text-xl font-semibold text-gray-900" {...props} />,
          h2: (props) => <h4 className="text-lg font-semibold text-gray-900" {...props} />,
          h3: (props) => <h5 className="text-base font-semibold text-gray-900" {...props} />,
          p: (props) => <p className="text-gray-700 leading-relaxed" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 text-gray-700 space-y-1" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 text-gray-700 space-y-1" {...props} />,
          li: (props) => <li className="leading-relaxed" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-700" {...props} />
          ),
          a: ({ href, children: linkChildren, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline text-gray-800"
              {...props}
            >
              {linkChildren}
            </a>
          ),
          code: ({ inline, children: codeChildren, ...props }) =>
            inline ? (
              <code className="px-1 py-0.5 rounded bg-gray-100 text-gray-900" {...props}>
                {codeChildren}
              </code>
            ) : (
              <pre className="p-3 rounded-2xl bg-gray-100 overflow-x-auto text-gray-900">
                <code {...props}>{codeChildren}</code>
              </pre>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
