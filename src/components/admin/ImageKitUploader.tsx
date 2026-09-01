"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, ImageIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ImageObject } from "@/types";
import { addProductImage, deleteProductImage, setCoverImage } from "@/actions/products";
import toast from "react-hot-toast";

interface ImageKitUploaderProps {
  productId?: string;
  category?: string;
  images: ImageObject[];
  onChange?: (images: ImageObject[]) => void;
  onUploadComplete?: (image: ImageObject) => void;
  folder?: string;
  maxImages?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  preview?: string;
}

export default function ImageKitUploader({
  productId,
  category = "general",
  images = [],
  onChange,
  onUploadComplete,
  folder,
  maxImages = 10,
}: ImageKitUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFolder = folder || `/products/${category}`;

  const uploadFile = useCallback(
    async (file: File) => {
      if (images.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const uploadId = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(file);

      setUploadingFiles((prev) => [
        ...prev,
        { id: uploadId, name: file.name, progress: 0, status: "uploading", preview },
      ]);

      try {
        // Build FormData and send to our server-side proxy (uses private key)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("folder", uploadFolder);
        formData.append("tags", `product,${category},store-asset`);

        // Simulate progress (server-side upload can't report XHR progress)
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress = Math.min(progress + 15, 85);
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadId ? { ...f, progress } : f))
          );
        }, 200);

        const res = await fetch("/api/imagekit/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(errData.error || "Upload failed");
        }

        const uploadResult = await res.json() as {
          fileId: string;
          url: string;
          thumbnailUrl: string;
          filePath: string;
          name: string;
        };

        const newImage: ImageObject = {
          fileId: uploadResult.fileId,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          filePath: uploadResult.filePath,
          name: uploadResult.name,
          isCover: images.length === 0,
        };

        // 4a. If productId provided, save to DB via server action
        if (productId) {
          const result = await addProductImage(productId, newImage);
          if (!result.success) throw new Error(result.error);
        }

        // 4b. Or call onChange callback for new product form
        if (onChange) {
          onChange([...images, newImage]);
        }
        if (onUploadComplete) {
          onUploadComplete(newImage);
        }

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadId ? { ...f, status: "done", progress: 100 } : f))
        );

        toast.success("Image uploaded successfully");

        // Clean up after 2s
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
        }, 2000);
      } catch (err) {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadId ? { ...f, status: "error" } : f))
        );
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        URL.revokeObjectURL(preview);
      }
    },
    [images, maxImages, uploadFolder, category, productId, onChange, onUploadComplete]
  );

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .forEach((f) => uploadFile(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (fileId: string) => {
    if (!productId) {
      // Local remove (new product form)
      onChange?.(images.filter((img) => img.fileId !== fileId));
      return;
    }
    const toastId = toast.loading("Deleting image...");
    const result = await deleteProductImage(productId, fileId);
    if (result.success) {
      toast.success("Image deleted", { id: toastId });
    } else {
      toast.error(result.error ?? "Delete failed", { id: toastId });
    }
  };

  const handleSetCover = async (fileId: string) => {
    if (!productId) {
      onChange?.(
        images.map((img) => ({ ...img, isCover: img.fileId === fileId }))
      );
      return;
    }
    const result = await setCoverImage(productId, fileId);
    if (result.success) {
      toast.success("Cover image updated");
    } else {
      toast.error(result.error ?? "Failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-purple-500 bg-purple-500/10"
            : "border-purple-800/50 hover:border-purple-600/70 hover:bg-purple-900/10"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-purple-500/20" : "bg-purple-900/30"
          )}>
            <Upload className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">
              Drop images here or <span className="text-purple-400">browse</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP up to 10MB • Uploads to {uploadFolder}
            </p>
          </div>
        </div>
      </div>

      {/* Uploading progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3 glass rounded-lg">
              {f.preview && (
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <Image src={f.preview} alt={f.name} width={40} height={40} className="object-cover w-full h-full" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{f.name}</p>
                <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
              {f.status === "done" && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
              {f.status === "error" && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              {f.status === "uploading" && (
                <span className="text-xs text-gray-400">{f.progress}%</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.fileId}
              className={cn(
                "relative group rounded-lg overflow-hidden aspect-square",
                "border-2 transition-all duration-200",
                img.isCover
                  ? "border-amber-500 ring-2 ring-amber-500/30"
                  : "border-transparent hover:border-purple-600/50"
              )}
            >
              <Image
                src={img.thumbnailUrl || img.url}
                alt={img.name}
                fill
                className="object-cover"
              />

              {/* Cover badge */}
              {img.isCover && (
                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5" /> Cover
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isCover && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetCover(img.fileId); }}
                    className="p-1.5 bg-amber-500/80 rounded-full hover:bg-amber-500 transition-colors"
                    title="Set as cover"
                  >
                    <Star className="w-3.5 h-3.5 text-black" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(img.fileId); }}
                  className="p-1.5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                  title="Delete image"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          ))}

          {/* Empty slot indicator */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-purple-600/50 flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-purple-400 transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
