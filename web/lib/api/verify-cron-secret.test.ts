import { afterEach, describe, expect, it } from "vitest";

import { authorizeCronRequest } from "./verify-cron-secret";

describe("authorizeCronRequest", () => {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("accepts only the configured bearer secret", () => {
    process.env.CRON_SECRET = "test-cron-secret";

    expect(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/complete-meetings", {
          headers: { authorization: "Bearer test-cron-secret" },
        }),
      ),
    ).toBe(true);
    expect(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/complete-meetings", {
          headers: { authorization: "Bearer other" },
        }),
      ),
    ).toBe(false);
  });

  it("rejects requests when the secret is missing", () => {
    delete process.env.CRON_SECRET;

    expect(
      authorizeCronRequest(
        new Request("http://localhost/api/cron/complete-meetings", {
          headers: { authorization: "Bearer test-cron-secret" },
        }),
      ),
    ).toBe(false);
  });
});
