import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export function ImageViewer({ isOpen, onClose, imageUrl, alt }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-slate-950 border-slate-800">
        <div className="relative w-full h-[95vh] flex items-center justify-center overflow-hidden">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 bg-slate-900/80 hover:bg-slate-800 text-white"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Control buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-slate-900/80 rounded-lg p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-slate-800"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-white hover:bg-slate-800 px-4"
            >
              Reset
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="text-white hover:bg-slate-800"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
          </div>

          {/* Image */}
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={alt}
                fill
                className="object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
                priority
              />
            </div>
          </div>

          {/* Zoom indicator */}
          <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-lg text-sm">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}