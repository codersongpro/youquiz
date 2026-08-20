import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createSessionToken, verifyPassword, verifySessionToken } from "./session";

describe("session", () => {
  const originalPassword = process.env.SITE_PASSWORD;

  beforeEach(() => {
    process.env.SITE_PASSWORD = "family-secret";
  });

  afterEach(() => {
    process.env.SITE_PASSWORD = originalPassword;
  });

  it("accepts the configured password and rejects others", async () => {
    expect(await verifyPassword("family-secret")).toBe(true);
    expect(await verifyPassword("wrong")).toBe(false);
  });

  it("issues tokens that verify successfully", async () => {
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });

  it("rejects a missing, malformed, or tampered token", async () => {
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken("garbage")).toBe(false);
    expect(await verifySessionToken(`${await createSessionToken()}x`)).toBe(false);
  });
});
