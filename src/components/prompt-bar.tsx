"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, VideoIcon, ChevronDown, Sparkles } from "lucide-react";
import { SettingsDropdown } from "@/components/settings-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GenerationSettings, GenerationConfig } from "@/components/generation-settings";

export const MODELS = [
  { id: "gemini-2.5-flash-image", name: "Nano Banana", type: "image" },
  { id: "gemini-3-pro-image-preview", name: "Nano Banana Pro", type: "image" },
  { id: "imagen-4.0-generate-001", name: "Imagen", type: "image" },
] as const;

interface PromptBarProps {
  onGenerate?: (modelId: string, type: "image" | "video", prompt: string, config: GenerationConfig) => void;
}

export function PromptBar({ onGenerate }: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<typeof MODELS[number]>(MODELS[0]);
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: "1:1",
    numberOfImages: 1,
    resolution: "1080p" // Default for video, will be ignored/overridden for image if needed
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Call the parent handler to add new generation
    if (onGenerate) {
      onGenerate(selectedModel.id, selectedModel.type, prompt.trim(), config);
    }
    
    // Clear the prompt
    setPrompt("");
    
    // Reset generating state
    setTimeout(() => {
      setIsGenerating(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="w-full py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          {/* Main prompt input */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  placeholder={`Describe what you want to create with ${selectedModel.name}...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-2 h-10 text-base bg-card border-input"
                  disabled={isGenerating}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 px-3 min-w-[140px] justify-between hidden sm:flex">
                    <span className="flex items-center gap-2">
                      {selectedModel.type === "image" ? <ImageIcon className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                      {selectedModel.name}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Image Models</DropdownMenuLabel>
                  {MODELS.filter(m => m.type === "image").map(model => (
                    <DropdownMenuItem 
                      key={model.id} 
                      onClick={() => {
                        setSelectedModel(model);
                        // Reset config when model changes to sensible defaults
                        setConfig(prev => ({
                          ...prev,
                          aspectRatio: "1:1",
                          resolution: "1K"
                        }));
                      }}
                      className="justify-between"
                    >
                      {model.name}
                      {selectedModel.id === model.id && <Sparkles className="w-3 h-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="h-10 px-4"
              >
                {isGenerating ? (
                  <span className="animate-pulse">Generating...</span>
                ) : (
                  <>
                    Generate <span className="hidden sm:inline">{selectedModel.type === "image" ? "Image" : "Video"}</span>
                  </>
                )}
              </Button>
              
              <div className="hidden sm:flex gap-2 items-center">
                {selectedModel.type === "image" && (
                  <Select 
                    value={config.numberOfImages.toString()} 
                    onValueChange={(val) => setConfig(prev => ({ ...prev, numberOfImages: parseInt(val) }))}
                  >
                    <SelectTrigger className="w-[110px] h-10">
                      <SelectValue placeholder="Count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Image</SelectItem>
                      <SelectItem value="2">2 Images</SelectItem>
                      <SelectItem value="3">3 Images</SelectItem>
                      <SelectItem value="4">4 Images</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <GenerationSettings 
                  selectedModelId={selectedModel.id}
                  config={config}
                  onConfigChange={setConfig}
                />
                <SettingsDropdown />
              </div>
            </div>
          </div>

          {/* Mobile model selector */}
          <div className="flex flex-col sm:hidden gap-3">
            <div className="flex gap-2 w-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 h-10 justify-between">
                    <span className="flex items-center gap-2">
                      {selectedModel.type === "image" ? <ImageIcon className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                      <span className="truncate">{selectedModel.name}</span>
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuLabel>Image Models</DropdownMenuLabel>
                  {MODELS.filter(m => m.type === "image").map(model => (
                    <DropdownMenuItem 
                      key={model.id} 
                      onClick={() => {
                        setSelectedModel(model);
                         setConfig(prev => ({
                          ...prev,
                          aspectRatio: "1:1",
                          resolution: "1K"
                        }));
                      }}
                      className="justify-between"
                    >
                      {model.name}
                      {selectedModel.id === model.id && <Sparkles className="w-3 h-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedModel.type === "image" && (
                <Select 
                  value={config.numberOfImages.toString()} 
                  onValueChange={(val) => setConfig(prev => ({ ...prev, numberOfImages: parseInt(val) }))}
                >
                  <SelectTrigger className="w-[100px] h-10 shrink-0">
                    <SelectValue placeholder="Count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Image</SelectItem>
                    <SelectItem value="2">2 Images</SelectItem>
                    <SelectItem value="3">3 Images</SelectItem>
                    <SelectItem value="4">4 Images</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex gap-2 items-center w-full">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 h-10"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
              <GenerationSettings 
                selectedModelId={selectedModel.id}
                config={config}
                onConfigChange={setConfig}
              />
              <SettingsDropdown />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 