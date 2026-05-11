"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { KeyIcon, SettingsIcon } from "lucide-react";

export function SettingsDropdown() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load saved dark mode preference
    const savedDarkMode = localStorage.getItem("ai-media-template-dark-mode");
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true");
    }
  }, []);

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem("ai-media-template-dark-mode", checked.toString());
    
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLinkApiKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
      } catch (error) {
        console.error("Failed to open API key selector:", error);
      }
    } else {
      console.warn("AI Studio API not available");
      alert("API Key selection is not available in this environment.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-4">
        <div className="space-y-4">
          {/* API Key Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              API Configuration
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLinkApiKey}
              className="w-full justify-start"
            >
              <KeyIcon className="w-4 h-4 mr-2" />
              Link Google Cloud Project
            </Button>
            <p className="text-xs text-muted-foreground">
              Required for Veo and Pro models.
            </p>
          </div>

          <DropdownMenuSeparator />

          {/* Dark Mode Section */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="dark-mode" className="text-sm font-medium">
              Dark Mode
            </Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 