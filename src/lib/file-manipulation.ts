export function formatFileName(formData: FormData) {
  const file = formData.get("media") as File || null;

  if (file) {
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));

    const formattedName = `${baseName.replace(/\s+/g, '_')}_${Date.now()}.${extension}`;

    const renamedFile = new File([file], formattedName, {
      type: file.type,
      lastModified: file.lastModified
    });

    formData.set("media", renamedFile);
  } else {
    console.warn("No file found in FormData under key 'media'");
  }
}
