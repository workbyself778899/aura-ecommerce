import { Image as ImageIcon, Sparkles, Folder, RefreshCw, ShieldCheck } from "lucide-react";
import ImageKitUploader from "@/components/admin/ImageKitUploader";

export default function AdminMediaPage() {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/your_id";

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">ImageKit Media Command Center</h1>
        <p className="text-sm text-gray-400 mt-1">
          Real-time cloud asset control, transformation engine, and zero-orphan cascade lifecycle status.
        </p>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Signed Auth API</h3>
          </div>
          <p className="text-xs text-gray-400">
            <code className="text-purple-300">/api/imagekit/auth</code> delivers HMAC security tokens for client-side uploads.
          </p>
        </div>

        <div className="glass rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Cascade Delete Sync</h3>
          </div>
          <p className="text-xs text-gray-400">
            Product deletion triggers <code className="text-purple-300">bulkDeleteFiles([fileIds])</code> to eliminate orphaned files.
          </p>
        </div>

        <div className="glass rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Real-Time Optimizations</h3>
          </div>
          <p className="text-xs text-gray-400">
            Auto WebP/AVIF format conversion, dynamic resizing, DPR, and blur placeholders via <code className="text-purple-300">tr:w-*,f-webp</code> parameters.
          </p>
        </div>
      </div>

      {/* Test Uploader */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Interactive Test Upload Zone</h2>
        </div>
        <p className="text-xs text-gray-400">
          Upload banner assets directly to ImageKit <code className="text-purple-300">/banners/</code> folder.
        </p>

        <ImageKitUploader category="banners" folder="/banners/" images={[]} />
      </div>

      {/* URL Transformation Cheat Sheet */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Transformation URL Syntax</h2>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 bg-black/40 rounded-xl text-gray-300 overflow-x-auto">
            <span className="text-gray-500"># Thumbnail: </span>
            {urlEndpoint}/tr:w-300,h-300,c-maintain_ratio,f-webp/products/sample.jpg
          </div>
          <div className="p-3 bg-black/40 rounded-xl text-gray-300 overflow-x-auto">
            <span className="text-gray-500"># Blur Placeholder: </span>
            {urlEndpoint}/tr:w-20,bl-6,f-webp/products/sample.jpg
          </div>
        </div>
      </div>
    </div>
  );
}
