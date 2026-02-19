import type { AnchorHTMLAttributes, HTMLAttributes } from 'react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const styles = {
  h1: {
    fontSize: '1.875rem',
    lineHeight: '2.25rem',
    fontWeight: 600,
    color: '#0f172a',
    breakInside: 'avoid',
  },
  h2: {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 600,
    color: '#0f172a',
    breakInside: 'avoid',
  },
  h3: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: '#0f172a',
    breakInside: 'avoid',
  },
  h4: {
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: '#0f172a',
    breakInside: 'avoid',
  },
  h5: {
    fontSize: '1rem',
    lineHeight: '1.5rem',
    fontWeight: 600,
    color: '#0f172a',
    breakInside: 'avoid',
  },
  h6: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
    color: '#0f172a',
    breakInside: 'avoid',
  },
  p: {
    marginTop: '0.75rem',
    color: '#334155',
  },
  ul: {
    marginTop: '0.75rem',
    paddingLeft: '1.25rem',
    color: '#334155',
  },
  ol: {
    marginTop: '0.75rem',
    paddingLeft: '1.25rem',
    color: '#334155',
  },
  li: {
    marginTop: '0.25rem',
  },
  a: {
    color: '#0ea5e9',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  codeInline: {
    borderRadius: '0.375rem',
    backgroundColor: '#f1f5f9',
    padding: '0.125rem 0.5rem',
    fontSize: '0.95em',
  },
  code: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  pre: {
    marginTop: '1rem',
    borderRadius: '1rem',
    backgroundColor: '#0f172a',
    padding: '1rem',
    color: '#f1f5f9',
    overflow: 'auto',
    breakInside: 'avoid',
  },
  blockquote: {
    marginTop: '1rem',
    borderLeft: '4px solid #38bdf8',
    backgroundColor: '#f0f9ff',
    padding: '0.75rem 1rem',
    color: '#334155',
    breakInside: 'avoid',
  },
  hr: {
    margin: '1.5rem 0',
    borderTop: '1px solid #e2e8f0',
  },
} as const

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <Markdown
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
          <h1 style={styles.h1} {...props} />
        ),
        h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
          <h2 style={styles.h2} {...props} />
        ),
        h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
          <h3 style={styles.h3} {...props} />
        ),
        h4: (props: HTMLAttributes<HTMLHeadingElement>) => (
          <h4 style={styles.h4} {...props} />
        ),
        h5: (props: HTMLAttributes<HTMLHeadingElement>) => (
          <h5 style={styles.h5} {...props} />
        ),
        h6: (props: HTMLAttributes<HTMLHeadingElement>) => (
          <h6 style={styles.h6} {...props} />
        ),
        p: (props: HTMLAttributes<HTMLParagraphElement>) => (
          <p style={styles.p} {...props} />
        ),
        ul: (props: HTMLAttributes<HTMLUListElement>) => (
          <ul style={styles.ul} {...props} />
        ),
        ol: (props: HTMLAttributes<HTMLOListElement>) => (
          <ol style={styles.ol} {...props} />
        ),
        li: (props: HTMLAttributes<HTMLLIElement>) => (
          <li style={styles.li} {...props} />
        ),
        a: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
          <a href={href} style={styles.a} target="_blank" rel="noreferrer" {...props} />
        ),
        blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
          <blockquote style={styles.blockquote} {...props} />
        ),
        hr: (props: HTMLAttributes<HTMLHRElement>) => (
          <hr style={styles.hr} {...props} />
        ),
        pre: (props: HTMLAttributes<HTMLPreElement>) => (
          <pre style={styles.pre} {...props} />
        ),
        code: ({
          inline,
          className,
          ...props
        }: HTMLAttributes<HTMLElement> & {
          inline?: boolean
          className?: string
        }) =>
          inline ? (
            <code style={{ ...styles.code, ...styles.codeInline }} {...props} />
          ) : (
            <code style={styles.code} className={className} {...props} />
          ),
      }}
    >
      {markdown}
    </Markdown>
  )
}
