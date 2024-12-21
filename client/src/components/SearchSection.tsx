import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, FileImage, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface SearchSectionProps {
  onSearch: (query: string, searchType: string) => void;
}

export default function SearchSection({ onSearch }: SearchSectionProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchType === "image" && selectedImage) {
      const formData = new FormData();
      formData.append("files", selectedImage);
      
      try {
        const response = await fetch(`/api/cases/search?searchType=image`, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        const results = await response.json();
        onSearch("", "image", results);
      } catch (error) {
        console.error("Error performing image search:", error);
      }
    } else if (searchType.startsWith('child_')) {
      onSearch(searchType, 'case_type');
    } else {
      onSearch(query, searchType);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setSearchType("image");
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSearchType("all");
  };

  return (
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
              />
              <Select value={searchType} onValueChange={setSearchType}>
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
            <Button type="submit" className="whitespace-nowrap">
              {searchType === "location" ? (
                <MapPin className="h-4 w-4 mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
            <div className="relative">
              <Input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>
        </div>

        {selectedImage && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <FileImage className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1">
              {selectedImage.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearImage}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
