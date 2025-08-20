"use client";
import { useEffect, useState } from 'react';

export default function PopupPage() {
  const [url, setUrl] = useState('');
  const [dateMs, setDateMs] = useState<number | null>(null);
  const [detectedMs, setDetectedMs] = useState<number | null>(null);
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
        try {
          const ms = new Date(String(message.date).replace(' (UTC)', '')).getTime();
          if (!Number.isNaN(ms)) setDetectedMs(ms);
        } catch {}
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
          if (res?.date) {
            try {
              const ms = new Date(String(res.date).replace(' (UTC)', '')).getTime();
              if (!Number.isNaN(ms)) setDetectedMs(ms);
            } catch {}
          }
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
    setDateMs(null);
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
        setDateMs(ms);
      } else if (/linkedin\.com/i.test(url)) {
        const decoded = decodeURIComponent(url);
        const commentMatch = /fsd_comment:\((\d+),urn:li:activity:\d+\)/i.exec(decoded);
        const id = commentMatch?.[1] || /([0-9]{19})/i.exec(decoded)?.[1];
        if (!id) throw new Error('Could not extract LinkedIn ID');
        // LinkedIn IDs are 64-bit snowflakes with 41-bit millisecond timestamp in the high bits
        // Right shift by 23 to keep the first 41 bits
        const ms = Number(BigInt(id) >> 23n);
        setDateMs(ms);
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

  const formatUtc = (ms?: number | null) => {
    if (!ms && ms !== 0) return '';
    return new Date(ms).toUTCString() + ' (UTC)';
  };

  const formatLocal = (ms?: number | null) => {
    if (!ms && ms !== 0) return '';
    const d = new Date(ms);
    return d.toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const formatIso = (ms?: number | null) => {
    if (!ms && ms !== 0) return '';
    return new Date(ms).toISOString();
  };

  const formatFull = (ms?: number | null, utc = true) => {
    if (!ms && ms !== 0) return '';
    const d = new Date(ms);
    if (utc) {
      const parts = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', timeZoneName: 'short'
      }).formatToParts(d);
      return parts.map(p => p.value).join('');
    }
    const parts = new Intl.DateTimeFormat(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
    }).formatToParts(d);
    return parts.map(p => p.value).join('');
  };

  const relativeTimeFromNow = (ms?: number | null) => {
    if (!ms && ms !== 0) return '';
    const diffMs = Date.now() - ms;
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
          <button onClick={() => { setUrl(''); setError(null); setDateMs(null); }} aria-label="Clear input field">
            <span className="material-icons">clear</span>
          </button>
        </div>
        {error && <div id="urlValidation" className="error" role="alert" aria-live="polite">{error}</div>}
        {loading && <div id="loader" className="loader" role="status" aria-label="Loading"><span className="sr-only">Loading...</span></div>}
        {dateMs !== null && (
          <div id="result" className="result" role="status" aria-live="polite">
            <div className="date-hero">
              <div className="date-hero-top">{useUtc ? 'UTC' : 'Local'}</div>
              <div className="date-hero-main">{formatFull(dateMs, useUtc)}</div>
              <div className="date-hero-sub">{relativeTimeFromNow(dateMs)}</div>
            </div>
            <div className="date-lines">
              <div className="date-line">
                <span>UTC</span>
                <code>{formatUtc(dateMs)}</code>
                <button onClick={() => copy(formatUtc(dateMs))}><span className="material-icons">content_copy</span></button>
              </div>
              <div className="date-line">
                <span>Local</span>
                <code>{formatLocal(dateMs)}</code>
                <button onClick={() => copy(formatLocal(dateMs))}><span className="material-icons">content_copy</span></button>
              </div>
              <div className="date-line">
                <span>ISO 8601</span>
                <code>{formatIso(dateMs)}</code>
                <button onClick={() => copy(formatIso(dateMs))}><span className="material-icons">content_copy</span></button>
              </div>
              <div className="date-line">
                <span>Unix</span>
                <code>{Math.floor(dateMs / 1000)}</code>
                <button onClick={() => copy(String(Math.floor(dateMs / 1000)))}><span className="material-icons">content_copy</span></button>
              </div>
            </div>
          </div>
        )}
      </section>

      {detectedMs !== null && (
        <section id="auto-detect" className="card" role="status" aria-live="polite">
          <div className="date-hero small">
            <div className="date-hero-top">Detected • {useUtc ? 'UTC' : 'Local'}</div>
            <div className="date-hero-main" id="detected-date">{formatFull(detectedMs, useUtc)}</div>
            <div className="date-hero-sub">{relativeTimeFromNow(detectedMs)}</div>
          </div>
          <div className="date-lines">
            <div className="date-line">
              <span>UTC</span>
              <code>{formatUtc(detectedMs)}</code>
              <button onClick={() => copy(formatUtc(detectedMs))}><span className="material-icons">content_copy</span></button>
            </div>
            <div className="date-line">
              <span>Local</span>
              <code>{formatLocal(detectedMs)}</code>
              <button onClick={() => copy(formatLocal(detectedMs))}><span className="material-icons">content_copy</span></button>
            </div>
            <div className="date-line">
              <span>ISO 8601</span>
              <code>{formatIso(detectedMs)}</code>
              <button onClick={() => copy(formatIso(detectedMs))}><span className="material-icons">content_copy</span></button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


