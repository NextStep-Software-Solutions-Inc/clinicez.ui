"use server";

import { uploadFile } from "@services/azure-blob";
import { getCachedSession } from "@actions/session.action";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.png', '.jpeg', '.jpg'];

export const uploadSignatureAction = async (formData: FormData) => {
  // Check authentication
  const session = await getCachedSession();
  if (!session) {
    throw new Error("Unauthorized: You must be logged in to upload a signature");
  }

  const media = formData.get("media") as File;
  const directory = formData.get("directory") as string;

  if (!media) {
    throw new Error("No file provided");
  }

  if (!directory) {
    throw new Error("Directory path is required");
  }

  // Validate file size (5MB limit)
  const sizeInMB = media.size / 1024 / 1024;
  if (sizeInMB > MAX_FILE_SIZE_MB) {
    throw new Error(`File size must be ${MAX_FILE_SIZE_MB}MB or less. Current size: ${sizeInMB.toFixed(2)}MB`);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(media.type)) {
    throw new Error("Only PNG, JPEG, and JPG files are allowed");
  }

  // Validate file extension
  const fileExtension = media.name.toLowerCase().match(/\.[^.]*$/)?.[0];
  if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error("File must have .png, .jpeg, or .jpg extension");
  }

  // Additional validation: Check if file is actually an image
  const buffer = await media.arrayBuffer();

  // Basic magic number validation
  const uint8Array = new Uint8Array(buffer.slice(0, 8));
  const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47;
  const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF;

  if (!isPNG && !isJPEG) {
    throw new Error("File does not appear to be a valid PNG or JPEG image");
  }

  // Create filepath with timestamp to avoid collisions
  const timestamp = Date.now();
  const sanitizedFilename = media.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filepath = `${directory}/${timestamp}-${sanitizedFilename}`;

  try {
    // Upload to Azure blob storage
    const data = await uploadFile(filepath, buffer, media.type);

    if (!data.url) {
      throw new Error("Upload failed: No URL returned from storage service");
    }

    return data;
  } catch (error) {
    console.error("Signature upload error:", error);
    throw new Error("Failed to upload signature. Please try again.");
  }
};