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

    // Don't proceed if already searching
    if (isSearching) return;

    try {
      // Handle image search
      if (selectedImage) {
        console.log('Starting image search with file:', selectedImage.name);

        const formData = new FormData();
        formData.append("files", selectedImage);
        formData.append("searchType", "image");

        console.log('Sending image search request...');

        const response = await fetch(`/api/cases/search`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Image search failed:', errorText);
          toast({
            title: "Search Failed",
            description: "Failed to process image search. Please try again.",
            variant: "destructive",
          });
          throw new Error(errorText);
        }

        console.log('Image search completed, processing results...');
        const results = await response.json();
        console.log('Search results:', results);

        onSearch("", "image", results);
        return;
      }

      // Handle other search types
      if (searchType.startsWith('child_')) {
        onSearch(searchType, 'case_type');
      } else if (!query.trim() && searchType !== "image") {
        toast({
          title: "Search Error",
          description: "Please enter a search term or upload an image",
          variant: "destructive",
        });
        return;
      } else {
        onSearch(query, searchType);
      }
    } catch (error) {
      console.error("Error performing search:", error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setSearchType("image");

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
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
              <Button 
                type="submit" 
                className="whitespace-nowrap"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : searchType === "location" ? (
                  <MapPin className="h-4 w-4 mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {isSearching ? "Searching..." : selectedImage ? "Search with Image" : "Search"}
              </Button>
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
            <div className="bg-muted rounded-lg p-4 space-y-2">
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
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm font-medium">Analyzing image...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </Card>

      {searchType === "image" && !selectedImage && (
        <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
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
        </div>
      )}
    </div>
  );
}