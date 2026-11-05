
export interface YouTubeVideo {
  title: string;
  url: string;
  channel: string;
  watchedAt: string | null;
}

interface TakeoutRecord {
  header?: string;
  title?: string;
  titleUrl?: string;
  time?: string;
  subtitles?: Array<{
    name?: string;
    url?: string;
  }>;
}

export function parseYouTubeHistory(
  data: unknown
): YouTubeVideo[] {
  if (!Array.isArray(data)) {
    throw new Error(
      "Invalid Takeout file. Expected a JSON array."
    );
  }

  const videos: YouTubeVideo[] = [];

  for (const item of data) {
    if (!item || typeof item !== "object") continue;

    const record = item as TakeoutRecord;

    if (
      typeof record.title !== "string" ||
      typeof record.titleUrl !== "string"
    ) {
      continue;
    }

    // Only accept YouTube video URLs.
    let url: URL;

    try {
      url = new URL(record.titleUrl);
    } catch {
      continue;
    }

    const hostname = url.hostname.toLowerCase();

    if (
      ![
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
        "www.youtu.be",
      ].includes(hostname)
    ) {
      continue;
    }

    // Ignore subscriptions, searches and other activity.
    if (
      !url.pathname.startsWith("/watch") &&
      hostname !== "youtu.be" &&
      hostname !== "www.youtu.be"
    ) {
      continue;
    }

    if (!url.searchParams.has("v") &&
        hostname !== "youtu.be" &&
        hostname !== "www.youtu.be") {
      continue;
    }

    const channel =
      record.subtitles?.find(
        (item) => typeof item.name === "string"
      )?.name || "Unknown channel";

    let watchedAt: string | null = null;

    if (record.time) {
      const date = new Date(record.time);

      if (!Number.isNaN(date.getTime())) {
        watchedAt = date.toISOString();
      }
    }

    videos.push({
      title: record.title.replace(/^Watched\s+/i, ""),
      url: record.titleUrl,
      channel,
      watchedAt,
    });
  }

  return videos;
}

export function generateAnalytics(videos: YouTubeVideo[]) {
  const channelCounts = new Map<string, number>();
  const videoCounts = new Map<
    string,
    { title: string; url: string; count: number }
  >();

  const hourCounts = new Array(24).fill(0);

  for (const video of videos) {
    channelCounts.set(
      video.channel,
      (channelCounts.get(video.channel) || 0) + 1
    );

    const existing = videoCounts.get(video.url);

    if (existing) {
      existing.count++;
    } else {
      videoCounts.set(video.url, {
        title: video.title,
        url: video.url,
        count: 1,
      });
    }

    if (video.watchedAt) {
      const hour = new Date(video.watchedAt).getHours();
      hourCounts[hour]++;
    }
  }

  const topChannels = Array.from(channelCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topVideos = Array.from(videoCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const dates = videos
    .map((video) => video.watchedAt)
    .filter((date): date is string => date !== null)
    .sort();

  return {
    totalWatched: videos.length,
    uniqueChannels: channelCounts.size,
    uniqueVideos: videoCounts.size,
    topChannels,
    topVideos,
    hourCounts,
    dateRange: {
      first: dates[0] || null,
      last: dates[dates.length - 1] || null,
    },
  };
}
