export type VideoEligibility = {
  privacyStatus: string;
  isLive: boolean;
  durationSeconds: number;
};

const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

export function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }

    return videoId && videoIdPattern.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

export function isSupportedVideo(video: VideoEligibility): boolean {
  return video.privacyStatus === "public" && !video.isLive && video.durationSeconds <= 60 * 60;
}
