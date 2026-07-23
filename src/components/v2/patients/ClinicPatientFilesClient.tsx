"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ClinicPatientPageHeader } from "./ClinicPatientPageHeader";
import {
  Folder,
  FolderOpen,
  File,
  Upload,
  Plus,
  Lock,
  Globe,
  Building2,
  MoreVertical,
  Trash2,
  Edit,
  X,
  ChevronRight,
  ArrowLeft,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FilePrivacy } from "@prisma/client";
import { ThemeToggle } from "@/components/patient-dashboard-v2/ThemeToggle";
import type { GetPatientFolders, PatientFolder } from "@/actions/patient/patient-files.action";
import {
  createFolderForPatientAction,
  generateClinicPatientUploadSasAction,
  registerClinicPatientFileUploadAction,
  deletePatientFolderAction,
  deletePatientFileAction,
  renamePatientFolderAction,
  renamePatientFileAction,
} from "@/actions/patient/patient-files.action";
import { heic2Jpeg, isHeicFile, PATIENT_FILE_ACCEPT } from "@/lib/file-manipulation";
import { compressImageAsync } from "@/lib/image-compression";

type FileType = { id: number; name: string };

interface ClinicPatientFilesClientProps {
  clinicUid: string;
  clinicId: number;
  patientId: number;
  patientName: string;
  patientPicture?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  patientBloodType?: string | null;
  patientCaseNumber?: string | null;
  initialFolders: NonNullable<GetPatientFolders["data"]>;
  fileTypes: FileType[];
  currentUserId: number;
}

const PRIVACY_ICONS: Record<FilePrivacy, React.ReactNode> = {
  PRIVATE: <Lock className="w-3 h-3" />,
  CLINIC: <Building2 className="w-3 h-3" />,
  PUBLIC: <Globe className="w-3 h-3" />,
};

const PRIVACY_LABELS: Record<FilePrivacy, string> = {
  PRIVATE: "Private",
  CLINIC: "Clinic",
  PUBLIC: "Public",
};

