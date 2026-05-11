"use client";

import { useState, useEffect } from "react";
import { ImageGrid } from "@/components/image-grid";
import { VideoGrid } from "@/components/video-grid";
import { LoadingGrid } from "@/components/loading-grid";
import { FocusedMediaView } from "@/components/focused-media-view";
import { motion } from "framer-motion";
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from "@/components/generation-settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
const sampleImage1 = "https://www.gstatic.com/aistudio/starter-apps/ai-media-generator-template/generated-image-1.png";
const sampleImage2 = "https://www.gstatic.com/aistudio/starter-apps/ai-media-generator-template/generated-image-2.png";
const sampleImage3 = "https://www.gstatic.com/aistudio/starter-apps/ai-media-generator-template/generated-image-3.png";
const sampleImage4 = "https://www.gstatic.com/aistudio/starter-apps/ai-media-generator-template/generated-image-4.png";

// Add window.aistudio type definition
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface ImageGeneration {
  id: string;
  prompt: string;
  images: Array<{
    url: string;
    imageBytes?: string;
    isSample?: boolean;
  }>;
  timestamp: Date;
  isLoading: boolean;
}

interface VideoGeneration {
  id: string;
  prompt: string;
  videos: string[];
  timestamp: Date;
  isLoading: boolean;
  sourceImage?: string;
}

interface LoadingGeneration {
  id: string;
  prompt: string;
  type: "image" | "video";
  timestamp: Date;
  isLoading: true;
  sourceImage?: string;
}

type Generation = ImageGeneration | VideoGeneration | LoadingGeneration;

