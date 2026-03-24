"use client";

import { Input } from "@/components/ui/input";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import ActionButton from "@/components/ActionButton";
import { uploadMediaAction } from "@/actions/blob.action";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { upsertHPAction } from "@/actions/hp.actions";
import { type V2HPProfileType } from "../hp-v2-form.schema";
import { UserCircle, ImageIcon, Upload } from "lucide-react";
import Image from "next/image";

interface V2HPPhotoProps {
  profile: V2HPProfileType;
  hpId: number;
}

function PhotoPreview({
  currentUrl,
  previewUrl,
  label,
  variant,
}: {
  currentUrl: string;
  previewUrl: string | null;
  label: string;
  variant: "avatar" | "cover";
}) {
  const displayUrl = previewUrl ?? currentUrl;
  const isAvatar = variant === "avatar";

  if (isAvatar) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted overflow-hidden">
        {displayUrl ? (
          <Image src={displayUrl} alt={label} width={96} height={96} className="h-full w-full object-cover" />
        ) : (
          <UserCircle className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
      {displayUrl ? (
        <Image src={displayUrl} alt={label} width={400} height={96} className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
      )}
    </div>
  );
}

export default function V2HPPhoto({ profile, hpId }: V2HPPhotoProps) {
  const { user } = useUser();
  const userId = user?.id;
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (picturePreview) URL.revokeObjectURL(picturePreview);
      const url = URL.createObjectURL(file);
      setPicturePreview(url);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const action = async (formData: FormData) => {
    const picture = formData.get("picture") as File;
    const cover = formData.get("cover") as File;

    const [pictureUrl, coverUrl] = await Promise.all([
      (async () => {
        if (!picture.size) return profile.picture;
        const form = new FormData();
        form.append("media", picture);
        form.append("directory", userId ?? "");
        const { url } = await uploadMediaAction(form);
        return url;
      })(),
      (async () => {
        if (!cover.size) return profile.cover;
        const form = new FormData();
        form.append("media", cover);
        form.append("directory", userId ?? "");
        const { url } = await uploadMediaAction(form);
        return url;
      })(),
    ]);

    const mappedData = {
      name: profile.name,
      picture: pictureUrl,
      cover: coverUrl,
      healthcareProviderId: hpId,
    };

    toast.promise(
      upsertHPAction({
        where: { healthcareProviderId: hpId },
        create: mappedData,
        update: mappedData,
      }),
      {
        loading: "Updating photos...",
        success: () => "Photos updated successfully.",
        error: "Failed to update photos.",
      }
    );
  };

  return (
    <form action={action} className="space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Picture */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Profile Picture</Label>
          <div className="flex items-center gap-4">
            <PhotoPreview
              currentUrl={profile.picture ?? ""}
              previewUrl={picturePreview}
              label="Profile picture"
              variant="avatar"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs text-muted-foreground">
                Square image recommended. Displayed on your public profile.
              </p>
              <button
                type="button"
                onClick={() => pictureInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Upload size={13} />
                Choose file
              </button>
              <Input
                ref={pictureInputRef}
                name="picture"
                id="v2-picture"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePictureChange}
              />
            </div>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Cover Photo</Label>
          <PhotoPreview
            currentUrl={profile.cover ?? ""}
            previewUrl={coverPreview}
            label="Cover photo"
            variant="cover"
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Wide banner image shown at the top of your profile. (16:9 ratio recommended)
            </p>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Upload size={13} />
              Choose file
            </button>
            <Input
              ref={coverInputRef}
              name="cover"
              id="v2-cover"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>
        </div>
      </div>

      <ActionButton className="w-full">Save Photos</ActionButton>
    </form>
  );
}
