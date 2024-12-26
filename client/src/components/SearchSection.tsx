import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, FileImage, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface SearchSectionProps {
  onSearch: (query: string, searchType: string, imageResults?: any[]) => void;
  isSearching?: boolean;
}

export default function SearchSection({ onSearch, isSearching = false }: SearchSectionProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search form submitted:", { searchType, hasImage: !!selectedImage, query });

    if (isSearching) {
      console.log("Search already in progress, ignoring submission");
      return;
    }

    try {
      if (selectedImage) {
        console.log("Starting image search with file:", {
          name: selectedImage.name,
          size: selectedImage.size,
          type: selectedImage.type
        });

        const formData = new FormData();
        formData.append("files", selectedImage);
        formData.append("searchType", "image");

        console.log("Sending image search POST request to /api/cases/search");
        const response = await fetch("/api/cases/search", {
          method: "POST",
          body: formData,
        });

        console.log("Image search response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Image search failed:", errorText);
          toast({
            title: "Search Failed",
            description: `Failed to process image search: ${errorText}`,
            variant: "destructive",
          });
          throw new Error(errorText);
        }

        const results = await response.json();
        console.log("Image search results:", results);
        onSearch("", "image", results);
        return;
      }

      // Handle text-based searches
      if (!query.trim() && searchType !== "image") {
        console.log("Empty query for non-image search");
        toast({
          title: "Search Error",
          description: "Please enter a search term or upload an image",
          variant: "destructive",
        });
        return;
      }

      console.log("Performing text-based search:", { searchType, query });

      // For case type searches
      if (searchType.startsWith('child_')) {
        console.log("Performing case type search");
        onSearch(searchType, 'case_type');
        return;
      }

      // For all other searches
      console.log("Performing general search");
      onSearch(query, searchType);

    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "An error occurred while searching",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Image selection triggered");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Image selected:", {
        name: file.name,
        size: file.size,
        type: file.type
      });

      setSelectedImage(file);
      setSearchType("image");

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("Preview image created");
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    console.log("Clearing selected image");
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSearchType("all");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter search terms..."
                  className="flex-1"
                  disabled={searchType === "image" || isSearching}
                />
                <Select 
                  value={searchType} 
                  onValueChange={setSearchType}
                  disabled={isSearching}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Search type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="case_type">Case Type</SelectItem>
                    <SelectItem value="child_missing">Missing Child</SelectItem>
                    <SelectItem value="child_labour">Child Labor</SelectItem>
                    <SelectItem value="child_harassment">Child Harassment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <motion.div
                initial={false}
                animate={{ 
                  scale: isSearching ? 0.95 : 1,
                  opacity: isSearching ? 0.8 : 1 
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  type="submit" 
                  className="whitespace-nowrap relative"
                  disabled={isSearching}
                >
                  <AnimatePresence mode="wait">
                    {isSearching ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        {searchType === "location" ? (
                          <MapPin className="h-4 w-4 mr-2" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        {selectedImage ? "Search with Image" : "Search"}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
              <div className="relative">
                <Input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={isSearching}
                />
                <Button
                  type="button"
                  variant={selectedImage ? "secondary" : "outline"}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSearching}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            </div>
          </div>

          {selectedImage && imagePreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-muted rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedImage.name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearImage}
                  disabled={isSearching}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-full max-w-md mx-auto">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg w-full h-48 object-cover"
                />
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm font-medium">Analyzing image...</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </form>
      </Card>

      {searchType === "image" && !selectedImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/50"
        >
          <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload an Image to Search</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a clear photo to search for similar cases in our database
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSearching}
          >
            <FileImage className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
        </motion.div>
      )}
    </div>
  );
}