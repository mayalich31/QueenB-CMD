import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

import { runSerializableTransaction } from "./transaction";

describe("runSerializableTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retries PostgreSQL write conflicts with serializable isolation", async () => {
    transactionMock
      .mockRejectedValueOnce({ code: "P2034" })
      .mockResolvedValueOnce("saved");
    const operation = vi.fn();

    await expect(runSerializableTransaction(operation)).resolves.toBe("saved");
    expect(transactionMock).toHaveBeenCalledTimes(2);
    expect(transactionMock).toHaveBeenLastCalledWith(operation, {
      isolationLevel: "Serializable",
    });
  });

  it("does not retry unrelated failures", async () => {
    const failure = new Error("Database unavailable");
    transactionMock.mockRejectedValueOnce(failure);

    await expect(runSerializableTransaction(vi.fn())).rejects.toBe(failure);
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });
});
