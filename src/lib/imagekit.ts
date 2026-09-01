import ImageKit from "imagekit";


const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

/**
 * Generate signed authentication parameters for client-side uploads.
 * Call this from the /api/imagekit/auth route.
 */
export function getAuthParams() {
  return imagekit.getAuthenticationParameters();
}

/**
 * Delete a single file from ImageKit by its fileId.
 */
export async function deleteFile(fileId: string): Promise<void> {
  await imagekit.deleteFile(fileId);
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

  await Promise.all(chunks.map((chunk) => imagekit.bulkDeleteFiles(chunk)));
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

export default imagekit;

