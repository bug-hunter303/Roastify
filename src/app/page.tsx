
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Analytics = {
  totalWatched?: number;
  uniqueChannels?: number;
  uniqueVideos?: number;
  topChannels?: unknown[];
  topVideos?: unknown[];
  hourCounts?: unknown[] | Record<string, number>;

  dateRange?: {
    first: string | null;
    last: string | null;
  };

  aiRoast?: string;
};

const loadingMessages = [
  "Scanning your questionable taste... 💀",
  "Finding your 3 AM YouTube rabbit holes... 🌙",
  "Calculating your brainrot percentage... 🧠",
  "Your algorithm needs therapy... 😭",
  "Investigating your suspicious subscriptions... 🔍",
  "Counting how many times you ignored your responsibilities... 💀",
  "Preparing emotional damage... 💔",
  "Consulting the council of unemployed YouTube experts... 🫡",
  "We need a moment. This history is concerning... 💀",
  "Finalizing your public humiliation... 🔥",
];

function getText(item: unknown, keys: string[], fallback: string) {
  if (typeof item === "string") return item;

  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;

    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return String(obj[key]);
      }
    }
  }

  return fallback;
}

function getCount(item: unknown) {
  if (typeof item === "number") return item;

  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;

    for (const key of ["count", "views", "watchCount", "total"]) {
      const value = Number(obj[key]);

      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function Home() {
  // Refs
  const fileInput = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  // Main state
  const [file, setFile] = useState<File | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  // Loading and results flow
  const [loading, setLoading] = useState(false);
  const [readyToViewResults, setReadyToViewResults] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotate loading messages every 2.5 seconds.
  useEffect(() => {
    if (!loading) return;

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((previous) =>
        (previous + 1) % loadingMessages.length
      );
    }, 2500);

    return () => window.clearInterval(interval);
  }, [loading]);

  // Scroll to results only after the user clicks the results button.
  useEffect(() => {
    if (!showResults) return;

    const timeout = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [showResults]);

  // Upload and process the YouTube history.
  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      setError("You haven't selected a file yet. 💀");
      return;
    }

    setError("");
    setAnalytics(null);
    setShowResults(false);
    setReadyToViewResults(false);
    setLoadingMessageIndex(0);
    setLoading(true);

    const startedAt = Date.now();

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

      // Keep loading visible for at least 30 seconds.
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 30000 - elapsed);

      if (remaining > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, remaining);
        });
      }

      // Save the returned analytics and AI roast.
      setAnalytics({
        ...(result.analytics ?? result),
        aiRoast: result.roast ?? "",
      });

      // Replace loading with the results-ready button.
      setLoading(false);
      setReadyToViewResults(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again."
      );

      setLoading(false);
    }
  }

  // Reveal results when the user clicks the button.
  function handleViewResults() {
    setReadyToViewResults(false);
    setShowResults(true);
  }

  // Analytics data.
  const channels = analytics?.topChannels ?? [];
  const videos = analytics?.topVideos ?? [];

  const hours = Array.from({ length: 24 }, (_, index) => {
    const data = analytics?.hourCounts;

    if (Array.isArray(data)) {
      const item = data[index];

      return typeof item === "number" ? item : getCount(item);
    }

    if (data && typeof data === "object") {
      return Number(data[String(index)] ?? 0);
    }

    return 0;
  });

  const maxHour = Math.max(...hours, 1);

  return (
    <main className="site-shell">
      <div className="background-doodle doodle-one">✳</div>
      <div className="background-doodle doodle-two">✦</div>
      <div className="background-doodle doodle-three">?</div>

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-icon">R</span>
          roastify<span className="brand-dot">.</span>
        </a>

        <span className="nav-label">
          YOUR HISTORY IS NOT SAFE HERE
          <span className="nav-dot">●</span>
        </span>

        <a href="#upload" className="nav-button">
          GET ROASTED <span>↗</span>
        </a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-sticker sticker-left">
          100% JUDGMENT
        </div>

        <div className="hero-sticker sticker-right">
          NO MERCY 💀
        </div>

        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          THE MOST UNNECESSARY YOUTUBE TOOL
        </div>

        <h1>
          YOUR YOUTUBE
          <br />
          HISTORY IS
          <br />
          <span className="hero-highlight">EMBARRASSING.</span>
        </h1>

        <div className="hero-bottom">
          <p>
            You've watched some questionable stuff.
            <br />
            We found it. We're judging it.
          </p>

          <a href="#upload" className="hero-cta">
            EXPOSE ME <span>↓</span>
          </a>
        </div>

        <div className="hero-emoji">😭</div>
      </section>

      {/* UPLOAD SECTION */}
      <section className="upload-section" id="upload">
        <div className="section-topline">
          <span>01 / THE EVIDENCE</span>
          <span>WE PROMISE NOT TO TELL (MAYBE)</span>
        </div>

        <div className="upload-card">
          <div className="upload-decoration upload-star">✳</div>
          <div className="upload-decoration upload-spark">✦</div>

          <div className="upload-content">

            {/* STATE 1: FILE UPLOAD FORM */}
            {!loading && !readyToViewResults && (
              <>
                <div className="upload-emoji">📂</div>

                <h2>
                  DROP THE
                  <br />
                  <span>RECEIPTS.</span>
                </h2>

                <p className="upload-description">
                  Upload your YouTube watch history and prepare
                  <br className="desktop-break" />
                  to question your life decisions.
                </p>

                <form onSubmit={handleUpload}>
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".json,application/json"
                    className="hidden-input"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      setError("");
                      setAnalytics(null);
                      setShowResults(false);
                      setReadyToViewResults(false);
                    }}
                  />

                  <button
                    type="button"
                    className="choose-button"
                    onClick={() => fileInput.current?.click()}
                  >
                    {file ? "CHANGE FILE ↗" : "CHOOSE YOUR FILE ↗"}
                  </button>

                  <p className="takeout-help">
                    Don't have your data? Get it from{" "}
                    <a
                      href="https://takeout.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Takeout ↗
                    </a>
                  </p>

                  <p className="file-hint">
                    {file
                      ? `SELECTED: ${file.name}`
                      : "JSON FILE ONLY · YOUR WATCH HISTORY"}
                  </p>

                  {file && (
                    <button
                      type="submit"
                      className="analyze-button"
                    >
                      ROAST MY HISTORY 💀
                    </button>
                  )}
                </form>

                {error && (
                  <p className="error-message">
                    {error}
                  </p>
                )}
              </>
            )}

            {/* STATE 2: LOADING IN THE UPLOAD CARD */}
            {loading && (
              <div className="loading-card" aria-live="polite">
                <div className="loading-sticker">
                  UNDER INVESTIGATION
                </div>

                <div className="loading-skull">💀</div>

                <p className="loading-kicker">
                  ROASTIFY IS INVESTIGATING
                </p>

                <h2 className="loading-title">
                  YOUR TASTE
                  <br />
                  IS ON TRIAL.
                </h2>

                <p
                  className="loading-message"
                  key={loadingMessageIndex}
                >
                  {loadingMessages[loadingMessageIndex]}
                </p>

                <div className="loading-progress">
                  <div className="loading-progress-bar" />
                </div>

                <p className="loading-footnote">
                  PLEASE REMAIN HUMILIATED.
                </p>
              </div>
            )}

            {/* STATE 3: RESULTS READY */}
            {readyToViewResults && (
              <div className="results-ready">
                <div className="loading-skull">🔥</div>

                <p className="loading-kicker">
                  THE INVESTIGATION IS COMPLETE
                </p>

                <h2>
                  YOUR VERDICT
                  <br />
                  IS READY.
                </h2>

                <p>
                  We've seen enough. Are you ready to face the consequences?
                </p>

                <button
                  type="button"
                  className="analyze-button"
                  onClick={handleViewResults}
                >
                  SEE MY RESULTS ↓
                </button>
              </div>
            )}

          </div>

          <div className="upload-footer">
            <span>YOUR DATA IS USED TO GENERATE YOUR ROAST.</span>
            <span>WE'RE JUST HERE TO JUDGE.</span>
          </div>
        </div>
      </section>

      {/* RESULTS: HIDDEN UNTIL USER CLICKS SEE MY RESULTS */}
      {analytics && showResults && (
        <section
          className="results-section"
          id="results"
          ref={resultsRef}
        >
          <div className="section-topline">
            <span>02 / THE DAMAGE REPORT</span>
            <span>IT'S WORSE THAN WE THOUGHT</span>
          </div>

          <div className="results-heading">
            <h2>
              THE
              <br />
              <span>VERDICT.</span>
            </h2>

            <div className="verdict-sticker">
              CERTIFIED
              <br />
              SUSPECT 💀
            </div>
          </div>

          {/* STATISTICS */}
          <div className="stats-grid">
            <div className="stat-card stat-purple">
              <span className="stat-label">VIDEOS WATCHED</span>

              <strong>
                {formatNumber(analytics.totalWatched)}
              </strong>

              <span className="stat-caption">
                touch grass maybe?
              </span>

              <span className="stat-decoration">▶</span>
            </div>

            <div className="stat-card stat-lime">
              <span className="stat-label">CHANNELS VISITED</span>

              <strong>
                {formatNumber(analytics.uniqueChannels)}
              </strong>

              <span className="stat-caption">
                many personalities detected
              </span>

              <span className="stat-decoration">✳</span>
            </div>

            <div className="stat-card stat-pink">
              <span className="stat-label">UNIQUE VIDEOS</span>

              <strong>
                {formatNumber(analytics.uniqueVideos)}
              </strong>

              <span className="stat-caption">
                the rabbit hole is real
              </span>

              <span className="stat-decoration">?</span>
            </div>
          </div>

          {/* CHANNELS AND VIDEOS */}
          <div className="results-grid">
            <div className="result-card">
              <div className="result-card-heading">
                <span>YOUR FAVORITE CHANNELS</span>
                <span>🏆</span>
              </div>

              {channels.length > 0 ? (
                <div className="ranking-list">
                  {channels.slice(0, 5).map((item, index) => (
                    <div className="ranking-row" key={index}>
                      <span className="rank-number">
                        0{index + 1}
                      </span>

                      <span className="rank-name">
                        {getText(
                          item,
                          ["channel", "name", "title", "channelTitle"],
                          "Unknown channel"
                        )}
                      </span>

                      <span className="rank-count">
                        {formatNumber(getCount(item))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">
                  No channel data found. 🤷
                </p>
              )}
            </div>

            <div className="result-card">
              <div className="result-card-heading">
                <span>THE REPEAT OFFENDERS</span>
                <span>🔁</span>
              </div>

              {videos.length > 0 ? (
                <div className="ranking-list">
                  {videos.slice(0, 5).map((item, index) => (
                    <div className="ranking-row" key={index}>
                      <span className="rank-number">
                        0{index + 1}
                      </span>

                      <span className="rank-name">
                        {getText(
                          item,
                          ["title", "videoTitle", "name"],
                          "Unknown video"
                        )}
                      </span>

                      <span className="rank-count">
                        {formatNumber(getCount(item))}×
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">
                  No repeat offenders found. 👀
                </p>
              )}
            </div>
          </div>

          {/* WATCHING ACTIVITY */}
          <div className="activity-card">
            <div className="result-card-heading">
              <span>WHEN YOU SHOULD BE SLEEPING</span>
              <span>🌙</span>
            </div>

            <p className="activity-description">
              Your YouTube activity throughout the day.
            </p>

            <div className="activity-chart">
              {hours.map((value, index) => (
                <div className="chart-column" key={index}>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max(
                        (value / maxHour) * 100,
                        3
                      )}%`,
                    }}
                    title={`${index}:00 — ${value} views`}
                  />

                  {index % 3 === 0 && (
                    <span className="chart-label">
                      {String(index).padStart(2, "0")}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="chart-caption">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* AI ROAST */}
          <div className="ai-roast-card">
            <div className="ai-roast-heading">
              <span>03 / THE AI HAS SPOKEN</span>
              <span>🤖💀</span>
            </div>

            <h2>
              YOUR PERSONAL
              <br />
              <span>ROAST.</span>
            </h2>

            <p className="ai-roast-text">
              {analytics.aiRoast ||
                "The AI couldn't prepare your roast. Even the algorithm needs a break. 💀"}
            </p>

            <div className="ai-roast-footer">
              GENERATED BY AI · ZERO MERCY
            </div>
          </div>

          {/* FINAL ROAST */}
          <div className="final-roast">
            <span>THE FINAL MESSAGE</span>

            <h2>
              MAYBE
              <br />
              <span>LOG OFF.</span>
            </h2>

            <div className="final-emoji">🫵😭</div>

            <p>
              Respectfully, your algorithm knows too much.
            </p>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <a href="#" className="brand footer-brand">
          <span className="brand-icon">R</span>
          roastify<span className="brand-dot">.</span>
        </a>

        <p className="brand creator">
          Created by: c1asi
        </p>

        <span className="footer-copy">
          © 2026 ROASTIFY · NO JUDGMENT. OKAY, SOME.
        </span>
      </footer>
    </main>
  );
}
