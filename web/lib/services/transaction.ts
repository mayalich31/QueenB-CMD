import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_TRANSACTION_ATTEMPTS = 3;

function isWriteConflict(error: unknown): error is { code: "P2034" } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export async function runSerializableTransaction<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (!isWriteConflict(error) || attempt === MAX_TRANSACTION_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error("Serializable transaction retry limit reached.");
}
