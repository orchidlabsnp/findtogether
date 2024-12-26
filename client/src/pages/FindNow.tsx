import { useState } from "react";
import { motion } from "framer-motion";
import SearchSection from "@/components/SearchSection";
import CaseCard from "@/components/CaseCard";
import { useQuery } from "@tanstack/react-query";
import type { Case } from "@db/schema";
import { ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchSectionProps {
  onSearch: (query: string, searchType: string, imageResults?: Case[]) => void;
}

// Status priority order: open -> investigating -> resolved
const getStatusPriority = (status: string): number => {
  switch (status) {
    case 'open': return 0;
    case 'investigating': return 1;
    case 'resolved': return 2;
    default: return 3;
  }
};

export default function FindNow() {
  const [searchParams, setSearchParams] = useState({ query: "", type: "text" });
  const [imageResults, setImageResults] = useState<Case[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: [
      searchParams.query 
        ? `/api/cases/search?query=${encodeURIComponent(searchParams.query)}` 
        : "/api/cases"
    ],
    enabled: !imageResults, // Disable the query when we have image results
  });

  const handleSearch = async (query: string, searchType: string, results?: Case[]) => {
    setIsSearching(true);
    try {
      if (results) {
        setImageResults(results);
        if (results.length === 0) {
          toast({
            title: "No Matches Found",
            description: "No similar cases were found in our database.",
            variant: "default",
          });
        } else {
          toast({
            title: "Search Complete",
            description: `Found ${results.length} potential matches.`,
            variant: "default",
          });
        }
      } else {
        setImageResults(null);
        setSearchParams({ query, type: searchType });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Sort cases by status priority and then by creation date within each status
  const sortedCases = [...(imageResults || cases || [])].sort((a, b) => {
    const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (statusDiff !== 0) return statusDiff;
    // If status is the same, sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container mx-auto px-6 py-12 mt-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Find Missing Children</h1>
        <SearchSection 
          onSearch={handleSearch}
          isSearching={isSearching}
        />
      </motion.div>

      {isLoading || isSearching ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sortedCases.length > 0 ? (
        <div className="space-y-6">
          {imageResults && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Search Results
              </h2>
              <p className="text-sm text-gray-600">
                Found {sortedCases.length} potential matches based on the uploaded image.
                Results are sorted by relevance and status.
              </p>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCases.map((case_, index) => (
              <motion.div
                key={case_.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CaseCard case={case_} />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">No cases found</p>
          <p className="text-sm">Try adjusting your search criteria or upload a different image.</p>
        </div>
      )}
    </div>
  );
}