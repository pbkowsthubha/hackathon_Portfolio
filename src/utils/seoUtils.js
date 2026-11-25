/**
 * Prototype Client-Side SEO Metadata Helper
 * Updates document title, meta description, canonical URL, and Open Graph tags.
 * Restores defaults when leaving a blog view.
 */

const DEFAULT_TITLE = 'KOWSTHUBHA | Personal Portfolio'

function upsertMetaTag(attrName, attrValue, content) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!content) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!href) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applyBlogSeoMetadata({ title, description, canonicalUrl, imageUrl }) {
  const prevTitle = document.title || DEFAULT_TITLE

  if (title) {
    document.title = title
    upsertMetaTag('property', 'og:title', title)
  }
  if (description) {
    upsertMetaTag('name', 'description', description)
    upsertMetaTag('property', 'og:description', description)
  } else {
    upsertMetaTag('name', 'description', '')
    upsertMetaTag('property', 'og:description', '')
  }

  if (canonicalUrl) {
    upsertCanonical(canonicalUrl)
  }

  if (imageUrl) {
    upsertMetaTag('property', 'og:image', imageUrl)
  } else {
    upsertMetaTag('property', 'og:image', '')
  }

  return () => {
    document.title = prevTitle || DEFAULT_TITLE
    upsertMetaTag('name', 'description', '')
    upsertMetaTag('property', 'og:title', '')
    upsertMetaTag('property', 'og:description', '')
    upsertMetaTag('property', 'og:image', '')
    upsertCanonical('')
  }
}
