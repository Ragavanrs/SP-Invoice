import { prisma } from "./prisma";

/**
 * Generates next document number based on prefix (QT, INV, DC) and year (e.g. 2026).
 * Format: QT-2026-000001, INV-2026-000001, DC-2026-000001
 */
export async function getNextDocumentNumber(prefix: "QT" | "INV" | "DC"): Promise<string> {
  const currentYear = new Date().getFullYear();

  const seq = await prisma.documentSequence.upsert({
    where: {
      prefix_year: {
        prefix,
        year: currentYear,
      },
    },
    update: {
      currentSeq: {
        increment: 1,
      },
    },
    create: {
      prefix,
      year: currentYear,
      currentSeq: 1,
    },
  });

  const formattedNumber = String(seq.currentSeq).padStart(6, "0");
  return `${prefix}-${currentYear}-${formattedNumber}`;
}
