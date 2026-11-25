import './ToastContainer.css'

/**
 * Renders stacked toast notifications positioned cleanly below the sticky dashboard header.
 */
export default function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div
      className="dash-toast-stack"
      aria-live="polite"
      aria-relevant="additions removals"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`dash-toast dash-toast--${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          <span className="dash-toast-dot" aria-hidden="true">
            ■
          </span>
          <span className="dash-toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
