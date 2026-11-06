"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

interface Channel {
  name: string;
  count: number;
}

interface Video {
  title: string;
  url: string;
  count: number;
}

interface Analytics {
  totalWatched?: number;
  uniqueChannels?: number;
  uniqueVideos?: number;
  topChannels?: Channel[];
  topVideos?: Video[];
  hourCounts?: number[] | Record<string, number>;
  dateRange?: {
    first?: string | null;
    last?: string | null;
  };
  aiRoast?: string;
}

const loadingMessages = [
  "Consulting the council of questionable life choices...",
  "Finding out why you watched that video 17 times...",
  "Your algorithm is filing a formal complaint...",
  "Checking whether you have ever touched grass...",
  "Judging your subscriptions. Respectfully. (Not really.)",
  "Calculating the damage to your recommendations...",
  "Asking YouTube why it let this happen...",
  "Preparing emotional support for the results...",
];

const chartColors = [
  "#281442",
  "#7046a5",
  "#a78bfa",
  "#ff8fab",
  "#c6ff4d",
  "#f4a261",
];

function formatNumber(value: number | undefined) {
  return (value ?? 0).toLocaleString();
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getHourCounts(
  value: Analytics["hourCounts"]
): number[] {
  if (Array.isArray(value)) {
    return Array.from({ length: 24 }, (_, index) =>
      Number(value[index] ?? 0)
    );
  }

  if (value && typeof value === "object") {
    return Array.from({ length: 24 }, (_, index) =>
      Number(value[index] ?? value[String(index)] ?? 0)
    );
  }

  return new Array(24).fill(0);
}

export default function Home() {
  const fileInput = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [readyToViewResults, setReadyToViewResults] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) return;

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) =>
        (current + 1) % loadingMessages.length
      );
    }, 2500);

    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (showResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showResults]);

  const hourCounts = useMemo(
    () => getHourCounts(analytics?.hourCounts),
    [analytics?.hourCounts]
  );

  const maxHour = Math.max(...hourCounts, 1);

  const channelSlices = useMemo(() => {
    const topChannels = (analytics?.topChannels ?? []).slice(0, 5);

    const topTotal = topChannels.reduce(
      (sum, channel) => sum + channel.count,
      0
    );

    const otherCount = Math.max(
      (analytics?.totalWatched ?? 0) - topTotal,
      0
    );

    const items = topChannels.map((channel, index) => ({
      name: channel.name,
      count: channel.count,
      color: chartColors[index],
    }));

    if (otherCount > 0) {
      items.push({
        name: "Other",
        count: otherCount,
        color: chartColors[5],
      });
    }

    const total = items.reduce((sum, item) => sum + item.count, 0);

    let position = 0;

    const gradientParts = items.map((item) => {
      const start = position;
      position += total > 0 ? (item.count / total) * 100 : 0;

      return `${item.color} ${start}% ${position}%`;
    });

    return {
      items,
      total,
      gradient:
        total > 0
          ? `conic-gradient(${gradientParts.join(", ")})`
          : "conic-gradient(#e9e1ff 0% 100%)",
    };
  }, [analytics]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("You haven't selected a file yet. 💀");
      return;
    }

    setLoading(true);
    setReadyToViewResults(false);
    setShowResults(false);
    setAnalytics(null);
    setError("");
    setLoadingMessageIndex(0);

    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      // Keep the meme loading screen visible for at least 30 seconds.
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(30000 - elapsed, 0);

      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }

      const returnedAnalytics = result.analytics ?? result;

      setAnalytics({
        ...returnedAnalytics,
        aiRoast: result.roast ?? returnedAnalytics.aiRoast ?? "",
      });

      setReadyToViewResults(true);
    } catch (uploadError) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(30000 - elapsed, 0);

      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Something went wrong while analyzing your history."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleViewResults() {
    setShowResults(true);
  }

  function handleChooseFile() {
    fileInput.current?.click();
  }

  return (
    <main className="site-shell">
      <nav className="navbar">
        <a className="brand" href="#">
          roastify<span>.</span>
        </a>

        <p className="nav-caption">YOUR HISTORY IS NOT SAFE HERE</p>

        <a className="nav-cta" href="#upload">
          GET ROASTED <span>↗</span>
        </a>
      </nav>

      <section className="hero">
        <div className="hero-doodle doodle-one">✳</div>
        <div className="hero-doodle doodle-two">✦</div>
        <div className="hero-doodle doodle-three">?</div>

        <div className="hero-stickers">
          <span className="sticker sticker-lime">100% JUDGMENT</span>
          <span className="sticker sticker-pink">NO MERCY 💀</span>
        </div>

        <p className="eyebrow">A LITTLE TOO MUCH SCREEN TIME?</p>

        <h1>
          YOUR YOUTUBE
          <br />
          HISTORY IS
          <br />
          <span>EMBARRASSING.</span>
        </h1>

        <p className="hero-description">
          Upload your watch history. Let us investigate your questionable
          decisions. Prepare to be personally attacked.
        </p>

        <a href="#upload" className="hero-button">
          EXPOSE ME <span>↓</span>
        </a>

        <p className="hero-footnote">100% REAL DATA. 0% EMOTIONAL DAMAGE CONTROL.</p>
      </section>

      <section className="upload-section" id="upload">
        <div className="section-intro">
          <p className="eyebrow">FIRST, THE EVIDENCE</p>
          <h2>
            DROP THE
            <br />
            <span>RECEIPTS.</span>
          </h2>
          <p>
            We need your YouTube watch history to uncover the truth.
            Don't worry, we've seen worse. Probably.
          </p>
        </div>

        <form className="upload-card" onSubmit={handleUpload}>
          <div className="upload-card-top">
            <span>📁 THE EVIDENCE ROOM</span>
            <span className="upload-card-tag">JSON ONLY</span>
          </div>

          {loading ? (
            <div className="loading-card">
              <span className="loading-sticker">INVESTIGATION IN PROGRESS</span>

              <div className="loading-skull">💀</div>

              <p className="loading-kicker">PLEASE DO NOT PANIC</p>

              <h2 className="loading-title">
                WE&apos;RE DIGGING
                <br />
                THROUGH YOUR PAST.
              </h2>

              <p className="loading-message">
                {loadingMessages[loadingMessageIndex]}
              </p>

              <div className="loading-progress">
                <div className="loading-progress-bar" />
              </div>

              <p className="loading-footnote">
                THIS MAY TAKE A MOMENT. YOUR WATCH HISTORY IS... A LOT.
              </p>
            </div>
          ) : readyToViewResults ? (
            <div className="results-ready">
              <div className="ready-icon">🫣</div>

              <p className="loading-kicker">INVESTIGATION COMPLETE</p>

              <h2>
                THE DAMAGE
                <br />
                REPORT IS READY.
              </h2>

              <p>Your history has been investigated. There is no going back.</p>

              <button
                type="button"
                className="analyze-button"
                onClick={handleViewResults}
              >
                VIEW MY RESULTS ↓
              </button>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📂</div>

              <h3>GOT THE FILE?</h3>

              <p className="upload-description">
                Select your YouTube watch-history JSON file below.
              </p>

              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                className="hidden-file-input"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError("");
                }}
              />

              <button
                type="button"
                className="choose-button"
                onClick={handleChooseFile}
              >
                CHOOSE YOUR FILE ↗
              </button>

              <p className="file-name">
                {file ? `📄 ${file.name}` : "NO FILE SELECTED"}
              </p>

              <p className="file-hint">
                JSON FILE ONLY · YOUR YOUTUBE WATCH HISTORY
              </p>

              <button type="submit" className="analyze-button">
                ROAST MY HISTORY 💀
              </button>

              <p className="takeout-help">
                Don't have your data?{" "}
                <a
                  href="https://takeout.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get it from Google Takeout ↗
                </a>
              </p>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="upload-card-bottom">
            <span>NO JUDGMENT</span>
            <span>OKAY, SOME JUDGMENT.</span>
          </div>
        </form>
      </section>

      {analytics && showResults && (
        <section
          className="results-section"
          id="results"
          ref={resultsRef}
        >
          <div className="results-heading">
            <div>
              <p className="eyebrow">THE INVESTIGATION IS OVER</p>
              <h2>
                THE <span>VERDICT.</span>
              </h2>
              <p className="results-subtitle">
                We checked the receipts. Here's what we found.
              </p>
            </div>

            <span className="verdict-sticker">CERTIFIED SUSPECT 💀</span>
          </div>

          <div className="date-range">
            <span>YOUR WATCH HISTORY</span>
            <strong>
              {formatDate(analytics.dateRange?.first)} —{" "}
              {formatDate(analytics.dateRange?.last)}
            </strong>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-purple">
              <span className="stat-label">VIDEOS WATCHED</span>
              <strong>{formatNumber(analytics.totalWatched)}</strong>
              <span className="stat-emoji">▶️</span>
            </div>

            <div className="stat-card stat-lime">
              <span className="stat-label">CHANNELS VISITED</span>
              <strong>{formatNumber(analytics.uniqueChannels)}</strong>
              <span className="stat-emoji">📺</span>
            </div>

            <div className="stat-card stat-pink">
              <span className="stat-label">UNIQUE VIDEOS</span>
              <strong>{formatNumber(analytics.uniqueVideos)}</strong>
              <span className="stat-emoji">👀</span>
            </div>
          </div>

          <div className="results-grid">
            <div className="result-card">
              <div className="result-card-header">
                <span>YOUR FAVORITE CHANNELS</span>
                <span>🏆</span>
              </div>

              <h3>THE USUAL SUSPECTS.</h3>

              {(analytics.topChannels ?? []).length > 0 ? (
                <div className="ranking-list">
                  {(analytics.topChannels ?? []).slice(0, 10).map(
                    (channel, index) => (
                      <div className="ranking-row" key={`${channel.name}-${index}`}>
                        <span className="ranking-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="ranking-name">{channel.name}</span>
                        <strong>{formatNumber(channel.count)}</strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="empty-state">No channel data found.</p>
              )}
            </div>

            <div className="result-card">
              <div className="result-card-header">
                <span>THE REPEAT OFFENDERS</span>
                <span>🔁</span>
              </div>

              <h3>YOU WATCHED THAT AGAIN?</h3>

              {(analytics.topVideos ?? []).length > 0 ? (
                <div className="ranking-list">
                  {(analytics.topVideos ?? []).slice(0, 10).map(
                    (video, index) => (
                      <div className="ranking-row video-row" key={`${video.url}-${index}`}>
                        <span className="ranking-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <a
                          className="ranking-name video-link"
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          title={video.title}
                        >
                          {video.title}
                        </a>

                        <strong>{video.count}×</strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="empty-state">No repeat videos found.</p>
              )}
            </div>
          </div>

          <div className="result-card channel-pie-card">
            <div className="result-card-header">
              <span>THE CHANNEL BREAKDOWN</span>
              <span>📊</span>
            </div>

            <h3>WHERE YOUR ATTENTION GOES.</h3>

            {channelSlices.total > 0 ? (
              <div className="pie-chart-layout">
                <div
                  className="channel-pie"
                  style={{ background: channelSlices.gradient }}
                  role="img"
                  aria-label="Pie chart showing watched videos by channel"
                >
                  <div className="pie-chart-hole">
                    <strong>{formatNumber(channelSlices.total)}</strong>
                    <span>WATCHES</span>
                  </div>
                </div>

                <div className="pie-legend">
                  {channelSlices.items.map((item) => (
                    <div className="pie-legend-item" key={item.name}>
                      <span
                        className="pie-dot"
                        style={{ backgroundColor: item.color }}
                      />

                      <span className="pie-channel-name">{item.name}</span>

                      <strong>
                        {Math.round(
                          (item.count / channelSlices.total) * 100
                        )}
                        %
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="empty-state">Not enough channel data for a chart.</p>
            )}
          </div>

          <div className="result-card activity-card">
            <div className="result-card-header">
              <span>WHEN YOU SHOULD BE SLEEPING</span>
              <span>🌙</span>
            </div>

            <h3>YOUR QUESTIONABLE SCHEDULE.</h3>

            <p className="chart-description">
              Videos watched by hour of the day, based on the timestamps in
              your history.
            </p>

            <div className="activity-chart">
              {hourCounts.map((count, hour) => (
                <div className="chart-column" key={hour}>
                  <div className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${Math.max((count / maxHour) * 100, count > 0 ? 3 : 0)}%`,
                      }}
                      title={`${count} videos at ${hour}:00`}
                    />
                  </div>

                  {hour % 3 === 0 && (
                    <span className="chart-hour">
                      {hour.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="chart-axis-labels">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          <div className="ai-roast-card">
            <span className="ai-roast-label">THE AI HAS SPOKEN</span>
            <span className="ai-roast-emoji">🤖</span>

            <h3>YOUR PERSONAL ROAST.</h3>

            <p>
              {analytics.aiRoast ||
                "The AI ran out of money. Even the algorithm needs a break. 💀"}
            </p>
          </div>

          <div className="final-roast">
            <span>THE FINAL VERDICT</span>
            <h2>MAYBE LOG OFF.</h2>
            <p>Respectfully. Actually, no. Disrespectfully. 💀</p>
          </div>
        </section>
      )}

      <footer className="footer">
        <a className="brand footer-brand" href="#">
          roastify<span>.</span>
        </a>

        <p className="footer-note">YOUR WATCH HISTORY. OUR BUSINESS NOW.</p>

        <p className="brand creator">Created by: c1asi</p>
      </footer>
    </main>
  );
}