const PRIVACY_COLORS: Record<FilePrivacy, string> = {
  PRIVATE: "bg-slate-100/70 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300",
  CLINIC: "bg-blue-100/70 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  PUBLIC: "bg-green-100/70 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBloodType(bt: string): string {
  return bt.replace("_POSITIVE", "+").replace("_NEGATIVE", "-").replace(/_/g, "");
}

function formatGender(g: string): string {
  return g.charAt(0) + g.slice(1).toLowerCase();
}

export function ClinicPatientFilesClient({
  clinicUid,
  clinicId,
  patientId,
  patientName,
  patientPicture,
  patientAge,
  patientGender,
  patientBloodType,
  patientCaseNumber,
  initialFolders,
  fileTypes,
  currentUserId: _currentUserId,
}: ClinicPatientFilesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [folders, setFolders] = useState(initialFolders);

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const fId = params.get('folderId')
      return fId ? parseInt(fId, 10) : null
    }
    return null
  })

  const selectedFolder = useMemo(() => {
    if (selectedFolderId === null) return null
    return folders.find((f) => f.id === selectedFolderId) || null
  }, [folders, selectedFolderId])

  const setSelectedFolder = (folder: PatientFolder | null) => {
    const folderId = folder ? folder.id : null
    setSelectedFolderId(folderId)
    const params = new URLSearchParams(window.location.search)
    if (folderId !== null) {
      params.set('folderId', String(folderId))
    } else {
      params.delete('folderId')
    }
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`)
  }

  // Listen to popstate event (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const fId = params.get('folderId')
      setSelectedFolderId(fId ? parseInt(fId, 10) : null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const [isPending, startTransition] = useTransition();

  // Create folder dialog
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Rename folder dialog
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<PatientFolder | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");

  // Rename file dialog
  const [showRenameFile, setShowRenameFile] = useState(false);
  const [renameFileTarget, setRenameFileTarget] = useState<PatientFolder["Files"][number] | null>(null);
  const [renameFileName, setRenameFileName] = useState("");

  // Upload dialog
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFileTypeId, setUploadFileTypeId] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isConvertingFile, setIsConvertingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (isHeicFile(file)) {
      setIsConvertingFile(true);
      try {
        const converted = await heic2Jpeg(file);
        setUploadFile(converted);
      } catch {
        toast.error("Could not convert HEIC image — please convert it to JPEG or PNG first and try again.");
      } finally {
        setIsConvertingFile(false);
      }
    } else {
      setUploadFile(file);
    }
  };

  const refreshFolders = () => {
    startTransition(async () => {
      const { getPatientFilesForClinicAction } = await import(
        "@/actions/patient/patient-files.action"
      );
      const result = await getPatientFilesForClinicAction({ patientId, clinicUid });
      if (result.status && result.data) setFolders(result.data);
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    startTransition(async () => {
      const result = await createFolderForPatientAction({
        patientId,
        clinicUid,
        name: newFolderName,
      });
      if (result.status && result.data) {
        // Refresh to get the full folder structure with correct filter
        refreshFolders();
        setShowCreateFolder(false);
        setNewFolderName("");
        toast.success("Folder created");
      } else {
        toast.error(result.message || "Failed to create folder");
      }
    });
  };

  const handleRenameFolder = () => {
    if (!renameFolderTarget || !renameFolderName.trim()) return;
    startTransition(async () => {
      const result = await renamePatientFolderAction({
        folderId: renameFolderTarget.id,
        name: renameFolderName,
      });
      if (result.status) {
        refreshFolders();
        setShowRenameFolder(false);
        toast.success("Folder renamed");
      } else {
        toast.error(result.message || "Failed to rename folder");
      }
    });
  };

  const handleRenameFile = () => {
    if (!renameFileTarget || !renameFileName.trim()) return;
    startTransition(async () => {
      const result = await renamePatientFileAction({
        fileId: renameFileTarget.id,
        name: renameFileName,
      });
      if (result.status) {
        refreshFolders();
        setShowRenameFile(false);
        toast.success("File renamed");
      } else {
        toast.error(result.message || "Failed to rename file");
      }
    });
  };

  const handleDeleteFolder = (folder: PatientFolder) => {
    startTransition(async () => {
      const result = await deletePatientFolderAction({ folderId: folder.id });
      if (result.status) {
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
        if (selectedFolder?.id === folder.id) setSelectedFolder(null);
        toast.success("Folder deleted");
      } else {
        toast.error(result.message || "Failed to delete folder");
      }
    });
  };

  const handleDeleteFile = (file: PatientFolder["Files"][number]) => {
    startTransition(async () => {
      const result = await deletePatientFileAction({ fileId: file.id });
      if (result.status) {
        refreshFolders();
        toast.success("File deleted");
      } else {
        toast.error(result.message || "Failed to delete file");
      }
    });
  };

  const handleUploadFile = () => {
    if (!uploadFile || !uploadFileTypeId || !selectedFolder) return;
    startTransition(async () => {
      let fileToUpload = uploadFile;
      if (fileToUpload.type.startsWith("image/")) {
        fileToUpload = await compressImageAsync(fileToUpload);
      }

      const sasResult = await generateClinicPatientUploadSasAction({
        patientId,
        clinicUid,
        folderId: selectedFolder.id,
        fileName: fileToUpload.name,
        mimeType: fileToUpload.type || "application/octet-stream",
        size: fileToUpload.size,
        fileTypeId: Number(uploadFileTypeId),
      });
      if (!sasResult.status || !sasResult.data) {
        toast.error(sasResult.message || "Failed to prepare upload");
        return;
      }
      const { sasUrl, blobUrl } = sasResult.data;
      const putRes = await fetch(sasUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": fileToUpload.type || "application/octet-stream",
        },
        body: fileToUpload,
      });
      if (!putRes.ok) {
        toast.error(`Failed to upload file to storage (status: ${putRes.status})`);
        return;
      }
      const result = await registerClinicPatientFileUploadAction({
        patientId,
        clinicUid,
        folderId: selectedFolder.id,
        fileTypeId: Number(uploadFileTypeId),
        fileName: fileToUpload.name,
        mimeType: fileToUpload.type || "application/octet-stream",
        size: fileToUpload.size,
        blobUrl,
      });
      if (result.status && result.data) {
        refreshFolders();
        setShowUpload(false);
        setUploadFile(null);
        setUploadFileTypeId("");
        toast.success("File uploaded successfully");
      } else {
        toast.error(result.message || "Failed to upload file");
      }
    });
  };

  const currentFolderFiles = selectedFolder
    ? folders.find((f) => f.id === selectedFolder.id)?.Files ?? []
    : [];

  const backHref = selectedFolder
    ? `/v2/clinic/${clinicUid}/patients/${patientId}/files`
    : `/v2/clinic/${clinicUid}/patients/${patientId}`;

  return (
    <div className="relative min-h-screen">
      {/* Glassmorphic ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-72 w-72 rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-80 w-80 rounded-full bg-teal-400/15 dark:bg-teal-500/10 blur-3xl" />
      </div>

      {/* Patient Context Card */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-4">
        <div className="glassmorphic-card px-4 py-3 flex items-center gap-3 sm:gap-4">
          <Link
            href={backHref}
            onClick={(e) => {
              if (selectedFolder) {
                e.preventDefault();
                const params = new URLSearchParams(window.location.search);
                params.delete("folderId");
                window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
                window.dispatchEvent(new Event("popstate"));
              }
            }}
            className="group flex items-center justify-center w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-xs transition-all duration-200 shrink-0"
            title={selectedFolder ? "Back to Folders" : "Back to Patient Profile"}
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </Link>

          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden shadow-xs">
            {patientPicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patientPicture} alt={patientName} className="w-full h-full object-cover" />
            ) : (
              patientName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white truncate">{patientName}</span>
              {patientCaseNumber && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  #{patientCaseNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {patientAge != null && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {patientAge} yrs
                </span>
              )}
              {patientGender && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {formatGender(patientGender)}
                </span>
              )}
              {patientBloodType && (
                <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full font-medium">
                  {formatBloodType(patientBloodType)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header Action Row */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {selectedFolder ? selectedFolder.name : "Shared Folders"}
          </h2>
          <div>
            {!selectedFolder ? (
              <Button
                size="sm"
                onClick={() => setShowCreateFolder(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs md:text-sm font-semibold rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>New Folder</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowUpload(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs md:text-sm font-semibold rounded-xl"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </Button>
            )}
          </div>
        </div>

        {/* Folder view */}
        {!selectedFolder && (
          <div>
            {folders.length === 0 ? (
              <div className="glassmorphic-card p-10 text-center">
                <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No folders shared with your clinic</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  You can create a new folder here — it will be automatically shared with your clinic.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {folders.map((folder) => {
                  const privacy =
                    (folder.FolderSetting?.privacy as FilePrivacy | undefined) ?? "PRIVATE";
                  const fileCount = folder.Files.length;
                  // Only show creator info if the folder was made by a provider (not the patient owner)
                  const isProviderCreated = folder.createdByUserId !== null && folder.createdByUserId !== folder.userId;
                  const creatorName = isProviderCreated && folder.CreatedByUser
                    ? [folder.CreatedByUser.firstName, folder.CreatedByUser.lastName].filter(Boolean).join(" ")
                    : null;
                  const creatorClinic = isProviderCreated
                    ? folder.FolderSetting?.FolderClinicShares?.map((s) => s.Clinic.name).join(", ") ?? null
                    : null;
                  // Only allow manage actions if this clinic created the folder
                  const isCreatedByThisClinic = folder.FolderSetting?.scopeClinicId === clinicId;
                  return (
                    <div
                      key={folder.id}
                      className="glassmorphic-card p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200 group"
                      onClick={() => setSelectedFolder(folder)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedFolder(folder)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <Folder className="w-5 h-5 text-white" />
                          </div>
                          {creatorName && (
                            <div
                              title={`${creatorClinic ? `Created by ${creatorClinic}` : "Provider created"} · ${creatorName}`}
                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center cursor-help"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <UserCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant="secondary"
                            className={`text-xs flex items-center gap-1 ${PRIVACY_COLORS[privacy]}`}
                          >
                            {PRIVACY_ICONS[privacy]}
                            <span className="hidden sm:inline">{PRIVACY_LABELS[privacy]}</span>
                          </Badge>
                          {isCreatedByThisClinic && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenameFolderTarget(folder);
                                    setRenameFolderName(folder.name);
                                    setShowRenameFolder(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => handleDeleteFolder(folder)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white truncate mb-1">
                        {folder.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {fileCount} file{fileCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Files inside folder */}
        {selectedFolder && (
          <div>
            {/* Folder title is already rendered in the main actions header */}
            {currentFolderFiles.length === 0 ? (
              <div className="glassmorphic-card p-10 text-center">
                <File className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No files shared with your clinic</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Upload a file to this folder — it will be automatically shared with your clinic.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {currentFolderFiles.map((file) => {
                  const privacy =
                    (file.FileSetting?.privacy as FilePrivacy | undefined) ?? "PRIVATE";
                  // Only show creator info if the file was uploaded by a provider (not the patient owner)
                  const isProviderUploaded = file.createdByUserId !== null && file.createdByUserId !== selectedFolder.userId;
                  const fileCreatorName = isProviderUploaded && file.CreatedByUser
                    ? [file.CreatedByUser.firstName, file.CreatedByUser.lastName].filter(Boolean).join(" ")
                    : null;
                  const fileCreatorClinic = isProviderUploaded
                    ? file.FileSetting?.FileClinicShares?.map((s) => s.Clinic.name).join(", ") ?? null
                    : null;
                  // Only allow manage actions if this clinic uploaded the file
                  const isUploadedByThisClinic = file.FileSetting?.scopeClinicId === clinicId;
                  return (
                    <div
                      key={file.id}
                      className="glassmorphic-card p-4 hover:scale-[1.02] transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <File className="w-5 h-5 text-white" />
                          </div>
                          {fileCreatorName && (
                            <div
                              title={`${fileCreatorClinic ? `Uploaded by ${fileCreatorClinic}` : "Provider uploaded"} · ${fileCreatorName}`}
                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center cursor-help"
                            >
                              <UserCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <a
                                href={`/api/patient/files/${file.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View File
                              </a>
                            </DropdownMenuItem>
                            {isUploadedByThisClinic && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenameFileTarget(file);
                                    setRenameFileName(file.name);
                                    setShowRenameFile(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => handleDeleteFile(file)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white truncate mb-1">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {file.FileType.name} · {formatBytes(file.size)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs flex items-center gap-1 w-fit ${PRIVACY_COLORS[privacy]}`}
                      >
                        {PRIVACY_ICONS[privacy]}
                        {PRIVACY_LABELS[privacy]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              This folder will be automatically shared with your clinic.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isPending}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog
        open={showUpload}
        onOpenChange={(open) => {
          if (!open) {
            setUploadFile(null);
            setUploadFileTypeId("");
          }
          setShowUpload(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              This file will be automatically shared with your clinic.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto max-h-[60vh]">
            <div>
              <label className="text-sm font-medium mb-1 block">File Type</label>
              <Select value={uploadFileTypeId} onValueChange={setUploadFileTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes.map((ft) => (
                    <SelectItem key={ft.id} value={String(ft.id)}>
                      {ft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">File</label>
              <div
                className={`rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]"
                    : uploadFile
                    ? "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) void handleFileSelect(dropped);
                }}
              >
                {isConvertingFile ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-slate-400 animate-pulse" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Converting image…</p>
                  </div>
                ) : uploadFile ? (
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{uploadFile.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatBytes(uploadFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                      className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click or drag &amp; drop a file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Max 25 MB · Any file type</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={PATIENT_FILE_ACCEPT}
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileSelect(file);
                  // Reset input so the same file can be re-selected after clear
                  e.target.value = "";
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadFile}
              disabled={!uploadFile || !uploadFileTypeId || isPending || isConvertingFile}
            >
              {isPending ? "Uploading..." : isConvertingFile ? "Converting..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={showRenameFolder} onOpenChange={setShowRenameFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameFolder(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameFolder}
              disabled={!renameFolderName.trim() || isPending}
            >
              {isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename File Dialog */}
      <Dialog open={showRenameFile} onOpenChange={setShowRenameFile}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameFileName}
              onChange={(e) => setRenameFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameFile(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameFile(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameFile}
              disabled={!renameFileName.trim() || isPending}
            >
              {isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
