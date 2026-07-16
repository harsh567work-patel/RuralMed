import Ic from '../components/Icons';

export default function NotFoundPage({ go }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 500,
      }}>
        {/* Large 404 */}
        <div style={{
          fontSize: 120,
          fontWeight: 900,
          color: 'var(--navy)',
          opacity: 0.1,
          letterSpacing: '-2px',
          marginBottom: '-20px',
        }}>
          404
        </div>

        {/* Icon */}
        <div style={{ marginBottom: 24 }}>
          <Ic n="alert" s={48} style={{ color: 'var(--warn)', opacity: 0.8 }} />
        </div>

        {/* Message */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--navy)',
          marginBottom: 8,
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--gray)',
          marginBottom: 32,
          lineHeight: 1.5,
        }}>
          The page you're looking for doesn't exist. It may have been moved or deleted.
        </p>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            className="btn btn-primary"
            onClick={() => go('home')}
            style={{ minWidth: 140 }}
          >
            <Ic n="home" s={14} style={{ marginRight: 8 }} />
            Go Home
          </button>
          <button
            className="btn btn-outline"
            onClick={() => window.history.back()}
            style={{ minWidth: 140 }}
          >
            <Ic n="arrow-left" s={14} style={{ marginRight: 8 }} />
            Go Back
          </button>
        </div>

        {/* Support info */}
        <div style={{
          marginTop: 48,
          padding: 16,
          background: 'var(--card-bg)',
          borderRadius: 8,
          borderLeft: '4px solid var(--teal)',
        }}>
          <p style={{
            fontSize: 13,
            color: 'var(--gray)',
            margin: 0,
          }}>
            Need help? Contact your system administrator or <a href="mailto:support@ruralmed.local" style={{ color: 'var(--teal)', textDecoration: 'none' }}>email support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
