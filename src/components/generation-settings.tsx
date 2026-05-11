"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import { MODELS } from "./prompt-bar";

export interface GenerationConfig {
  aspectRatio: string;
  numberOfImages: number;
  resolution: string;
}

interface GenerationSettingsProps {
  selectedModelId: string;
  config: GenerationConfig;
  onConfigChange: (config: GenerationConfig) => void;
}

export function GenerationSettings({
  selectedModelId,
  config,
  onConfigChange,
}: GenerationSettingsProps) {
  const selectedModel = MODELS.find((m) => m.id === selectedModelId);
  if (!selectedModel) return null;

  const isPro = selectedModel.id.includes("pro");

  const handleAspectRatioChange = (value: string) => {
    onConfigChange({ ...config, aspectRatio: value });
  };

  const handleResolutionChange = (value: string) => {
    onConfigChange({ ...config, resolution: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Generation Settings</h4>
            <p className="text-sm text-muted-foreground">
              Customize your image output.
            </p>
          </div>
          
          <div className="grid gap-4">
            {/* Aspect Ratio - Available for all */}
            <div className="grid gap-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select value={config.aspectRatio} onValueChange={handleAspectRatioChange}>
                <SelectTrigger id="aspect-ratio">
                  <SelectValue placeholder="Select ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resolution/Size - Pro models */}
            {isPro && (
              <div className="grid gap-2">
                <Label htmlFor="resolution">
                  Image Size
                </Label>
                <Select value={config.resolution} onValueChange={handleResolutionChange}>
                  <SelectTrigger id="resolution">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1K">1K (Standard)</SelectItem>
                    <SelectItem value="2K">2K (High)</SelectItem>
                    <SelectItem value="4K">4K (Ultra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
