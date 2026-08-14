import { google } from "googleapis";
import { Readable } from "stream";
import { prisma } from "./prisma";

// Configurable environment variables for Google Drive
const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

function getDriveClient() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return null;
  }
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Ensures folder structure exists on Google Drive:
 * Root: Surya Power -> Subfolder: "Quotations" | "Tax Invoices" | "Delivery Challans"
 */
async function getOrCreateFolder(drive: any, folderName: string): Promise<string | null> {
  try {
    // 1. Get or create root folder "Surya Power"
    let rootFolderId: string | null = null;
    const rootSearch = await drive.files.list({
      q: "name = 'Surya Power' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name)",
    });

    if (rootSearch.data.files && rootSearch.data.files.length > 0) {
      rootFolderId = rootSearch.data.files[0].id;
    } else {
      const rootCreate = await drive.files.create({
        requestBody: {
          name: "Surya Power",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      rootFolderId = rootCreate.data.id;
    }

    if (!rootFolderId) return null;

    // 2. Get or create subfolder inside "Surya Power"
    const subSearch = await drive.files.list({
      q: `name = '${folderName}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
    });

    if (subSearch.data.files && subSearch.data.files.length > 0) {
      return subSearch.data.files[0].id;
    }

    const subCreate = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      },
      fields: "id",
    });

    return subCreate.data.id;
  } catch (err) {
    console.error("Google Drive folder creation error:", err);
    return null;
  }
}

export interface UploadResult {
  success: boolean;
  driveFileId?: string;
  driveUrl?: string;
  error?: string;
}

export async function uploadPDFToDrive(
  pdfBuffer: Buffer,
  fileName: string,
  folderName: "Quotations" | "Tax Invoices" | "Delivery Challans",
  entityType: "QUOTATION" | "TAX_INVOICE" | "DELIVERY_CHALLAN",
  entityId: string,
  documentNo: string
): Promise<UploadResult> {
  const drive = getDriveClient();

  if (!drive) {
    // If credentials are missing, store mock/pending record gracefully
    await prisma.driveDocument.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
      update: {
        fileName,
        folderName,
        uploadStatus: "PENDING",
        errorMsg: "Google Drive OAuth credentials not configured in environment.",
      },
      create: {
        entityType,
        entityId,
        documentNo,
        fileName,
        folderName,
        fileSize: pdfBuffer.length,
        uploadStatus: "PENDING",
        errorMsg: "Google Drive OAuth credentials not configured in environment.",
      },
    });

    return {
      success: false,
      error: "Google Drive credentials not set up. Saved locally in database queue.",
    };
  }

  try {
    const parentFolderId = await getOrCreateFolder(drive, folderName);
    const media = {
      mimeType: "application/pdf",
      body: Readable.from(pdfBuffer),
    };

    const fileMetadata: any = {
      name: fileName,
      mimeType: "application/pdf",
    };
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    });

    const driveFileId = response.data.id || undefined;
    const driveUrl = response.data.webViewLink || undefined;

    // Set file permission to anyone with link can view (optional)
    if (driveFileId) {
      try {
        await drive.permissions.create({
          fileId: driveFileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      } catch (e) {
        // Permission set fallback
      }
    }

    // Save/Update drive_documents record in PostgreSQL
    await prisma.driveDocument.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
      update: {
        driveFileId,
        driveUrl,
        fileName,
        folderName,
        fileSize: pdfBuffer.length,
        uploadStatus: "SUCCESS",
        errorMsg: null,
      },
      create: {
        entityType,
        entityId,
        documentNo,
        driveFileId,
        driveUrl,
        fileName,
        folderName,
        fileSize: pdfBuffer.length,
        uploadStatus: "SUCCESS",
      },
    });

    return {
      success: true,
      driveFileId,
      driveUrl,
    };
  } catch (err: any) {
    console.error("Google Drive Upload Error:", err);
    const errorMsg = err.message || "Failed to upload to Google Drive";

    await prisma.driveDocument.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
      update: {
        uploadStatus: "FAILED",
        errorMsg,
      },
      create: {
        entityType,
        entityId,
        documentNo,
        fileName,
        folderName,
        fileSize: pdfBuffer.length,
        uploadStatus: "FAILED",
        errorMsg,
      },
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function deleteFromDrive(driveFileId: string): Promise<boolean> {
  const drive = getDriveClient();
  if (!drive) return false;
  try {
    await drive.files.delete({ fileId: driveFileId });
    return true;
  } catch (err) {
    console.error("Google Drive Delete Error:", err);
    return false;
  }
}
