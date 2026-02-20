import type { AnchorHTMLAttributes, HTMLAttributes } from 'react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {
  DEFAULT_PDF_THEME,
  PDF_THEMES,
  type PdfThemeId,
} from '~/components/markdown-themes'

const createStyles = (themeId: PdfThemeId) => {
  const theme = PDF_THEMES[themeId]
  return {
    h1: {
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      fontWeight: 600,
      color: theme.headingColor,
      breakInside: 'avoid',
    },
    h2: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      fontWeight: 600,
      color: theme.headingColor,
      breakInside: 'avoid',
    },
    h3: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: 600,
      color: theme.headingColor,
      breakInside: 'avoid',
    },
    h4: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: 600,
      color: theme.headingColor,
      breakInside: 'avoid',
    },
    h5: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: 600,
      color: theme.headingColor,
      breakInside: 'avoid',
    },
    h6: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 600,
      color: theme.headingColor,
      breakInside: 'avoid',
    },
    p: {
      marginTop: '0.75rem',
      color: theme.textColor,
    },
    ul: {
      marginTop: '0.75rem',
      paddingLeft: '1.25rem',
      color: theme.textColor,
    },
    ol: {
      marginTop: '0.75rem',
      paddingLeft: '1.25rem',
      color: theme.textColor,
    },
    li: {
      marginTop: '0.25rem',
    },
    a: {
      color: theme.linkColor,
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
    },
    codeInline: {
      borderRadius: '0.375rem',
      backgroundColor: theme.codeBg,
      color: theme.codeText,
      padding: '0.125rem 0.5rem',
      fontSize: '0.95em',
    },
    code: {
      fontFamily: theme.monoFontFamily,
    },
    pre: {
      marginTop: '1rem',
      borderRadius: '1rem',
      backgroundColor: theme.headingColor,
      padding: '1rem',
      color: '#f8fafc',
      overflow: 'auto',
      breakInside: 'avoid',
    },
    blockquote: {
      marginTop: '1rem',
      borderLeft: `4px solid ${theme.quoteBorder}`,
      backgroundColor: theme.quoteBg,
      padding: '0.75rem 1rem',
      color: theme.mutedText,
      breakInside: 'avoid',
    },
    hr: {
      margin: '1.5rem 0',
      borderTop: `1px solid ${theme.ruleColor}`,
    },
  } as const
}

export function MarkdownRenderer({
  markdown,
  themeId = DEFAULT_PDF_THEME,
}: {
  markdown: string
  themeId?: PdfThemeId
}) {
  const styles = createStyles(themeId)
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
          <a
            href={href}
            style={styles.a}
            target="_blank"
            rel="noreferrer"
            {...props}
          />
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
