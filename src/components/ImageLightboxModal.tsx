import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { downloadImage } from '../utils/download';

interface ImageLightboxModalProps {
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  images,
  initialIndex = 0,
  title = 'Photographic Evidence Verification',
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentImage = images[currentIndex] || images[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setZoomLevel(1);
        setRotation(0);
      }
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setZoomLevel(1);
        setRotation(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownload = () => {
    downloadImage(currentImage, `evidence-photo-${currentIndex + 1}.png`);
  };

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none">
      {/* Top Header Control Bar */}
      <div className="flex items-center justify-between gap-4 text-white z-10 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white">{title}</h3>
            <p className="text-xs text-slate-400">
              Photo {currentIndex + 1} of {images.length} • High Resolution Telemetry Snapshot
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom In / Out / Rotate Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
            <button
              onClick={handleZoomIn}
              title="Zoom In (+)"
              className="p-1.5 hover:bg-white/20 rounded-lg text-slate-200 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              className="p-1.5 hover:bg-white/20 rounded-lg text-slate-200 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              title="Rotate 90°"
              className="p-1.5 hover:bg-white/20 rounded-lg text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            {(zoomLevel !== 1 || rotation !== 0) && (
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded-md hover:bg-emerald-500/30 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Image</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewer Area */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        {/* Previous Navigation Arrow */}
        {images.length > 1 && currentIndex > 0 && (
          <button
            onClick={() => {
              setCurrentIndex(prev => prev - 1);
              setZoomLevel(1);
              setRotation(0);
            }}
            className="absolute left-2 sm:left-4 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/20 cursor-pointer shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Navigation Arrow */}
        {images.length > 1 && currentIndex < images.length - 1 && (
          <button
            onClick={() => {
              setCurrentIndex(prev => prev + 1);
              setZoomLevel(1);
              setRotation(0);
            }}
            className="absolute right-2 sm:right-4 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/20 cursor-pointer shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Enlarged Image Display */}
        <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
          <img
            src={currentImage}
            alt="Enlarged Evidence"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out'
            }}
            className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/10"
          />
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 z-10 border-t border-white/10 pt-3">
        <div>
          Zoom Level: <span className="font-mono text-white font-bold">{Math.round(zoomLevel * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setZoomLevel(1);
                setRotation(0);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'bg-emerald-400 w-6' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
        <div className="hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 bg-white/20 text-white rounded font-mono text-[10px]">ESC</kbd> to exit
        </div>
      </div>
    </div>
  );
};
