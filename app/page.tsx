"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PopupPage() {
  const [url, setUrl] = useState("");
  const [dateMs, setDateMs] = useState<number | null>(null);
  const [detectedMs, setDetectedMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const chromeApi: any =
    typeof window !== "undefined" ? (window as any).chrome : undefined;

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDark(prefersDark);
    document.documentElement.setAttribute(
      "data-theme",
      prefersDark ? "dark" : "light"
    );

    try {
      chromeApi?.storage?.local.get("isDarkMode", (data: any) => {
        const val = data?.isDarkMode;
        if (typeof val === "boolean") {
          setIsDark(val);
          document.documentElement.setAttribute(
            "data-theme",
            val ? "dark" : "light"
          );
        }
      });
    } catch {
      // noop
    }

    const onMsg = (message: any) => {
      if (message?.type === "DATE_DETECTED" && message.date) {
        try {
          const ms = new Date(String(message.date).replace(" (UTC)", "")).getTime();
          if (!Number.isNaN(ms)) setDetectedMs(ms);
        } catch {
          // noop
        }
      }
    };

    try {
      chromeApi?.runtime?.onMessage.addListener(onMsg);
    } catch {
      // noop
    }

    return () => {
      try {
        chromeApi?.runtime?.onMessage.removeListener(onMsg);
      } catch {
        // noop
      }
    };
  }, [chromeApi]);

  useEffect(() => {
    try {
      chromeApi?.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const tab = tabs?.[0];
        if (!tab?.id) return;

        const tabUrl = tab?.url || "";
        if (!tabUrl.includes("tiktok.com") && !tabUrl.includes("linkedin.com")) {
          return;
        }

        chromeApi?.tabs?.sendMessage(
          tab.id,
          { action: "extractDate" },
          (res: any) => {
            if (chromeApi?.runtime?.lastError) return;
            if (res?.date) {
              try {
                const ms = new Date(String(res.date).replace(" (UTC)", "")).getTime();
                if (!Number.isNaN(ms)) setDetectedMs(ms);
              } catch {
                // noop
              }
            }
          }
        );
      });
    } catch {
      // noop
    }
  }, [chromeApi]);

  const setTheme = (nextIsDark: boolean) => {
    setIsDark(nextIsDark);
    document.documentElement.setAttribute("data-theme", nextIsDark ? "dark" : "light");
    try {
      chromeApi?.storage?.local.set({ isDarkMode: nextIsDark });
    } catch {
      // noop
    }
  };

  const validateUrl = (u: string) => {
    if (!u) return false;
    const tiktok = /tiktok\.com\/.+\/(video|photo)\/(\d{8,20})/i;
    const linkedinActivity = /linkedin\.com\/.*urn:li:activity:\d{10,}/i;
    const linkedinId = /linkedin\.com.*[^0-9]([0-9]{19})/i;
    const linkedinComment = /fsd_comment:\((\d+),urn:li:activity:\d+\)/i;
    return (
      tiktok.test(u) ||
      linkedinActivity.test(u) ||
      linkedinId.test(u) ||
      linkedinComment.test(u)
    );
  };

  const extract = async () => {
    setError(null);
    setDateMs(null);
    if (!validateUrl(url)) {
      setError("Please enter a valid TikTok or LinkedIn URL");
      return;
    }
    setLoading(true);
    try {
      if (/tiktok\.com/i.test(url)) {
        const id = /\/(video|photo)\/(\d{8,20})/i.exec(url)?.[2];
        if (!id) throw new Error("Invalid TikTok video ID");
        const seconds = BigInt(id) >> 32n;
        const ms = Number(seconds) * 1000;
        setDateMs(ms);
      } else if (/linkedin\.com/i.test(url)) {
        const decoded = decodeURIComponent(url);
        const commentMatch =
          /fsd_comment:\((\d+),urn:li:activity:\d+\)/i.exec(decoded);
        const id = commentMatch?.[1] || /([0-9]{19})/i.exec(decoded)?.[1];
        if (!id) throw new Error("Could not extract LinkedIn ID");
        const ms = Number(BigInt(id) >> 22n);
        setDateMs(ms);
      }
    } catch (e: any) {
      setError(e?.message || "Extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const formatUtc = (ms?: number | null) => {
    if (!ms && ms !== 0) return "";
    return new Date(ms).toUTCString() + " (UTC)";
  };

  const formatLocal = (ms?: number | null) => {
    if (!ms && ms !== 0) return "";
    const d = new Date(ms);
    return d.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatIso = (ms?: number | null) => {
    if (!ms && ms !== 0) return "";
    return new Date(ms).toISOString();
  };

  const formatFull = (ms?: number | null, utc = true) => {
    if (!ms && ms !== 0) return "";
    const d = new Date(ms);
    if (utc) {
      const parts = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
      }).formatToParts(d);
      return parts.map((p) => p.value).join("");
    }
    const parts = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).formatToParts(d);
    return parts.map((p) => p.value).join("");
  };

  const relativeTimeFromNow = (ms?: number | null) => {
    if (!ms && ms !== 0) return "";
    const diffMs = Date.now() - ms;
    const abs = Math.abs(diffMs);
    const mins = Math.floor(abs / 60000);
    if (mins < 1) return "just now";
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

  const renderDateCard = ({
    title,
    timestamp,
    badge,
  }: {
    title: string;
    timestamp: number;
    badge?: React.ReactNode;
  }) => {
    const formatted = formatFull(timestamp, true);
    return (
      <Card className="bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="material-icons text-primary">schedule</span>
            {title}
          </CardTitle>
          {badge}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
              <span>UTC</span>
              <span className="flex items-center gap-1 text-xs">
                <span className="material-icons text-sm text-primary">event</span>
                {relativeTimeFromNow(timestamp)}
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold leading-6 text-foreground">
              {formatted}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <InfoRow label="UTC" value={formatUtc(timestamp)} />
            <InfoRow label="Local" value={formatLocal(timestamp)} />
            <InfoRow label="ISO 8601" value={formatIso(timestamp)} />
            <InfoRow label="Unix" value={Math.floor(timestamp / 1000).toString()} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => copy(formatUtc(timestamp))}
            >
              <span className="material-icons text-base">content_copy</span>
              Copy UTC
            </Button>
            <Button variant="ghost" onClick={() => copy(formatIso(timestamp))}>
              <span className="material-icons text-base">code</span>
              Copy ISO
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="bg-gradient-to-br from-background via-background to-muted/60 p-4 text-foreground">
      <div className="flex flex-col gap-4">
        <Card className="bg-card/90 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Date Sniffer</p>
              <CardTitle className="mt-1 flex items-center gap-2 text-lg">
                <span className="material-icons text-primary">event</span>
                Extract post dates
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                aria-label="Toggle dark mode"
                onClick={() => setTheme(!isDark)}
                className="h-9 w-9 px-0"
              >
                <span className="material-icons text-base">
                  {isDark ? "light_mode" : "dark_mode"}
                </span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Post URL
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/123..."
                aria-label="URL input field"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={extract}
                  disabled={!url || loading}
                  aria-label="Extract date from URL"
                  className="flex-1"
                >
                  <span className="material-icons text-base">
                    {loading ? "hourglass_empty" : "schedule"}
                  </span>
                  {loading ? "Extracting..." : "Extract date"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUrl("");
                    setError(null);
                    setDateMs(null);
                  }}
                  disabled={loading}
                  aria-label="Clear input field"
                >
                  <span className="material-icons text-base">clear</span>
                  Clear
                </Button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                <span className="material-icons text-base">error_outline</span>
                {error}
              </div>
            )}

            {detectedMs && (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-emerald-500">bolt</span>
                  Auto-detected date available
                </div>
                <Badge variant="secondary">Live</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {dateMs !== null && renderDateCard({ title: "Manual", timestamp: dateMs })}

        {detectedMs !== null &&
          renderDateCard({
            title: "Detected",
            timestamp: detectedMs,
            badge: (
              <Badge className="bg-emerald-500 text-emerald-50">
                <span className="material-icons text-xs">bolt</span>
                Live
              </Badge>
            ),
          })}
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <code className="flex-1 text-right text-xs text-foreground">{value}</code>
    </div>
  );
}


