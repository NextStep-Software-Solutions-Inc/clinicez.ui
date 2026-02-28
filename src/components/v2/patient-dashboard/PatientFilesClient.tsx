"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  FolderOpen,
  File,
  Upload,
  Plus,
  Trash2,
  Lock,
  Globe,
  Building2,
  MoreVertical,
  Share2,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FilePrivacy } from "@prisma/client";
import { ThemeToggle } from "@/components/patient-dashboard-v2/ThemeToggle";
import type {
  GetPatientFolders,
  PatientFolder,
} from "@/actions/patient/patient-files.action";
import {
  createPatientFolderAction,
  deletePatientFolderAction,
  renamePatientFolderAction,
  updatePatientFolderPrivacyAction,
  uploadPatientFileAction,
  deletePatientFileAction,
  updatePatientFilePrivacyAction,
  sharePatientFolderWithClinicAction,
  unsharePatientFolderFromClinicAction,
  sharePatientFileWithClinicAction,
  unsharePatientFileFromClinicAction,
} from "@/actions/patient/patient-files.action";

type Clinic = { id: number; clinicUid: string; name: string; logo: string | null };
type FileType = { id: number; name: string };

type PatientInfo = {
  name: string;
  picture: string | null;
  bloodType: string | null;
  gender: string | null;
  age: number | null;
  caseNumber: string | null;
};

interface PatientFilesClientProps {
  initialFolders: NonNullable<GetPatientFolders["data"]>;
  clinics: Clinic[];
  fileTypes: FileType[];
  patientInfo?: PatientInfo;
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

export function PatientFilesClient({
  initialFolders,
  clinics,
  fileTypes,
  patientInfo,
}: PatientFilesClientProps) {
  const router = useRouter();
  const [folders, setFolders] = useState(initialFolders);
  const [selectedFolder, setSelectedFolder] = useState<PatientFolder | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dialogs
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPrivacy, setNewFolderPrivacy] = useState<FilePrivacy>("PRIVATE");

  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<PatientFolder | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");

  const [showShareFolder, setShowShareFolder] = useState(false);
  const [shareFolderTarget, setShareFolderTarget] = useState<PatientFolder | null>(null);
  const [sharedFolderClinicIds, setSharedFolderClinicIds] = useState<Set<number>>(new Set());
  const [pendingFolderClinicIds, setPendingFolderClinicIds] = useState<Set<number>>(new Set());

