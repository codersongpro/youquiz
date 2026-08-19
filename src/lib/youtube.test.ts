import { describe, expect, it } from "vitest";

import { extractYouTubeVideoId, isSupportedVideo } from "./youtube";

describe("extractYouTubeVideoId", () => {
  it("extracts an ID from a watch URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts an ID from a short URL", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("dQw4w9WgXcQ");
  });

  it("rejects unrelated URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});

describe("isSupportedVideo", () => {
  it("accepts public videos up to sixty minutes", () => {
    expect(isSupportedVideo({ privacyStatus: "public", isLive: false, durationSeconds: 3600 })).toBe(true);
  });

  it("rejects private, live, and long videos", () => {
    expect(isSupportedVideo({ privacyStatus: "private", isLive: false, durationSeconds: 60 })).toBe(false);
    expect(isSupportedVideo({ privacyStatus: "public", isLive: true, durationSeconds: 60 })).toBe(false);
    expect(isSupportedVideo({ privacyStatus: "public", isLive: false, durationSeconds: 3601 })).toBe(false);
  });
});
