"use client";
import { useEffect, useState } from 'react';

export default function PopupPage() {
  const [url, setUrl] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const chromeApi: any = typeof window !== 'undefined' ? (window as any).chrome : undefined;
  const [useUtc, setUseUtc] = useState(true);

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

    try {
      chromeApi?.storage?.local.get('isDarkMode', (data: any) => {
        const val = data?.isDarkMode;
        if (typeof val === 'boolean') {
          setIsDark(val);
          document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light');
        }
      });
    } catch {}

    const onMsg = (message: any) => {
      if (message?.type === 'DATE_DETECTED' && message.date) {
        setDetected(message.date);
      }
    };
    try { chromeApi?.runtime?.onMessage.addListener(onMsg); } catch {}
    return () => { try { chromeApi?.runtime?.onMessage.removeListener(onMsg); } catch {} };
  }, []);

  useEffect(() => {
    // Try auto-detect from active tab
    try {
      chromeApi?.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const tab = tabs?.[0];
        if (!tab?.id) return;
        chromeApi?.tabs?.sendMessage(tab.id, { action: 'extractDate' }, (res: any) => {
          if (res?.date) setDetected(res.date);
        });
      });
    } catch {}
  }, []);

  const setTheme = (nextIsDark: boolean) => {
    setIsDark(nextIsDark);
    document.documentElement.setAttribute('data-theme', nextIsDark ? 'dark' : 'light');
    try { chromeApi?.storage?.local.set({ isDarkMode: nextIsDark }); } catch {}
  };

  const validateUrl = (u: string) => {
    if (!u) return false;
    const tiktok = /tiktok\.com\/.+\/(video|photo)\/(\d{8,20})/i;
    const linkedinActivity = /linkedin\.com\/.*urn:li:activity:\d{10,}/i;
    const linkedinId = /linkedin\.com.*[^0-9]([0-9]{19})/i;
    const linkedinComment = /fsd_comment:\((\d+),urn:li:activity:\d+\)/i;
    return tiktok.test(u) || linkedinActivity.test(u) || linkedinId.test(u) || linkedinComment.test(u);
  };

  const extract = async () => {
    setError(null);
    setDate(null);
    if (!validateUrl(url)) {
      setError('Please enter a valid TikTok or LinkedIn URL');
      return;
    }
    setLoading(true);
    try {
      if (/tiktok\.com/i.test(url)) {
        const id = /\/(video|photo)\/(\d{8,20})/i.exec(url)?.[2];
        if (!id) throw new Error('Invalid TikTok video ID');
        const seconds = (BigInt(id) >> 32n);
        const ms = Number(seconds) * 1000;
        setDate(new Date(ms).toUTCString() + ' (UTC)');
      } else if (/linkedin\.com/i.test(url)) {
        const decoded = decodeURIComponent(url);
        const commentMatch = /fsd_comment:\((\d+),urn:li:activity:\d+\)/i.exec(decoded);
        const id = commentMatch?.[1] || /([0-9]{19})/i.exec(decoded)?.[1];
        if (!id) throw new Error('Could not extract LinkedIn ID');
        // LinkedIn IDs are 64-bit snowflakes with 41-bit millisecond timestamp in the high bits
        // Right shift by 23 to keep the first 41 bits
        const ms = Number(BigInt(id) >> 23n);
        setDate(new Date(ms).toUTCString() + ' (UTC)');
      }
    } catch (e: any) {
      setError(e?.message || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const formatDate = (isoText?: string | null) => {
    if (!isoText) return '';
    const d = new Date(isoText.replace(' (UTC)', ''));
    return useUtc ? d.toUTCString() + ' (UTC)' : d.toLocaleString();
  };

  const relativeTimeFromNow = (isoText?: string | null) => {
    if (!isoText) return '';
    const d = new Date(isoText.replace(' (UTC)', ''));
    const diffMs = Date.now() - d.getTime();
    const abs = Math.abs(diffMs);
    const mins = Math.floor(abs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  return (
    <div className="container">
      <header className="header">
        <div className="title">
          <span className="material-icons">event</span>
          <h2>Date Sniffer</h2>
        </div>
        <div className="header-actions">
          <div className="tz-toggle" role="group" aria-label="Timezone toggle">
            <button className={useUtc ? 'active' : ''} onClick={() => setUseUtc(true)}>UTC</button>
            <button className={!useUtc ? 'active' : ''} onClick={() => setUseUtc(false)}>Local</button>
          </div>
          <button className="theme-toggle" onClick={() => setTheme(!isDark)} aria-label="Toggle dark mode">
            <span className="material-icons">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <section className="card">
        <div className="input-section">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste TikTok or LinkedIn URL"
            aria-label="URL input field"
          />
          <button onClick={extract} disabled={!url} aria-label="Extract date from URL">
            <span className="material-icons">schedule</span>
            Extract
          </button>
          <button onClick={() => { setUrl(''); setError(null); setDate(null); }} aria-label="Clear input field">
            <span className="material-icons">clear</span>
          </button>
        </div>
        {error && <div id="urlValidation" className="error" role="alert" aria-live="polite">{error}</div>}
        {loading && <div id="loader" className="loader" role="status" aria-label="Loading"><span className="sr-only">Loading...</span></div>}
        {date && (
          <div id="result" className="result" role="status" aria-live="polite">
            <div className="result-row">
              <div className="result-main">
                <div className="result-label">Post Date</div>
                <div className="result-value" id="date">{formatDate(date)}</div>
                <div className="result-sub">{relativeTimeFromNow(date)}</div>
              </div>
              <div className="result-actions">
                <button onClick={() => copy(formatDate(date))} aria-label="Copy date to clipboard">
                  <span className="material-icons">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {detected && (
        <section id="auto-detect" className="card" role="status" aria-live="polite">
          <div className="result-row">
            <div className="result-main">
              <div className="result-label">Detected Post Date</div>
              <div className="result-value" id="detected-date">{formatDate(detected)}</div>
              <div className="result-sub">{relativeTimeFromNow(detected)}</div>
            </div>
            <div className="result-actions">
              <button onClick={() => copy(formatDate(detected))} aria-label="Copy detected date to clipboard">
                <span className="material-icons">content_copy</span>
                <span>Copy</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


