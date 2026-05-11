"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: Date;
  sourceImage?: string;
  imageBytes?: string;
}

interface FocusedMediaViewProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  initialIndex: number;
}

export function FocusedMediaView({
  isOpen,
  onClose,
  mediaItems,
  initialIndex
}: FocusedMediaViewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const filmStripRef = useRef<HTMLDivElement>(null);
  const currentItem = mediaItems[currentIndex];

  // Update current index when initial index changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => Math.min(mediaItems.length - 1, prev + 1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, mediaItems.length]);

  // Scroll film strip to current item, with a center focus
  useEffect(() => {
    if (filmStripRef.current && isOpen && mediaItems.length > 0) {
      const currentThumb = filmStripRef.current.children[currentIndex] as HTMLElement;
      if (currentThumb) {
        currentThumb.scrollIntoView({
          behavior: 'auto', // Scroll instantly, let Framer Motion handle the animation
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [currentIndex, isOpen, mediaItems.length]);

  // Handle page-level wheel scroll with smooth sensitivity
  useEffect(() => {
    if (!isOpen) return;

    let accumulatedDelta = 0;
    const scrollThreshold = 100; // Threshold before triggering navigation
    let isScrolling = false;

    const handlePageWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Accumulate scroll delta
      accumulatedDelta += e.deltaY;
      
      // Only navigate when we've accumulated enough scroll
      if (Math.abs(accumulatedDelta) >= scrollThreshold && !isScrolling) {
        isScrolling = true;
        
        const direction = accumulatedDelta > 0 ? 1 : -1;
        setCurrentIndex((prev) => {
          const newIndex = prev + direction;
          return Math.max(0, Math.min(mediaItems.length - 1, newIndex));
        });
        
        // Reset accumulated delta
        accumulatedDelta = 0;
        
        // Prevent rapid consecutive scrolls
        setTimeout(() => {
          isScrolling = false;
        }, 150);
      }
    };

    // Add wheel event listener to the entire document
    document.addEventListener('wheel', handlePageWheel, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handlePageWheel);
    };
  }, [isOpen, mediaItems.length]);

  const handleDownload = () => {
    if (!currentItem) return;
    
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = `${currentItem.type}_${currentItem.id}.${currentItem.type === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (!isOpen || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
      >
        {/* Mobile Layout - Stacked vertically */}
        <div className="flex flex-col h-full md:hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {currentItem.type}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {mediaItems.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Media Display */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <div className="w-full h-full max-w-4xl max-h-full relative">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center"
              >
                {currentItem.type === 'image' ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={currentItem.url}
                      alt={currentItem.prompt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 80vw"
                    />
                  </div>
                ) : (
                  <video
                    src={currentItem.url}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </motion.div>
            </div>
          </div>

          {/* Metadata Panel */}
          <div className="border-t bg-card p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Prompt</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentItem.prompt}
              </p>
            </div>
            
            {currentItem.sourceImage && (
              <div>
                <div className="text-sm font-medium mb-2">Source Image</div>
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={currentItem.sourceImage}
                    alt="Source image"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Generated {formatTimestamp(currentItem.timestamp)}
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleDownload}
                className="w-full justify-start"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {currentItem.type}
              </Button>
            </div>
          </div>

          {/* Horizontal Film Strip */}
          <div className="border-t bg-background p-3">
            <motion.div
              ref={filmStripRef}
              layout="position"
              className="flex gap-2 overflow-x-auto scrollbar-hide py-3 scroll-smooth px-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {mediaItems.map((item, index) => {
                const isCurrent = index === currentIndex;

                const scale = isCurrent ? 1.15 : 1;
                
                return (
                  <motion.div
                    key={`${item.id}-${index}`}
                    layout
                    className={`flex-shrink-0 cursor-pointer rounded-md border-2 transition-colors duration-300 touch-manipulation ${
                      isCurrent
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-transparent'
                    }`}
                    onClick={() => setCurrentIndex(index)}
                    animate={{ scale }}
                    whileHover={{ scale: isCurrent ? 1.2 : 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ overflow: 'visible' }}
                  >
                    {item.type === 'image' ? (
                      <Image
                        src={item.url}
                        alt={item.prompt}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-sm"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-12 h-12 object-cover rounded-sm"
                        muted
                      />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Navigation Buttons */}
          <div className="p-4 border-t flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(mediaItems.length - 1, currentIndex + 1))}
              disabled={currentIndex === mediaItems.length - 1}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout - Side by side with film strip on the right */}
        <div className="hidden md:flex h-full">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {currentItem.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {mediaItems.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

                                      {/* Media Display */}
              <div className="flex-1 flex items-center justify-center p-8 min-h-0">
                <div className="w-full h-full max-w-4xl max-h-full relative">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {currentItem.type === 'image' ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={currentItem.url}
                          alt={currentItem.prompt}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 60vw"
                        />
                      </div>
                    ) : (
                      <video
                        src={currentItem.url}
                        controls
                        autoPlay
                        loop
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </motion.div>
                </div>
              </div>
          </div>

          {/* Sidebar and Film Strip Container */}
          <div className="flex bg-card/50 backdrop-blur">
            {/* Metadata Panel */}
            <div className="w-80 flex flex-col border-l">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Prompt */}
                <div>
                  <h3 className="font-medium mb-2">Prompt</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentItem.prompt}
                  </p>
                </div>
                
                {currentItem.sourceImage && (
                  <div>
                    <div className="text-sm font-medium mb-2">Source Image</div>
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <Image
                        src={currentItem.sourceImage}
                        alt="Source image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Generated {formatTimestamp(currentItem.timestamp)}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleDownload}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {currentItem.type}
                  </Button>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="p-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.min(mediaItems.length - 1, currentIndex + 1))}
                  disabled={currentIndex === mediaItems.length - 1}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Film Strip - Rightmost position */}
            <div
              className="w-20 bg-background/95 backdrop-blur flex flex-col"
              style={{ overflow: 'visible' }}
            >
              <motion.div
                ref={filmStripRef}
                layout="position"
                className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-hide scroll-smooth py-1"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  overflow: 'visible auto'
                }}
              >
                {mediaItems.map((item, index) => {
                  const isCurrent = index === currentIndex;

                  const scale = isCurrent ? 1.2 : 1;

                  return (
                    <motion.div
                      key={`${item.id}-${index}`}
                      layout
                      className={`flex-shrink-0 cursor-pointer rounded-md border-2 transition-colors duration-300 ease-in-out touch-manipulation w-12 h-12 mx-auto ${
                        isCurrent 
                          ? 'border-primary ring-2 ring-primary/50' 
                          : 'border-transparent'
                      }`}
                      onClick={() => setCurrentIndex(index)}
                      animate={{ scale }}
                      whileHover={{ scale: isCurrent ? 1.3 : 1.15 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ overflow: 'visible' }}
                    >
                      {item.type === 'image' ? (
                        <Image
                          src={item.url}
                          alt={item.prompt}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-sm"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover rounded-sm"
                          muted
                        />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 