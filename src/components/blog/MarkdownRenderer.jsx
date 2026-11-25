import { Fragment } from 'react'
import './MarkdownRenderer.css'

/**
 * Safe URL sanitizer for Markdown links (allows http/https/relative paths only).
 */
function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

/**
 * Parses inline Markdown syntax (**bold**, *italic*, `code`, [label](url)) into React nodes.
 * Never uses dangerouslySetInnerHTML.
 */
function renderInline(text, keyPrefix = 'in') {
  if (!text) return null

  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g
  const nodes = []
  let lastIndex = 0
  let match
  let idx = 0

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const key = `${keyPrefix}-${idx++}`
    if (match[2] !== undefined && match[3] !== undefined) {
      const label = match[2]
      const href = match[3].trim()
      if (isSafeUrl(href)) {
        nodes.push(
          <a
            key={key}
            href={href}
            target={href.startsWith('/') ? undefined : '_blank'}
            rel={href.startsWith('/') ? undefined : 'noopener noreferrer'}
            className="md-link"
          >
            {label}
          </a>
        )
      } else {
        nodes.push(label)
      }
    } else if (match[4] !== undefined) {
      nodes.push(
        <code key={key} className="md-inline-code">
          {match[4]}
        </code>
      )
    } else if (match[5] !== undefined || match[6] !== undefined) {
      nodes.push(<strong key={key}>{match[5] ?? match[6]}</strong>)
    } else if (match[7] !== undefined || match[8] !== undefined) {
      nodes.push(<em key={key}>{match[7] ?? match[8]}</em>)
    }

    lastIndex = tokenRegex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

/**
 * Safe React Markdown renderer supporting headings, paragraphs, bold, italic,
 * ordered/unordered lists, blockquotes, code blocks, links, and line breaks.
 */
export default function MarkdownRenderer({ content, emptyMessage = 'Start writing to see your article preview...' }) {
  if (!content || !content.trim()) {
    return <p className="md-empty">{emptyMessage}</p>
  }

  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i += 1
      continue
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const codeLines = []
      i += 1
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i += 1
      }
      i += 1
      blocks.push(
        <pre key={`code-${blocks.length}`} className="md-code-block">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // Headings (# to ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = renderInline(headingMatch[2], `h-${blocks.length}`)
      const key = `h-${blocks.length}`
      if (level === 1) blocks.push(<h1 key={key} className="md-h1">{headingText}</h1>)
      else if (level === 2) blocks.push(<h2 key={key} className="md-h2">{headingText}</h2>)
      else if (level === 3) blocks.push(<h3 key={key} className="md-h3">{headingText}</h3>)
      else blocks.push(<h4 key={key} className="md-h4">{headingText}</h4>)
      i += 1
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${blocks.length}`} className="md-hr" />)
      i += 1
      continue
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteLines = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2))
        i += 1
      }
      blocks.push(
        <blockquote key={`bq-${blocks.length}`} className="md-blockquote">
          {quoteLines.map((ql, qi) => (
            <Fragment key={qi}>
              {renderInline(ql, `bq-${blocks.length}-${qi}`)}
              {qi < quoteLines.length - 1 && <br />}
            </Fragment>
          ))}
        </blockquote>
      )
      continue
    }

    // Unordered list (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="md-ul">
          {items.map((item, liIdx) => (
            <li key={liIdx}>{renderInline(item, `ul-${blocks.length}-${liIdx}`)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list (1. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i += 1
      }
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="md-ol">
          {items.map((item, liIdx) => (
            <li key={liIdx}>{renderInline(item, `ol-${blocks.length}-${liIdx}`)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Paragraph (collect consecutive non-empty, non-block lines with line breaks)
    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !/^#{1,4}\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('> ') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim())
      i += 1
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="md-p">
        {paraLines.map((pl, pi) => (
          <Fragment key={pi}>
            {renderInline(pl, `p-${blocks.length}-${pi}`)}
            {pi < paraLines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    )
  }

  return <div className="md-renderer">{blocks}</div>
}
