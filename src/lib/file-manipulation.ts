import heic2any from "heic2any";

function uniqueFileName(originalName: string, newExtension = "jpg") {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${baseName.replace(/\s+/g, '_')}_${Date.now()}.${newExtension}`;
}

export const renameFile = (file: File): File => {
  const formattedName = uniqueFileName(file.name);
  return new File([file], formattedName, {
    type: file.type,
    lastModified: file.lastModified,
  });
};

export const heic2Jpeg = async (image: File): Promise<File> => {
  const blob = await heic2any({
    blob: image,
    toType: "image/jpeg",
    quality: 0.8,
  }) as Blob;

  return formatFileName(blob, image.name);
};

export const formatFileName = (blob: Blob, originalName: string): File => {
  const formattedName = uniqueFileName(originalName, "jpg");
  return new File([blob], formattedName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};

