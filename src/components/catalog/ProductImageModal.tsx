import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Package, ZoomIn, ZoomOut } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  originalImages?: string[];
  initialIndex: number;
  title?: string;
}

export function ProductImageModal({
  isOpen,
  onClose,
  images,
  originalImages,
  initialIndex,
  title,
}: ProductImageModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex);
      setScale(1);
    }
  }, [isOpen, initialIndex]);

  const safeIndex = images.length ? Math.min(index, images.length - 1) : 0;
  const current = originalImages?.[safeIndex] ?? images[safeIndex] ?? null;

  const selectImage = (i: number) => {
    setIndex(i);
    setScale(1);
  };

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  const resetZoom = () => setScale(1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title ?? "Product image"} maxWidth="7xl" noPadding>
      <div className="relative">
        {/* Image stage */}
        <div className="max-h-[70vh] overflow-auto bg-gray-100 dark:bg-gray-900">
          {current ? (
            <img
              src={current}
              alt={title ?? "Product image"}
              style={scale > 1 ? { width: `${scale * 100}%`, maxWidth: "none" } : undefined}
              className={scale > 1 ? "block h-auto" : "max-h-[70vh] w-full object-contain"}
            />
          ) : (
            <div className="flex h-72 items-center justify-center">
              <Package className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>

        {/* Prev / next */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => selectImage((safeIndex - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => selectImage((safeIndex + 1) % images.length)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Zoom controls */}
        {current && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 p-1 text-white">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="min-w-10 rounded-full px-2 py-1 text-xs font-medium transition-colors hover:bg-white/20"
            >
              {scale}x
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => selectImage(i)}
              className={`h-12 w-12 overflow-hidden rounded-lg border ${
                i === safeIndex ? "border-blue-600 ring-2 ring-blue-600/20" : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
