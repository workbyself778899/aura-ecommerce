import ImageKit, { toFile } from "@imagekit/nodejs";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_dummy",
});

export interface UploadOptions {
  file: Buffer | string | File;
  fileName: string;
  folder?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
}

export interface UploadResponse {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  filePath: string;
  name: string;
}

/**
 * Upload a file to ImageKit using @imagekit/nodejs SDK.
 */
export async function upload(options: UploadOptions): Promise<UploadResponse> {
  const fileToUpload = Buffer.isBuffer(options.file)
    ? await toFile(options.file, options.fileName)
    : options.file;

  const res = await imagekit.files.upload({
    file: fileToUpload,
    fileName: options.fileName,
    folder: options.folder,
    tags: options.tags,
    useUniqueFileName: options.useUniqueFileName,
  });

  return {
    fileId: res.fileId ?? "",
    url: res.url ?? "",
    thumbnailUrl: res.thumbnailUrl ?? res.url ?? "",
    filePath: res.filePath ?? "",
    name: res.name ?? options.fileName,
  };
}

// Bind upload onto imagekit instance for backward compatibility with `imagekit.upload(...)`
Object.assign(imagekit, { upload });

/**
 * Generate signed authentication parameters for client-side uploads.
 * Call this from the /api/imagekit/auth route.
 */
export function getAuthParams() {
  return imagekit.helper.getAuthenticationParameters();
}

/**
 * Delete a single file from ImageKit by its fileId.
 */
export async function deleteFile(fileId: string): Promise<void> {
  await imagekit.files.delete(fileId);
}

/**
 * Delete multiple files from ImageKit in one API call.
 * ImageKit supports up to 100 fileIds per request.
 */
export async function bulkDeleteFiles(fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) return;

  // Split into chunks of 100
  const chunks: string[][] = [];
  for (let i = 0; i < fileIds.length; i += 100) {
    chunks.push(fileIds.slice(i, i + 100));
  }

  await Promise.all(
    chunks.map((chunk) => imagekit.files.bulk.delete({ fileIds: chunk }))
  );
}

/**
 * Generate an optimized ImageKit transformation URL.
 * Supports responsive widths, WebP auto-format, blur placeholder.
 */
export function buildImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "auto";
    blur?: number;
    crop?: "maintain_ratio" | "force" | "at_least" | "at_max";
  } = {}
): string {
  const { width, height, quality = 80, format = "webp", blur, crop } = options;

  const transforms: string[] = [];
  if (width) transforms.push(`w-${width}`);
  if (height) transforms.push(`h-${height}`);
  if (crop) transforms.push(`c-${crop}`);
  if (blur) transforms.push(`bl-${blur}`);
  transforms.push(`f-${format}`);
  transforms.push(`q-${quality}`);

  const base = process.env.IMAGEKIT_URL_ENDPOINT!;
  // If src is already a full URL, extract the path
  const path = src.startsWith("http") ? new URL(src).pathname : src;
  return `${base}/tr:${transforms.join(",")}${path}`;
}

export default imagekit as typeof imagekit & {
  upload: typeof upload;
};

