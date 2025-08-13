"use client";

import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadMediaAction } from "@/actions/blob.action";
import { updatePhilHealthRecordPhotoAction } from "@/actions/philhealth/philhealth-record.action";
import { revalidatePath } from "@/actions/cache.action";
import { toast } from "sonner";

interface PhilHealthPhotoProps {
  userUid: string;
  philHealthRecordId?: number;
  existingUrl?: string;
  readonly?: boolean;
}

// Target output size (square)
const TARGET_SIZE = 400; // px
const MAX_FILE_MB = 5;

export function PhilHealthPhoto({ userUid, philHealthRecordId, existingUrl, readonly }: PhilHealthPhotoProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const selectionRef = useRef<{ x: number; y: number; size: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      toast.error("Only JPEG and PNG are allowed");
      return;
    }
    if (f.size / 1024 / 1024 > MAX_FILE_MB) {
      toast.error(`File exceeds ${MAX_FILE_MB}MB`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setTimeout(() => initSelection(), 50);
  };

  const initSelection = () => {
    if (!containerRef.current) return;
    const side = Math.min(containerRef.current.clientWidth, containerRef.current.clientHeight, 280);
    selectionRef.current = { x: 20, y: 20, size: side - 40 };
    drawOverlay();
  };

  const drawOverlay = () => {
    if (!containerRef.current || !selectionRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    canvasRef.current!.width = w;
    canvasRef.current!.height = h;
    ctx.clearRect(0, 0, w, h);
    // darken full area
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, w, h);
    // square cutout
    const { x, y, size } = selectionRef.current;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "black";
    ctx.fillRect(x, y, size, size);
    ctx.restore();
    // square border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
  };

  const handleMouseDown = () => {
    if (!selectionRef.current) return;
    setDragging(true);
  };
  const handleMouseUp = () => setDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current || !selectionRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - selectionRef.current.size / 2;
    const y = e.clientY - rect.top - selectionRef.current.size / 2;
    const maxX = rect.width - selectionRef.current.size;
    const maxY = rect.height - selectionRef.current.size;
    selectionRef.current.x = Math.max(0, Math.min(maxX, x));
    selectionRef.current.y = Math.max(0, Math.min(maxY, y));
    drawOverlay();
  };

  const performCrop = useCallback(async () => {
    if (!preview || !selectionRef.current) return;
    toast.loading("Processing...");
    try {
      const imgEl = imgRef.current;
      if (!imgEl) return;
      // create temp canvas for output
      const out = document.createElement("canvas");
      out.width = TARGET_SIZE;
      out.height = TARGET_SIZE;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      // compute scale between displayed image and natural image
      const displayWidth = imgEl.clientWidth;
      const scale = imgEl.naturalWidth / displayWidth;
      const { x, y, size } = selectionRef.current;
      const sx = x * scale;
      const sy = y * scale;
      const sSize = size * scale;
      // draw image to square canvas
      // ensure a white background for JPEG to avoid unexpected transparency from PNGs
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
      ctx.drawImage(imgEl, sx, sy, sSize, sSize, 0, 0, TARGET_SIZE, TARGET_SIZE);

      const blob: Blob = await new Promise((res) => out.toBlob(b => res(b as Blob), "image/jpeg", 0.85));
      const croppedFile = new File([blob], file?.name.replace(/\.(png|jpg|jpeg)$/i, "") + "-cropped.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("media", croppedFile);
      formData.append("directory", `philhealth/${userUid}`);
      const { url } = await uploadMediaAction(formData);
      if (philHealthRecordId) {
        await updatePhilHealthRecordPhotoAction({ philHealthRecordId, photoUrl: url });
      }
      await revalidatePath(`/user/${userUid}/phr/philhealth`, "page");
      toast.dismiss();
      toast.success("Photo saved");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.dismiss();
      toast.error("Failed to process photo");
    }
  }, [preview, philHealthRecordId, userUid, file]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <Avatar className="w-40 h-40">
          {existingUrl ? (
            <AvatarImage src={existingUrl} alt="PhilHealth Photo" />
          ) : (
            <AvatarFallback>PH</AvatarFallback>
          )}
        </Avatar>
        {!readonly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">{existingUrl ? "Change" : "Upload"} Photo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Upload PhilHealth Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="philhealth-photo">Select Image (JPEG/PNG)</Label>
                  <Input id="philhealth-photo" type="file" accept="image/png,image/jpeg" onChange={onFileChange} />
                </div>
                {preview && (
                  <div className="relative border rounded" ref={containerRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <Image
                      src={preview}
                      alt="Preview"
                      width={600}
                      height={400}
                      className="max-h-[400px] w-auto select-none"
                      draggable={false}
                      onLoad={(e) => {
                        // Derive the underlying img element for sizing
                        const target = e.currentTarget as HTMLImageElement
                        imgRef.current = target
                        drawOverlay()
                      }}
                    />
                    <canvas ref={canvasRef} className="absolute inset-0 cursor-move" onMouseDown={handleMouseDown} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Drag the square to position. Output is a {TARGET_SIZE}x{TARGET_SIZE} JPEG.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={!preview} type="button" onClick={performCrop}>Save Photo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
