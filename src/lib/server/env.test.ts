import { describe, expect, it } from "vitest";

import { parseAllowedEmails } from "./env";

describe("parseAllowedEmails", () => {
  it("lowercases and trims a comma-separated list", () => {
    expect(parseAllowedEmails(" Alice@Example.com, bob@example.com ")).toEqual(
      new Set(["alice@example.com", "bob@example.com"])
    );
  });

  it("returns an empty set when unset or blank", () => {
    expect(parseAllowedEmails(undefined)).toEqual(new Set());
    expect(parseAllowedEmails("")).toEqual(new Set());
    expect(parseAllowedEmails(" , , ")).toEqual(new Set());
  });
});
