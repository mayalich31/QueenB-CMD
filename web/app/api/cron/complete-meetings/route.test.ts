import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runMeetingCompletionJob: vi.fn(),
}));

vi.mock("@/lib/services/cron-jobs", () => ({
  runMeetingCompletionJob: mocks.runMeetingCompletionJob,
}));

import { GET } from "./route";

describe("complete-meetings cron route", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mocks.runMeetingCompletionJob.mockResolvedValue({
      scanned: 2,
      completed: 1,
    });
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("rejects unauthorized invocations", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/complete-meetings"),
    );

    expect(response.status).toBe(401);
    expect(mocks.runMeetingCompletionJob).not.toHaveBeenCalled();
  });

  it("runs the completion job when authorized", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/complete-meetings", {
        headers: { authorization: "Bearer test-cron-secret" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      scanned: 2,
      completed: 1,
    });
  });
});
