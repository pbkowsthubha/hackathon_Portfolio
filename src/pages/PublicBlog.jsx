import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import { applyBlogSeoMetadata } from '../utils/seoUtils'
import './PublicBlog.css'

export default function PublicBlog() {
  const { username } = useParams()
  const portfolioRes = portfolioService.getPortfolioByUsername(username)
  const isPortfolioPublished = portfolioRes ? portfolioService.isPortfolioPublished(username) : false
  const publishedPosts = isPortfolioPublished ? portfolioService.getPublishedBlogPosts(username) : []
  const creatorName = portfolioRes?.data?.fullName || username

  useEffect(() => {
    if (!portfolioRes || !isPortfolioPublished) return undefined
    return applyBlogSeoMetadata({
      title: `${creatorName} — Blog | Portfolio Studio`,
      description: `Published articles and technical writing by ${creatorName}.`,
      canonicalUrl: `${window.location.origin}/p/${username}/blog`,
    })
  }, [portfolioRes, isPortfolioPublished, creatorName, username])

  if (!portfolioRes || !isPortfolioPublished) {
    return (
      <div className="pub-blog-not-found">
        <span className="pub-nf-tag">404 / BLOG NOT FOUND</span>
        <h1 className="pub-nf-title">No creator blog exists at /p/{username}/blog</h1>
        <p className="pub-nf-desc">
          The requested portfolio username does not exist or has not published any articles.
        </p>
        <div className="pub-nf-actions">
          <Link to="/" className="btn-hero-primary">Platform Home</Link>
          <Link to="/p/kowsthuba" className="btn-hero-secondary">Explore Kowsthuba Demo</Link>
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

          <nav className="pub-blog-links" aria-label="Public blog navigation">
            <Link to={`/p/${username}`} className="pub-nav-link">Portfolio</Link>
            <Link to={`/p/${username}/blog`} className="pub-nav-link pub-nav-link--active">Blog</Link>
            <Link to="/" className="pub-nav-link pub-nav-link--muted">Portfolio Studio</Link>
          </nav>
        </div>
      </header>

      <main className="pub-blog-main">
        <div className="pub-blog-hero">
          <span className="pub-blog-kicker">WRITING &amp; INSIGHTS</span>
          <h1 className="pub-blog-title">{creatorName}&apos;s Blog</h1>
          <p className="pub-blog-subtitle">
            Published articles, engineering notes, and perspectives by @{username.toLowerCase()}.
          </p>
        </div>

        {publishedPosts.length === 0 ? (
          <div className="pub-blog-empty">
            <h2 className="pub-empty-title">No published articles yet</h2>
            <p className="pub-empty-desc">
              {creatorName} has not published any public articles at this time.
            </p>
            <Link to={`/p/${username}`} className="btn-hero-secondary">
              ← Return to Portfolio
            </Link>
          </div>
        ) : (
          <div className="pub-blog-grid">
            {publishedPosts.map((post) => (
              <article key={post.id} className="pub-article-card">
                {post.coverImage ? (
                  <Link to={`/p/${username}/blog/${post.slug}`} className="pub-card-cover-link">
                    <img src={post.coverImage} alt={post.title} className="pub-card-cover-img" />
                  </Link>
                ) : (
                  <Link to={`/p/${username}/blog/${post.slug}`} className="pub-card-cover-placeholder">
                    <span>{post.category}</span>
                    <span className="pub-placeholder-dot" aria-hidden="true">■</span>
                  </Link>
                )}

                <div className="pub-card-content">
                  <div className="pub-card-meta">
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

                  <h2 className="pub-card-title">
                    <Link to={`/p/${username}/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="pub-card-excerpt">{post.excerpt}</p>

                  <div className="pub-card-footer">
                    <Link to={`/p/${username}/blog/${post.slug}`} className="pub-read-more">
                      <span>Read Article</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
