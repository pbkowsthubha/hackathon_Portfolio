import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import { applyBlogSeoMetadata } from '../utils/seoUtils'
import MarkdownRenderer from '../components/blog/MarkdownRenderer'
import './PublicBlog.css'

export default function PublicBlogArticle() {
  const { username, slug } = useParams()
  const portfolioRes = portfolioService.getPortfolioByUsername(username)
  const isPortfolioPublished = portfolioRes ? portfolioService.isPortfolioPublished(username) : false
  const post = isPortfolioPublished ? portfolioService.getPublishedBlogPostBySlug(username, slug) : null
  const creatorName = portfolioRes?.data?.fullName || username

  useEffect(() => {
    if (!post) return undefined
    return applyBlogSeoMetadata({
      title: `${post.title} — ${creatorName} | Portfolio Studio`,
      description: post.excerpt,
      canonicalUrl: `${window.location.origin}/p/${username}/blog/${post.slug}`,
      imageUrl: post.coverImage || '',
    })
  }, [post, creatorName, username])

  if (!portfolioRes || !post) {
    return (
      <div className="pub-blog-not-found">
        <span className="pub-nf-tag">404 / ARTICLE NOT FOUND</span>
        <h1 className="pub-nf-title">Article could not be found</h1>
        <p className="pub-nf-desc">
          This article may have been moved, unpublished, or the URL may be incorrect.
        </p>
        <div className="pub-nf-actions">
          {portfolioRes ? (
            <Link to={`/p/${username}/blog`} className="btn-hero-primary">
              ← Back to {creatorName}&apos;s Blog
            </Link>
          ) : (
            <Link to="/" className="btn-hero-primary">
              Platform Home
            </Link>
          )}
          <Link to={`/p/${username}`} className="btn-hero-secondary">
            View Portfolio
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="pub-blog-page">
      <header className="pub-blog-nav">
        <div className="pub-blog-nav-inner">
          <Link to={`/p/${username}`} className="pub-blog-brand">
            <span>{creatorName.toUpperCase()}</span>
            <span className="brand-dot" aria-hidden="true">.</span>
          </Link>

          <nav className="pub-blog-links" aria-label="Public article navigation">
            <Link to={`/p/${username}/blog`} className="pub-nav-link">← Back to Blog</Link>
            <Link to={`/p/${username}`} className="pub-nav-link">Portfolio</Link>
          </nav>
        </div>
      </header>

      <main className="pub-article-main">
        <article className="pub-article-container">
          <div className="pub-article-header">
            <div className="pub-article-meta-top">
              <span className="pub-card-cat">{post.category}</span>
              <span>·</span>
              <span>{post.readingTime || 1} min read</span>
              {post.publishedAt && (
                <>
                  <span>·</span>
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </>
              )}
            </div>

            <h1 className="pub-article-title">{post.title}</h1>
            <p className="pub-article-excerpt">{post.excerpt}</p>

            <div className="pub-article-author-bar">
              <span>Written by <strong>{creatorName}</strong></span>
              <span className="author-handle">@{username.toLowerCase()}</span>
            </div>
          </div>

          {post.coverImage && (
            <div className="pub-article-cover">
              <img src={post.coverImage} alt={post.title} className="pub-article-cover-img" />
            </div>
          )}

          <div className="pub-article-body">
            <MarkdownRenderer content={post.content} />
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="pub-article-tags">
              <span className="tags-heading">TOPICS:</span>
              <div className="tags-wrap">
                {post.tags.map((tag) => (
                  <span key={tag} className="pub-tag-chip">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="pub-article-footer">
            <Link to={`/p/${username}/blog`} className="btn-back-blog">
              ← Back to All Articles
            </Link>
            <Link to={`/p/${username}`} className="btn-back-portfolio">
              View {creatorName}&apos;s Portfolio
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
