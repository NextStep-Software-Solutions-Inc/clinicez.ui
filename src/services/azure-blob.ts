"use server";

import sharp from 'sharp';
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, BlobDownloadResponseModel, BlobSASPermissions } from '@azure/storage-blob';

let cachedContainerClient: ContainerClient | null = null;

function getContainerClient() {
  if (cachedContainerClient) return cachedContainerClient;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  if (!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  if (!containerName) throw new Error('AZURE_STORAGE_CONTAINER_NAME is not configured');
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  cachedContainerClient = blobServiceClient.getContainerClient(containerName);
  return cachedContainerClient;
}

// async function listBlobs(): Promise<string[]> {
//   let blobs: string[] = [];
//   let marker = undefined;

//   do {
//     const listBlobsResponse = await containerClient.listBlobsFlat();
//     marker = listBlobsResponse;

//     for (const blob of listBlobsResponse.segment.blobItems) {
//       blobs.push(blob.name);
//     }
//   } while (marker);

//   return blobs;
// }

async function getFile(blobName: string): Promise<Buffer | null> {
  const blobClient = getContainerClient().getBlobClient(blobName);

  try {
    const downloadResponse: BlobDownloadResponseModel = await blobClient.download();
    if (!downloadResponse.readableStreamBody) throw new Error('No readable stream body');
    const buffer = await streamToBuffer(downloadResponse.readableStreamBody);
    return buffer;
  } catch (error) {
    return null;
  }
}

async function compressImage(data: ArrayBuffer, fileType: string): Promise<Buffer> {
  const buf = Buffer.from(data);
  try {
    const instance = sharp(buf);
    if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
      return await instance.jpeg({ quality: 80 }).toBuffer();
    } else if (fileType === 'image/png') {
      return await instance.png({ quality: 80 }).toBuffer();
    } else if (fileType === 'image/webp') {
      return await instance.webp({ quality: 80 }).toBuffer();
    }
  } catch (error) {
    console.error('[IMAGE_COMPRESSION_ERROR]', error);
  }
  return buf;
}

async function uploadFile(blobName: string, data: ArrayBuffer, fileType?: string): Promise<{ url: string }> {
  const blobClient = getContainerClient().getBlockBlobClient(blobName);

  try {
    const uploadData = fileType?.startsWith('image/')
      ? await compressImage(data, fileType)
      : data;

    await blobClient.uploadData(uploadData, {
      blobHTTPHeaders: {
        blobContentType: fileType || 'application/octet-stream' // Replace with the appropriate content type if known
      }
    });
    return { url: blobClient.url };
  } catch (error) {
    console.error('[AZURE_BLOB_UPLOAD_ERROR]', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function deleteFile(blobName: string): Promise<boolean> {
  const blobClient = getContainerClient().getBlobClient(blobName);

  try {
    await blobClient.delete();
    return true;
  } catch (error) {
    return false;
  }
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

/**
 * Generates a short-lived write-only SAS URL for a blob path, enabling the
 * browser to PUT the file directly to Azure Blob Storage (bypassing the
 * Vercel serverless function body-size limit).
 *
 * @param blobPath   - Full blob name including any virtual-directory prefix
 * @param mimeType   - MIME type of the file (used as Content-Type constraint in SAS)
 * @param expiryMins - Lifetime of the SAS token in minutes (default 15)
 * @returns          - `sasUrl`  – URL the browser must PUT to (includes SAS query params)
 *                   - `blobUrl` – Clean URL without SAS (stored in the File DB record)
 */
async function generateUploadSasUrl(
  blobPath: string,
  mimeType: string,
  expiryMins = 15
): Promise<{ sasUrl: string; blobUrl: string }> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  if (!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  if (!containerName) throw new Error('AZURE_STORAGE_CONTAINER_NAME is not configured');

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const blockBlobClient = blobServiceClient
    .getContainerClient(containerName)
    .getBlockBlobClient(blobPath);

  const expiresOn = new Date(Date.now() + expiryMins * 60 * 1000);

  const sasUrl = await blockBlobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse('cw'), // create + write
    expiresOn,
    contentType: mimeType || undefined,
  });

  return { sasUrl, blobUrl: blockBlobClient.url };
}

export {
  // listBlobs, 
  getFile,
  uploadFile,
  deleteFile,
  generateUploadSasUrl,
};