// Sample data for demonstration with real generated content
const createSampleGenerations = (): Generation[] => [
  // Video generation (most recent)
  {
    id: "sample-video-1",
    prompt: "a race car formula 1 style in a highspeed track",
    videos: [
      "https://www.gstatic.com/aistudio/starter-apps/ai-media-generator-template/video-1.mp4",
      "https://www.gstatic.com/aistudio/starter-apps/ai-media-generator-template/video-2.mp4"
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    isLoading: false
  } as VideoGeneration,
  // Image generation 
  {
    id: "sample-image-1",
    prompt: "A majestic ice warrior in blue armor standing in a snowy landscape",
    images: [
      { url: sampleImage1, isSample: true },
      { url: sampleImage2, isSample: true }, 
      { url: sampleImage3, isSample: true },
      { url: sampleImage4, isSample: true }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    isLoading: false
  } as ImageGeneration
];

export function ContentGrid({ 
  onNewGeneration
}: { 
  onNewGeneration?: (handler: (modelId: string, type: "image" | "video", prompt: string, config: GenerationConfig) => void) => void;
}) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{
    modelId: string;
    type: "image" | "video";
    prompt: string;
    config: GenerationConfig;
  } | null>(null);
  const [focusedView, setFocusedView] = useState<{
    isOpen: boolean;
    mediaItems: Array<{
      id: string;
      type: 'image' | 'video';
      url: string;
      prompt: string;
      timestamp: Date;
      sourceImage?: string;
    }>;
    initialIndex: number;
  }>({ isOpen: false, mediaItems: [], initialIndex: 0 });

  // Initialize with sample data after mount to avoid hydration issues
  useEffect(() => {
    setGenerations(createSampleGenerations());
  }, []);

  // Helper function to gather all media items from generations
  const getAllMediaItems = () => {
    const mediaItems: Array<{
      id: string;
      type: 'image' | 'video';
      url: string;
      prompt: string;
      timestamp: Date;
      sourceImage?: string;
    }> = [];

    generations.forEach((generation) => {
      if (!generation.isLoading) {
        if ('images' in generation) {
          // Image generation
          generation.images.forEach((image, index) => {
            mediaItems.push({
              id: `${generation.id}-img-${index}`,
              type: 'image',
              url: image.url,
              prompt: generation.prompt,
              timestamp: generation.timestamp,
            });
          });
        } else if ('videos' in generation) {
          // Video generation
          generation.videos.forEach((video, index) => {
            mediaItems.push({
              id: `${generation.id}-vid-${index}`,
              type: 'video',
              url: video,
              prompt: generation.prompt,
              timestamp: generation.timestamp,
              sourceImage: generation.sourceImage,
            });
          });
        }
      }
    });

    // Sort by timestamp (newest first)
    return mediaItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Function to open focused view
  const openFocusedView = (generationId: string, itemIndex: number) => {
    const allMediaItems = getAllMediaItems();
    
    // Find the specific item index in the global list
    let globalIndex = 0;
    for (let i = 0; i < generations.length; i++) {
      const gen = generations[i];
      if (gen.isLoading) continue;
      
      if (gen.id === generationId) {
        globalIndex += itemIndex;
        break;
      }
      
      if ('images' in gen) {
        globalIndex += gen.images.length;
      } else if ('videos' in gen) {
        globalIndex += gen.videos.length;
      }
    }

    setFocusedView({
      isOpen: true,
      mediaItems: allMediaItems,
      initialIndex: globalIndex,
    });
  };

  const ensureApiKey = async (modelId: string): Promise<boolean> => {
    const paidModels = ['gemini-3-pro-image-preview'];
    if (paidModels.includes(modelId)) {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setApiKeyDialogOpen(true);
          return false;
        }
      }
    }
    return true;
  };

  const handleNewGeneration = async (modelId: string, type: "image" | "video", prompt: string, config: GenerationConfig) => {
    const hasKey = await ensureApiKey(modelId);
    if (!hasKey) {
      setPendingGeneration({ modelId, type, prompt, config });
      return;
    }

    const loadingGeneration: LoadingGeneration = {
      id: `loading-${Date.now()}`,
      prompt,
      type,
      timestamp: new Date(),
      isLoading: true
    };

    // Add new loading generation at the top
    setGenerations(prev => [loadingGeneration, ...prev]);
    setHasPrompted(true);

    try {
      // Initialize GoogleGenAI
      // Use NEXT_PUBLIC_GEMINI_API_KEY as the default key
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

      if (type === "image") {
        let imageUrls: { url: string; imageBytes?: string }[] = [];

        if (modelId.includes("imagen")) {
          // Use generateImages for Imagen models
          const response = await ai.models.generateImages({
            model: modelId,
            prompt,
            config: {
              numberOfImages: config.numberOfImages,
              outputMimeType: 'image/jpeg',
              aspectRatio: config.aspectRatio,
            },
          });
          
          if (response.generatedImages) {
            imageUrls = response.generatedImages
              .filter(img => img.image?.imageBytes)
              .map(img => ({
                url: `data:image/jpeg;base64,${img.image!.imageBytes}`,
                imageBytes: img.image!.imageBytes
              }));
          }
        } else {
          // Use generateContent for Gemini models (Nano Banana, etc.)
          // Since generateContent only returns 1 image per request, we run them in parallel
          const generatePromises = Array.from({ length: config.numberOfImages }).map(async () => {
            let retries = 3;
            while (retries > 0) {
              try {
                const response = await ai.models.generateContent({
                  model: modelId,
                  contents: { parts: [{ text: prompt }] },
                  config: {
                    imageConfig: {
                      aspectRatio: config.aspectRatio,
                      // imageSize is only supported for Pro model
                      imageSize: modelId === 'gemini-3-pro-image-preview' ? config.resolution : undefined
                    }
                  }
                });

                // Extract images from response
                if (response.candidates?.[0]?.content?.parts) {
                  for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                      return {
                        url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                        imageBytes: part.inlineData.data
                      };
                    }
                  }
                }
                
                // If we get here, the response didn't contain an image (e.g., safety filter)
                console.warn('No image found in response, retrying...', response);
              } catch (err) {
                console.warn('Error generating image, retrying...', err);
              }
              
              retries--;
              if (retries > 0) {
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            return null;
          });

          const results = await Promise.all(generatePromises);
          imageUrls.push(...results.filter((res): res is { url: string; imageBytes: string } => res !== null));
        }

        if (imageUrls.length > 0) {
          const completedGeneration: ImageGeneration = {
            id: loadingGeneration.id,
            prompt: loadingGeneration.prompt,
            images: imageUrls,
            timestamp: loadingGeneration.timestamp,
            isLoading: false
          };

          setGenerations(prev => prev.map(gen => 
            gen.id === loadingGeneration.id ? completedGeneration : gen
          ));
        } else {
          throw new Error('No images generated');
        }

      } else {
        // Video Generation
        let operation = await ai.models.generateVideos({
          model: modelId,
          prompt,
          config: {
            numberOfVideos: 1,
            resolution: config.resolution as "720p" | "1080p",
            aspectRatio: config.aspectRatio as "16:9" | "9:16"
          }
        });

        // Poll for completion
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
          const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
          const videoUrl = `${videoUri}&key=${apiKey}`;
          
          const completedGeneration: VideoGeneration = {
            id: loadingGeneration.id,
            prompt: loadingGeneration.prompt,
            videos: [videoUrl],
            timestamp: loadingGeneration.timestamp,
            isLoading: false
          };

          setGenerations(prev => prev.map(gen => 
            gen.id === loadingGeneration.id ? completedGeneration : gen
          ));
        } else {
          throw new Error('No video generated');
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setGenerations(prev => prev.filter(gen => gen.id !== loadingGeneration.id));
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Use useEffect to avoid setState during render
  useEffect(() => {
    if (onNewGeneration) {
      onNewGeneration(handleNewGeneration);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="space-y-8">
        {!hasPrompted ? (
          <div className="p-6 bg-muted/30 rounded-xl border border-border/50 text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to your AI Media Template</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Generate AI-powered images and videos from text prompts. Customize this template to build your own media generation app.
            </p>
          </div>
        ) : (
          <div className="p-6 bg-muted/30 rounded-xl border border-border/50 text-center">
            <h2 className="text-xl font-semibold mb-3">App Remix Ideas</h2>
            <div className="text-muted-foreground max-w-2xl mx-auto text-sm space-y-3">
              <p>Here are some ways you could expand this app template:</p>
              <ul className="list-disc text-left pl-8 space-y-1 inline-block">
                <li>Add a gallery view to save your favorite generations</li>
                <li>Implement a &quot;style preset&quot; dropdown (e.g., Cyberpunk, Watercolor, Photorealistic)</li>
                <li>Add an image editor to crop or apply filters before animating</li>
                <li>Connect to Firebase to save your generation history across sessions</li>
              </ul>
            </div>
          </div>
        )}

      {generations.map((generation) => (
        <motion.div
          key={generation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {generation.isLoading ? (
            <LoadingGrid 
              prompt={generation.prompt}
              type={"type" in generation ? generation.type : "image"}
              sourceImage={"sourceImage" in generation ? generation.sourceImage : undefined}
            />
          ) : "images" in generation ? (
            <ImageGrid 
              generation={generation}
              onViewFullscreen={openFocusedView}
            />
          ) : (
            <VideoGrid 
              generation={generation} 
              onViewFullscreen={openFocusedView}
            />
          )}
        </motion.div>
      ))}
    </div>

      <FocusedMediaView
        isOpen={focusedView.isOpen}
        onClose={() => setFocusedView(prev => ({ ...prev, isOpen: false }))}
        mediaItems={focusedView.mediaItems}
        initialIndex={focusedView.initialIndex}
      />

      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Required</DialogTitle>
            <DialogDescription className="space-y-4 pt-4 text-base">
              <p>
                The model you selected requires a paid Google Cloud API key. 
                You can learn more about billing and pricing in the{" "}
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gemini API billing documentation
                </a>.
              </p>
              <p>
                Please select your API key from a paid Google Cloud project to continue.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (window.aistudio && window.aistudio.openSelectKey) {
                await window.aistudio.openSelectKey();
                setApiKeyDialogOpen(false);
                // If there's a pending generation, trigger it
                if (pendingGeneration) {
                  handleNewGeneration(
                    pendingGeneration.modelId,
                    pendingGeneration.type,
                    pendingGeneration.prompt,
                    pendingGeneration.config
                  );
                  setPendingGeneration(null);
                }
              }
            }}>
              Select API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 