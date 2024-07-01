"use server";

import { BlobServiceClient, StorageSharedKeyCredential, BlobDownloadResponseModel } from '@azure/storage-blob';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME!;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

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
  const blobClient = containerClient.getBlobClient(blobName);

  try {
    const downloadResponse: BlobDownloadResponseModel = await blobClient.download();
    if(!downloadResponse.readableStreamBody) throw new Error('No readable stream body');
    const buffer = await streamToBuffer(downloadResponse.readableStreamBody);
    return buffer;
  } catch (error) {
    return null;
  }
}

async function uploadFile(blobName: string, data: ArrayBuffer, fileType?: string): Promise<{url: string}> {
  const blobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blobClient.uploadData(data, {
      blobHTTPHeaders: {
        blobContentType: fileType || 'application/octet-stream' // Replace with the appropriate content type if known
      }
    });
    return {url: blobClient.url};
  } catch (error) {
    return {url: ''};
  }
}

async function deleteFile(blobName: string): Promise<boolean> {
  const blobClient = containerClient.getBlobClient(blobName);

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

export { 
  // listBlobs, 
  getFile, 
  uploadFile, 
  deleteFile 
};