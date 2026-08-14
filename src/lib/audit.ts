import { prisma } from "./prisma";

export async function logAudit(
  entityName: string,
  entityId: string | null,
  action: "CREATE" | "UPDATE" | "DELETE" | "PDF_GENERATE" | "DRIVE_UPLOAD" | "LOGIN" | "CONVERT",
  performedBy: string,
  userId?: string,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        entityName,
        entityId,
        action,
        performedBy,
        userId,
        details,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
