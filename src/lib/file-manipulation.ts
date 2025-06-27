import heic2any from "heic2any";

function uniqueFileName(originalName: string) {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${baseName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
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
  const formattedName = uniqueFileName(originalName);
  return new File([blob], formattedName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};

const allowedTypes = [{
  type: "image/jpeg",
  extensions: [".jpg", ".jpeg"],
}, {
  type: "image/png",
  extensions: [".png"],
}, {
  type: "image/gif",
  extensions: [".gif"],
}, {
  type: "application/pdf",
  extensions: [".pdf"],
}, {
  type: "image/x-eps",
  extensions: [".eps"],
}, {
  type: "image/heic",
  extensions: [".heic", ".heif"],
}];

export const validateFileType = (file: File): boolean => {
  const fileExtension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  return allowedTypes.some(({ type, extensions }) => 
    file.type === type && extensions.includes(`.${fileExtension}`)
  );
}