  const [showShareFile, setShowShareFile] = useState(false);
  const [shareFileTarget, setShareFileTarget] =
    useState<PatientFolder["Files"][number] | null>(null);
  const [sharedFileClinicIds, setSharedFileClinicIds] = useState<Set<number>>(new Set());
  const [pendingFileClinicIds, setPendingFileClinicIds] = useState<Set<number>>(new Set());

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFileTypeId, setUploadFileTypeId] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh folders from server
  const refreshFolders = () => {
    startTransition(async () => {
      const { getPatientFoldersAction } = await import(
        "@/actions/patient/patient-files.action"
      );
      const result = await getPatientFoldersAction();
      if (result.status && result.data) {
        setFolders(result.data);
        // Update selectedFolder if it's open
        if (selectedFolder) {
          const updated = result.data.find((f) => f.id === selectedFolder.id);
          setSelectedFolder(updated ?? null);
        }
      }
    });
  };

  // Create folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    startTransition(async () => {
      const result = await createPatientFolderAction({
        name: newFolderName,
        privacy: newFolderPrivacy,
      });
      if (result.status && result.data) {
        setFolders((prev) => [result.data!, ...prev]);
        setShowCreateFolder(false);
        setNewFolderName("");
        setNewFolderPrivacy("PRIVATE");
        toast.success("Folder created");
      } else {
        toast.error(result.message || "Failed to create folder");
      }
    });
  };

  // Rename folder
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

  // Delete folder
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

  // Update folder privacy
  const handleFolderPrivacy = (folder: PatientFolder, privacy: FilePrivacy) => {
    startTransition(async () => {
      const result = await updatePatientFolderPrivacyAction({
        folderId: folder.id,
        privacy,
      });
      if (result.status) {
        refreshFolders();
        toast.success("Privacy updated");
      } else {
        toast.error(result.message || "Failed to update privacy");
      }
    });
  };

  // Upload file
  const handleUploadFile = () => {
    if (!selectedFolder || !uploadFile || !uploadFileTypeId) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("folderId", String(selectedFolder.id));
      fd.append("fileTypeId", uploadFileTypeId);
      const result = await uploadPatientFileAction(fd);
      if (result.status) {
        refreshFolders();
        setShowUpload(false);
        setUploadFile(null);
        setUploadFileTypeId("");
        toast.success("File uploaded");
      } else {
        toast.error(result.message || "Failed to upload file");
      }
    });
  };

  // Delete file
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

  // Update file privacy
  const handleFilePrivacy = (
    file: PatientFolder["Files"][number],
    privacy: FilePrivacy
  ) => {
    startTransition(async () => {
      const result = await updatePatientFilePrivacyAction({
        fileId: file.id,
        privacy,
      });
      if (result.status) {
        refreshFolders();
        toast.success("File privacy updated");
      } else {
        toast.error(result.message || "Failed to update file privacy");
      }
    });
  };

  // Toggle folder share for a clinic (optimistic)
  const handleToggleFolderShare = (clinicId: number) => {
    if (!shareFolderTarget || pendingFolderClinicIds.has(clinicId)) return;
    const wasShared = sharedFolderClinicIds.has(clinicId);
    // Optimistic update
    setSharedFolderClinicIds((prev) => {
      const next = new Set(prev);
      if (wasShared) next.delete(clinicId); else next.add(clinicId);
      return next;
    });
    setPendingFolderClinicIds((prev) => new Set(prev).add(clinicId));
    startTransition(async () => {
      const action = wasShared ? unsharePatientFolderFromClinicAction : sharePatientFolderWithClinicAction;
      const result = await action({ folderId: shareFolderTarget.id, clinicId });
      if (result.status) {
        refreshFolders();
        toast.success(wasShared ? "Folder unshared" : "Folder shared with clinic");
      } else {
        // Revert optimistic update
        setSharedFolderClinicIds((prev) => {
          const next = new Set(prev);
          if (wasShared) next.add(clinicId); else next.delete(clinicId);
          return next;
        });
        toast.error(result.message || "Failed to update sharing");
      }
      setPendingFolderClinicIds((prev) => { const next = new Set(prev); next.delete(clinicId); return next; });
    });
  };

  // Toggle file share for a clinic (optimistic)
  const handleToggleFileShare = (clinicId: number) => {
    if (!shareFileTarget || pendingFileClinicIds.has(clinicId)) return;
    const wasShared = sharedFileClinicIds.has(clinicId);
    setSharedFileClinicIds((prev) => {
      const next = new Set(prev);
      if (wasShared) next.delete(clinicId); else next.add(clinicId);
      return next;
    });
    setPendingFileClinicIds((prev) => new Set(prev).add(clinicId));
    startTransition(async () => {
      const action = wasShared ? unsharePatientFileFromClinicAction : sharePatientFileWithClinicAction;
      const result = await action({ fileId: shareFileTarget.id, clinicId });
      if (result.status) {
        refreshFolders();
        toast.success(wasShared ? "File unshared" : "File shared with clinic");
      } else {
        setSharedFileClinicIds((prev) => {
          const next = new Set(prev);
          if (wasShared) next.add(clinicId); else next.delete(clinicId);
          return next;
        });
        toast.error(result.message || "Failed to update sharing");
      }
      setPendingFileClinicIds((prev) => { const next = new Set(prev); next.delete(clinicId); return next; });
    });
  };

  const currentFolder = selectedFolder
    ? folders.find((f) => f.id === selectedFolder.id) ?? selectedFolder
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Sticky Glassmorphic Header */}
      <div className="sticky top-0 z-50 glassmorphic-card px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Back button — goes to previous page when at root, or back to folder list when inside a folder */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (currentFolder) {
                setSelectedFolder(null);
              } else {
                router.back();
              }
            }}
            className="h-8 w-8 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight truncate">
              {currentFolder ? currentFolder.name : "My Files"}
            </h1>
            {currentFolder && (
              <div className="flex items-center gap-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                <button
                  className="hover:underline truncate max-w-[80px] md:max-w-none"
                  onClick={() => setSelectedFolder(null)}
                >
                  My Files
                </button>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="truncate">{currentFolder.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentFolder ? (
            <Button
              size="sm"
              onClick={() => setShowUpload(true)}
              disabled={isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 border-0 text-xs md:text-sm px-3 md:px-4"
            >
              <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowCreateFolder(true)}
              disabled={isPending}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 border-0 text-xs md:text-sm px-3 md:px-4"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">New Folder</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Patient Context Card */}
      {patientInfo && (
        <div className="glassmorphic-card px-4 py-3 md:px-6 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden">
            {patientInfo.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patientInfo.picture} alt={patientInfo.name} className="w-full h-full object-cover" />
            ) : (
              patientInfo.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white truncate">{patientInfo.name}</span>
              {patientInfo.caseNumber && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  #{patientInfo.caseNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {patientInfo.age !== null && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {patientInfo.age} yrs
                </span>
              )}
              {patientInfo.gender && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {formatGender(patientInfo.gender)}
                </span>
              )}
              {patientInfo.bloodType && (
                <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full font-medium">
                  {formatBloodType(patientInfo.bloodType)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Folder View */}
      {!currentFolder ? (
        <div>
          {folders.length === 0 ? (
            <div className="glassmorphic-card p-16 flex flex-col items-center justify-center text-center border-dashed">
              <Folder className="w-16 h-16 text-slate-300 dark:text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No folders yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                Create folders to organize your medical records, lab results,
                and other health documents.
              </p>
              <Button
                onClick={() => setShowCreateFolder(true)}
                size="sm"
                className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first folder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.map((folder) => {
                const privacy = folder.FolderSetting?.privacy ?? "PRIVATE";
                const fileCount = folder.Files.length;
                // A folder was created by a provider if createdByUserId differs from userId (the patient owner)
                const isProviderCreated = folder.createdByUserId !== null && folder.createdByUserId !== folder.userId;
                const creatorClinicId = folder.FolderSetting?.scopeClinicId ?? null;
                const creatorName = isProviderCreated && folder.CreatedByUser
                  ? [folder.CreatedByUser.firstName, folder.CreatedByUser.lastName].filter(Boolean).join(" ")
                  : null;
                const creatorClinic = isProviderCreated
                  ? folder.FolderSetting?.FolderClinicShares?.map((s) => s.Clinic.name).join(", ") ?? null
                  : null;
                return (
                  <div
                    key={folder.id}
                    role="button"
                    tabIndex={0}
                    className="glassmorphic-card group cursor-pointer hover:scale-[1.02] transition-all duration-200"
                    onClick={() => setSelectedFolder(folder)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedFolder(folder); } }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="relative">
                        <FolderOpen className="w-8 h-8 text-yellow-500 flex-shrink-0" />
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
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${PRIVACY_COLORS[privacy]}`}
                        >
                          {PRIVACY_ICONS[privacy]}
                          {PRIVACY_LABELS[privacy]}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                            {/* Patient cannot set a provider-created folder to PRIVATE */}
                            {!isProviderCreated && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleFolderPrivacy(folder, "PRIVATE")
                                }
                                disabled={privacy === "PRIVATE"}
                              >
                                <Lock className="w-4 h-4 mr-2" /> Set Private
                              </DropdownMenuItem>
                            )}
                            {/* For provider-created folders, patient can revert from PUBLIC back to CLINIC */}
                            {isProviderCreated && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleFolderPrivacy(folder, "CLINIC")
                                }
                                disabled={privacy === "CLINIC"}
                              >
                                <Building2 className="w-4 h-4 mr-2" /> Set Clinic Shared
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                handleFolderPrivacy(folder, "PUBLIC")
                              }
                              disabled={privacy === "PUBLIC"}
                            >
                              <Globe className="w-4 h-4 mr-2" /> Set Public
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {clinics.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setShareFolderTarget(folder);
                                  setSharedFolderClinicIds(new Set(
                                    folder.FolderSetting?.FolderClinicShares.map((s) => s.clinicId) ?? []
                                  ));
                                  setPendingFolderClinicIds(new Set());
                                  setShowShareFolder(true);
                                }}
                              >
                                <Share2 className="w-4 h-4 mr-2" /> Share
                                with Clinic
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {!isProviderCreated && (
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => handleDeleteFolder(folder)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white truncate mb-1">
                      {folder.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {fileCount} file{fileCount !== 1 ? "s" : ""}
                    </p>
                    {folder.FolderSetting?.FolderClinicShares &&
                      folder.FolderSetting.FolderClinicShares.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {folder.FolderSetting.FolderClinicShares.map(
                            (share) => {
                              const isCreator = share.clinicId === creatorClinicId;
                              const badgeClassName = `text-xs text-white hover:bg-blue-600 ${isCreator ? "bg-blue-700" : "bg-blue-600"}`;
                              return (
                                <Badge key={share.id} className={badgeClassName}>
                                  {share.Clinic.name}
                                  {isCreator && (
                                    <Lock className="w-2.5 h-2.5 ml-1 inline" />
                                  )}
                                </Badge>
                              );
                            }
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* File View */
        <div>
          {currentFolder.Files.length === 0 ? (
            <div className="glassmorphic-card p-16 flex flex-col items-center justify-center text-center border-dashed">
              <File className="w-16 h-16 text-slate-300 dark:text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No files in this folder
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                Upload your medical documents, lab results, or any
                health-related files.
              </p>
              <Button
                onClick={() => setShowUpload(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload a file
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFolder.Files.map((file) => {
                const privacy = file.FileSetting?.privacy ?? "PRIVATE";
                // Show creator info if file was uploaded by a provider (not the patient)
                const isProviderUploaded = file.createdByUserId !== null && file.createdByUserId !== currentFolder.userId;
                const fileCreatorClinicId = file.FileSetting?.scopeClinicId ?? null;
                const fileCreatorName = isProviderUploaded && file.CreatedByUser
                  ? [file.CreatedByUser.firstName, file.CreatedByUser.lastName].filter(Boolean).join(" ")
                  : null;
                const fileCreatorClinic = isProviderUploaded
                  ? file.FileSetting?.FileClinicShares?.map((s) => s.Clinic.name).join(", ") ?? null
                  : null;
                return (
                  <div
                    key={file.id}
                    className="glassmorphic-card group hover:scale-[1.02] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="relative">
                        <File className="w-8 h-8 text-blue-500 flex-shrink-0" />
                        {fileCreatorName && (
                          <div
                            title={`${fileCreatorClinic ? `Uploaded by ${fileCreatorClinic}` : "Provider uploaded"} · ${fileCreatorName}`}
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center cursor-help"
                          >
                            <UserCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${PRIVACY_COLORS[privacy]}`}
                        >
                          {PRIVACY_ICONS[privacy]}
                          {PRIVACY_LABELS[privacy]}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a
                                href={`/api/patient/files/${file.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View File
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Patient cannot set a provider-uploaded file to PRIVATE */}
                            {!isProviderUploaded && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleFilePrivacy(file, "PRIVATE")
                                }
                                disabled={privacy === "PRIVATE"}
                              >
                                <Lock className="w-4 h-4 mr-2" /> Set Private
                              </DropdownMenuItem>
                            )}
                            {/* For provider-uploaded files, patient can revert from PUBLIC back to CLINIC */}
                            {isProviderUploaded && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleFilePrivacy(file, "CLINIC")
                                }
                                disabled={privacy === "CLINIC"}
                              >
                                <Building2 className="w-4 h-4 mr-2" /> Set Clinic Shared
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                handleFilePrivacy(file, "PUBLIC")
                              }
                              disabled={privacy === "PUBLIC"}
                            >
                              <Globe className="w-4 h-4 mr-2" /> Set Public
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {clinics.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setShareFileTarget(file);
                                  setSharedFileClinicIds(new Set(
                                    file.FileSetting?.FileClinicShares.map((s) => s.clinicId) ?? []
                                  ));
                                  setPendingFileClinicIds(new Set());
                                  setShowShareFile(true);
                                }}
                              >
                                <Share2 className="w-4 h-4 mr-2" /> Share
                                with Clinic
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {!isProviderUploaded && (
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => handleDeleteFile(file)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white truncate mb-1">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {file.FileType.name} · {formatBytes(file.size)}
                    </p>
                    {file.FileSetting?.FileClinicShares &&
                      file.FileSetting.FileClinicShares.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {file.FileSetting.FileClinicShares.map((share) => {
                            const isCreator = share.clinicId === fileCreatorClinicId;
                            const badgeClassName = `text-xs text-white hover:bg-blue-600 ${isCreator ? "bg-blue-700" : "bg-blue-600"}`;
                            return (
                              <Badge key={share.id} className={badgeClassName}>
                                {share.Clinic.name}
                                {isCreator && (
                                  <Lock className="w-2.5 h-2.5 ml-1 inline" />
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Folder Name
              </label>
              <Input
                placeholder="e.g. Lab Results 2025"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Privacy</label>
              <Select
                value={newFolderPrivacy}
                onValueChange={(v) => setNewFolderPrivacy(v as FilePrivacy)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Private (only you)
                    </span>
                  </SelectItem>
                  <SelectItem value="CLINIC">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Clinic (shared with
                      clinics)
                    </span>
                  </SelectItem>
                  <SelectItem value="PUBLIC">
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Public (anyone)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateFolder(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isPending}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={showRenameFolder} onOpenChange={setShowRenameFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameFolder();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameFolder(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameFolder}
              disabled={!renameFolderName.trim() || isPending}
            >
              Rename
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
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto max-h-[60vh]">
            <div>
              <label className="text-sm font-medium mb-1 block">
                File Type
              </label>
              <Select
                value={uploadFileTypeId}
                onValueChange={setUploadFileTypeId}
              >
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
                  if (dropped) setUploadFile(dropped);
                }}
              >
                {uploadFile ? (
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
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadFile}
              disabled={!uploadFile || !uploadFileTypeId || isPending}
            >
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Folder with Clinic Dialog */}
      <Dialog open={showShareFolder} onOpenChange={setShowShareFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Folder with Clinic</DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Toggle to share or unshare &quot;{shareFolderTarget?.name}&quot; with each clinic
            </p>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-72 overflow-y-auto">
            {clinics.length === 0 ? (
              <p className="text-sm text-slate-500">
                You are not registered as a patient at any clinic.
              </p>
            ) : (
              clinics.map((clinic) => {
                const isShared = sharedFolderClinicIds.has(clinic.id);
                const isPendingThis = pendingFolderClinicIds.has(clinic.id);
                const isCreatorClinic = shareFolderTarget?.FolderSetting?.scopeClinicId === clinic.id;
                const shareStatusText = isCreatorClinic ? "Always shared (creator)" : isShared ? "Shared" : "Not shared";
                const shareStatusClass = isCreatorClinic || isShared ? "text-blue-600 dark:text-blue-400" : "text-slate-400";
                return (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex flex-col min-w-0 mr-3">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">{clinic.name}</span>
                        {isCreatorClinic && (
                          <span title="Always shared — created by this clinic">
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${shareStatusClass}`}>
                        {shareStatusText}
                      </span>
                    </div>
                    <Switch
                      checked={isShared}
                      disabled={isPendingThis || isCreatorClinic}
                      onCheckedChange={() => handleToggleFolderShare(clinic.id)}
                    />
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShareFolder(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share File with Clinic Dialog */}
      <Dialog open={showShareFile} onOpenChange={setShowShareFile}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share File with Clinic</DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Toggle to share or unshare &quot;{shareFileTarget?.name}&quot; with each clinic
            </p>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-72 overflow-y-auto">
            {clinics.length === 0 ? (
              <p className="text-sm text-slate-500">
                You are not registered as a patient at any clinic.
              </p>
            ) : (
              clinics.map((clinic) => {
                const isShared = sharedFileClinicIds.has(clinic.id);
                const isPendingThis = pendingFileClinicIds.has(clinic.id);
                const isCreatorClinic = shareFileTarget?.FileSetting?.scopeClinicId === clinic.id;
                const shareStatusText = isCreatorClinic ? "Always shared (uploader)" : isShared ? "Shared" : "Not shared";
                const shareStatusClass = isCreatorClinic || isShared ? "text-blue-600 dark:text-blue-400" : "text-slate-400";
                return (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex flex-col min-w-0 mr-3">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">{clinic.name}</span>
                        {isCreatorClinic && (
                          <span title="Always shared — uploaded by this clinic">
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${shareStatusClass}`}>
                        {shareStatusText}
                      </span>
                    </div>
                    <Switch
                      checked={isShared}
                      disabled={isPendingThis || isCreatorClinic}
                      onCheckedChange={() => handleToggleFileShare(clinic.id)}
                    />
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareFile(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
