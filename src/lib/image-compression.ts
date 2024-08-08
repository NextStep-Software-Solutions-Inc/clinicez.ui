"use client";

import imageCompression from "browser-image-compression";

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};

export const compressImageAsync = async (file: File) => {
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Failed to compress image", error);
    return file;
  }
}