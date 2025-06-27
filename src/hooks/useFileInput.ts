import { validateFileType } from "@/lib/file-manipulation";

export function useFileInput({
  onValidFile,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
}: {
  onValidFile: (file: File) => void;
  onError: (message: string) => void;
  maxSize?: number;
}) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onError("No file selected.");
      return;
    }

    if (!validateFileType(file)) {
      onError("Invalid file type.");
      return;
    }

    if (file.size > maxSize) {
      onError("File size exceeds 10MB.");
      return;
    }

    onValidFile(file);
  };
}
