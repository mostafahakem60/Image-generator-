"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, ExpandIcon, ClockIcon } from "lucide-react";
import { motion } from "framer-motion";
import { LightboxModal } from "@/components/lightbox-modal";
import Image from "next/image";

interface VideoGeneration {
  id: string;
  prompt: string;
  videos: string[];
  timestamp: Date;
  isLoading: boolean;
  sourceImage?: string; // For image-to-video conversions
}

interface VideoGridProps {
  generation: VideoGeneration;
  onViewFullscreen?: (generationId: string, videoIndex: number) => void;
}

export function VideoGrid({ generation, onViewFullscreen }: VideoGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleDownload = async (videoUrl: string, index: number) => {
    try {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `generated-video-${index + 1}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleViewFullscreen = (index: number) => {
    if (onViewFullscreen) {
      onViewFullscreen(generation.id, index);
    } else {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleRowMouseEnter = () => {
    // Play all videos
    videoRefs.current.forEach((video) => {
      if (video) {
        video.play();
      }
    });
  };

  const handleRowMouseLeave = () => {
    // Pause all videos
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
      }
    });
  };

  // Convert videos to lightbox format
  const lightboxItems = generation.videos.map((url, index) => ({
    type: "video" as const,
    url,
    alt: `Generated video ${index + 1} from: ${generation.prompt}`
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Videos grid - left side */}
      <div 
        className="flex-1"
        onMouseEnter={handleRowMouseEnter}
        onMouseLeave={handleRowMouseLeave}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {generation.videos.map((videoUrl, index) => (
            <motion.div
              key={index}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              onClick={() => handleViewFullscreen(index)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden aspect-video border-border/50 relative">
                {generation.isLoading ? (
                  <div className="absolute inset-0">
                    <Skeleton className="w-full h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    </Skeleton>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="absolute inset-0"
                  >
                    {/* Video player */}
                    <video 
                      ref={(el) => { videoRefs.current[index] = el; }}
                      className="absolute inset-0 w-full h-full object-cover"
                      poster={generation.sourceImage}
                      preload="metadata"
                      muted
                      loop
                    >
                      <source src={videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Controls at bottom - only visible on hover */}
                    <motion.div
                      className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex gap-1 sm:gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(videoUrl, index);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <DownloadIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFullscreen(index);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <ExpandIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Prompt information - right side */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="lg:sticky lg:top-24">
          <div className="space-y-3">
            {/* Prompt */}
            <div>
              <h3 className="font-medium text-foreground text-lg leading-relaxed">
                {generation.prompt}
              </h3>
            </div>
            
            {/* Format badge */}
            <div>
              <Badge variant="outline" className="text-xs">
                Video
              </Badge>
            </div>
            
            {/* Show source image thumbnail if it's an image-to-video conversion */}
            {generation.sourceImage && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Source Image:</div>
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={generation.sourceImage}
                    alt="Source image"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Time generated */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon className="w-3 h-3" />
              <span className="whitespace-nowrap">{formatTimeAgo(generation.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        initialIndex={lightboxIndex}
      />
    </div>
  );
} 