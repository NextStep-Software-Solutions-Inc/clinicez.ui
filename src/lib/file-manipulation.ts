import heic2any from "heic2any";
import { compressImageAsync } from "./image-compression";

function uniqueFileName(originalName: string, newExtension = "jpg") {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${baseName.replace(/\s+/g, '_')}_${Date.now()}.${newExtension}`;
}

export const renameFile = async (file: File): Promise<File> => {
  const compressed = await compressImageAsync(file);
  const formattedName = uniqueFileName(file.name);
  return new File([compressed], formattedName, {
    type: compressed.type,
    lastModified: Date.now(),
  });
};

export const heic2Jpeg = async (image: File): Promise<File> => {
  const blob = await heic2any({
    blob: image,
    toType: "image/jpeg",
    quality: 0.8,
  }) as Blob;

  const compressedFile = await compressImageAsync(formatFileName(blob, image.name));
  return compressedFile;
};

export const formatFileName = (blob: Blob, originalName: string): File => {
  const formattedName = uniqueFileName(originalName, "jpg");
  return new File([blob], formattedName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};

