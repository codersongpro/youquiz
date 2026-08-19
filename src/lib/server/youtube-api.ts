import { extractYouTubeVideoId, isSupportedVideo } from "../youtube";
import type { VideoSummary } from "../types";
import { readServerConfig } from "./env";

type YouTubeItem = {
  id: string | { videoId?: string };
  snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } };
  contentDetails?: { duration?: string };
  status?: { privacyStatus?: string };
  liveStreamingDetails?: unknown;
};

function parseDuration(duration: string): number {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

function toSummary(item: YouTubeItem): VideoSummary | null {
  const id = typeof item.id === "string" ? item.id : item.id.videoId;
  if (!id || !item.snippet || !item.contentDetails || !item.status) return null;
  const durationSeconds = parseDuration(item.contentDetails.duration ?? "");
  if (!isSupportedVideo({ privacyStatus: item.status.privacyStatus ?? "", isLive: Boolean(item.liveStreamingDetails), durationSeconds })) return null;
  return {
    id,
    title: item.snippet.title ?? "Untitled video",
    channelTitle: item.snippet.channelTitle ?? "",
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
    durationSeconds,
    url: `https://www.youtube.com/watch?v=${id}`
  };
}

async function fetchYouTube(path: string, params: URLSearchParams) {
  params.set("key", readServerConfig().YOUTUBE_API_KEY);
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("YOUTUBE_UNAVAILABLE");
  return response.json() as Promise<{ items?: YouTubeItem[] }>;
}

export async function getVideoById(id: string): Promise<VideoSummary | null> {
  const data = await fetchYouTube("videos", new URLSearchParams({ part: "snippet,contentDetails,status,liveStreamingDetails", id }));
  return data.items?.map(toSummary).find((item): item is VideoSummary => item !== null) ?? null;
}

export async function resolveVideoUrl(url: string): Promise<VideoSummary | null> {
  const id = extractYouTubeVideoId(url);
  return id ? getVideoById(id) : null;
}

export async function searchVideos(query: string): Promise<VideoSummary[]> {
  const search = await fetchYouTube("search", new URLSearchParams({ part: "snippet", type: "video", maxResults: "10", q: query, safeSearch: "strict" }));
  const ids = search.items?.map((item) => typeof item.id === "string" ? item.id : item.id.videoId).filter((id): id is string => Boolean(id)) ?? [];
  if (ids.length === 0) return [];
  const data = await fetchYouTube("videos", new URLSearchParams({ part: "snippet,contentDetails,status,liveStreamingDetails", id: ids.join(",") }));
  return data.items?.map(toSummary).filter((item): item is VideoSummary => item !== null) ?? [];
}
