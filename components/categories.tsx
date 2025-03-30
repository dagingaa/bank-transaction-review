"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Check, Edit, FileEdit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoriesProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

interface Preset {
  name: string;
  categories: string[];
}

// Local storage keys
const STORAGE_KEY = 'bank-transaction-viewer-categories';
const PRESETS_KEY = 'bank-transaction-viewer-category-presets';

// Default preset name
const DEFAULT_PRESET_NAME = "New preset";

export function Categories({ categories, onCategoriesChange }: CategoriesProps) {
  const [inputValue, setInputValue] = useState('');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // Auto-save categories to the current preset
  useEffect(() => {
    // Skip if no categories or no selected preset
    if (categories.length === 0 || !selectedPresetId || presets.length === 0) return;
    
    // Find the current preset
    const presetIndex = presets.findIndex(p => p.name === selectedPresetId);
    if (presetIndex >= 0) {
      // Only update if the categories have actually changed
      const currentPreset = presets[presetIndex];
      const currentCategoriesString = [...categories].sort().join(',');
      const presetCategoriesString = [...currentPreset.categories].sort().join(',');
      
      if (currentCategoriesString !== presetCategoriesString) {
        console.log(`Auto-saving categories to preset "${selectedPresetId}"`);
        
        // Update the preset with the current categories
        const updatedPresets = [...presets];
        updatedPresets[presetIndex] = {
          ...currentPreset,
          categories: [...categories]
        };
        
        // Update state and localStorage
        setPresets(updatedPresets);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
      }
    }
  }, [categories, selectedPresetId, presets]);

  // Load categories and presets from localStorage on component mount
  useEffect(() => {
    try {
      // First, try to load saved categories
      const savedCategories = localStorage.getItem(STORAGE_KEY);
      let loadedCategories: string[] = [];
      
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('Loaded categories from localStorage:', parsed);
            loadedCategories = parsed;
            onCategoriesChange(parsed);
          }
        } catch (e) {
          console.error('Error parsing saved categories:', e);
        }
      }

      // Then, try to load saved presets
      const savedPresets = localStorage.getItem(PRESETS_KEY);
      let loadedPresets: Preset[] = [];
      
      if (savedPresets) {
        try {
          const parsed = JSON.parse(savedPresets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('Loaded presets from localStorage:', parsed);
            loadedPresets = parsed;
            setPresets(parsed);
            
            // Select the first preset by default
            setSelectedPresetId(parsed[0].name);
          } else {
            console.warn('Saved presets are not in the expected format:', parsed);
          }
        } catch (e) {
          console.error('Error parsing saved presets:', e);
        }
      } else {
        console.log('No saved presets found in localStorage');
      }
      
      // If no presets exist, create a default one with current categories
      if (loadedPresets.length === 0) {
        const defaultPreset: Preset = {
          name: DEFAULT_PRESET_NAME,
          categories: loadedCategories
        };
        
        console.log('Creating default preset:', defaultPreset);
        setPresets([defaultPreset]);
        setSelectedPresetId(DEFAULT_PRESET_NAME);
        
        // Save to localStorage
        localStorage.setItem(PRESETS_KEY, JSON.stringify([defaultPreset]));
      }
    } catch (error) {
      console.error('General error loading from localStorage:', error);
    }
  }, [onCategoriesChange]);

  // Save categories to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories to localStorage:', error);
    }
  }, [categories]);
  
  // Save presets to localStorage when they change
  useEffect(() => {
    try {
      // Make sure we only save if presets is not empty
      if (presets.length > 0) {
        // Log for debugging
        console.log('Saving presets to localStorage:', presets);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
      }
    } catch (error) {
      console.error('Error saving presets to localStorage:', error);
    }
  }, [presets]);

  const handleAddCategories = () => {
    if (!inputValue.trim()) return;
    
    // Split input on commas and trim each category
    const newCategories = inputValue
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat && !categories.includes(cat)); // Filter out empty and existing categories
    
    if (newCategories.length > 0) {
      onCategoriesChange([...categories, ...newCategories]);
    }
    
    // Clear input after adding
    setInputValue('');
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    // Don't allow removing the default category "(Not set)"
    if (categoryToRemove === "(Not set)") return;
    
    onCategoriesChange(categories.filter(category => category !== categoryToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategories();
    }
  };

  // Create a new empty preset
  const handleCreatePreset = () => {
    if (!presetNameInput.trim()) return;
    
    const trimmedName = presetNameInput.trim();
    
    // Check if the preset name already exists
    if (presets.some(p => p.name === trimmedName)) {
      alert(`A preset named "${trimmedName}" already exists. Please choose another name.`);
      return;
    }
    
    // Create new empty preset
    const newPreset: Preset = {
      name: trimmedName,
      categories: [], // Start with empty categories
    };
    
    const newPresetsList = [...presets, newPreset];
    
    // Update state
    setPresets(newPresetsList);
    
    // Explicitly save to localStorage
    try {
      console.log('Creating new empty preset:', newPreset);
      localStorage.setItem(PRESETS_KEY, JSON.stringify(newPresetsList));
    } catch (error) {
      console.error('Error saving new preset to localStorage:', error);
    }
    
    // Switch to the new preset
    setSelectedPresetId(trimmedName);
    setPresetNameInput('');
    setPopoverOpen(false);
  };
  
  // Rename the current preset
  const handleRenamePreset = () => {
    if (!presetNameInput.trim() || !selectedPresetId) return;
    
    const trimmedName = presetNameInput.trim();
    
    // Check if the new name already exists (and it's not the current preset)
    if (presets.some(p => p.name === trimmedName && p.name !== selectedPresetId)) {
      alert(`A preset named "${trimmedName}" already exists. Please choose another name.`);
      return;
    }
    
    // Find and rename the current preset
    const presetIndex = presets.findIndex(p => p.name === selectedPresetId);
    if (presetIndex >= 0) {
      const updatedPresets = [...presets];
      updatedPresets[presetIndex] = {
        ...updatedPresets[presetIndex],
        name: trimmedName
      };
      
      // Update state
      setPresets(updatedPresets);
      setSelectedPresetId(trimmedName);
      
      // Save to localStorage
      try {
        console.log('Renamed preset from', selectedPresetId, 'to', trimmedName);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
      } catch (error) {
        console.error('Error saving renamed preset to localStorage:', error);
      }
    }
    
    setPresetNameInput('');
    setIsEditingName(false);
    setPopoverOpen(false);
  };

  // Load a preset's categories
  const handleLoadPreset = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      onCategoriesChange([...preset.categories]);
      setSelectedPresetId(presetName);
    }
  };

  // Delete a preset
  const handleDeletePreset = (presetName: string) => {
    const updatedPresets = presets.filter(p => p.name !== presetName);
    
    // Update state
    setPresets(updatedPresets);
    
    // Explicitly save to localStorage
    try {
      console.log('Directly saving updated presets after delete to localStorage:', updatedPresets);
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Error directly saving presets after delete to localStorage:', error);
    }
    
    // If we deleted the currently selected preset
    if (selectedPresetId === presetName) {
      // Select another preset if available
      if (updatedPresets.length > 0) {
        // Select the first available preset
        setSelectedPresetId(updatedPresets[0].name);
        // Update categories to match the newly selected preset
        onCategoriesChange([...updatedPresets[0].categories]);
      } else {
        // Create a new default preset if no presets remain
        const defaultPreset: Preset = {
          name: DEFAULT_PRESET_NAME,
          categories: [],
        };
        
        setPresets([defaultPreset]);
        setSelectedPresetId(DEFAULT_PRESET_NAME);
        localStorage.setItem(PRESETS_KEY, JSON.stringify([defaultPreset]));
        
        // Clear categories
        onCategoriesChange([]);
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage transaction categories</CardDescription>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select 
            value={selectedPresetId} 
            onValueChange={handleLoadPreset}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.length === 0 ? (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  No saved presets
                </div>
              ) : (
                presets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    <div className="flex w-full items-center">
                      <span className="truncate">
                        {preset.name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({preset.categories.length})
                        </span>
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {/* Preset management buttons */}
          {selectedPresetId && (
            <>
              <Button
                variant="outline"
                size="icon"
                title="Rename current preset"
                onClick={() => {
                  setIsEditingName(true);
                  setPopoverOpen(true);
                  setPresetNameInput(selectedPresetId);
                }}
              >
                <FileEdit className="h-4 w-4" />
                <span className="sr-only">Rename preset</span>
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                title="Delete current preset"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete the preset "${selectedPresetId}"?`)) {
                    handleDeletePreset(selectedPresetId);
                  }
                }}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Delete preset</span>
              </Button>
            </>
          )}
          
          {/* Create new preset button */}
          <Popover 
            open={popoverOpen} 
            onOpenChange={(open) => {
              setPopoverOpen(open);
              if (!open) {
                setIsEditingName(false);
                setPresetNameInput('');
              }
            }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                title="Create new preset"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Create new preset</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">
                  {isEditingName ? "Rename Preset" : "Create New Preset"}
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Preset name"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        isEditingName ? handleRenamePreset() : handleCreatePreset();
                      }
                    }}
                    // Auto-suggest current preset name when renaming
                    onFocus={() => {
                      if (isEditingName && selectedPresetId && !presetNameInput) {
                        setPresetNameInput(selectedPresetId);
                      }
                    }}
                    autoFocus
                  />
                  <Button 
                    onClick={isEditingName ? handleRenamePreset : handleCreatePreset}
                    disabled={!presetNameInput.trim()}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isEditingName ? "Rename" : "Create"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isEditingName 
                    ? "Enter a new name for this preset." 
                    : "Create a new preset to store a set of categories."}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add categories (comma separated)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleAddCategories} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
            {categories.map((category) => (
              <Badge 
                key={category} 
                variant={category === "(Not set)" ? "outline" : "secondary"} 
                className={`gap-1 px-2 py-1 ${category === "(Not set)" ? "border-dashed" : ""}`}
              >
                {category}
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className={`ml-1 rounded-full hover:bg-muted ${category === "(Not set)" ? "invisible" : ""}`}
                  disabled={category === "(Not set)"}
                  aria-hidden={category === "(Not set)"}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {category}</span>
                </button>
              </Badge>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground italic p-2">
                No categories added yet. Add your first category above.
              </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Tip: Add multiple categories at once by separating them with commas.
            </p>
            <p>
              Changes to categories are automatically saved to the current preset: <strong>{selectedPresetId}</strong>
            </p>
            <p>
              Create new preset collections using the + button in the top right.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}