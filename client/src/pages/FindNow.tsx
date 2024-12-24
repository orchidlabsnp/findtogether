import { useState } from "react";
import { motion } from "framer-motion";
import SearchSection from "@/components/SearchSection";
import CaseCard from "@/components/CaseCard";
import { useQuery } from "@tanstack/react-query";
import type { Case } from "@db/schema";
import { Loader2 } from "lucide-react";

interface SearchSectionProps {
  onSearch: (query: string, searchType: string, imageResults?: Case[]) => void;
}

// Status priority order: open -> investigating -> resolved
const getStatusPriority = (status: string): number => {
  switch (status) {
    case 'open': return 0;
    case 'investigating': return 1;
    case 'resolved': return 2;
    default: return 3; // Any other status will be at the end
  }
};

export default function FindNow() {
  const [searchParams, setSearchParams] = useState({ query: "", type: "all" });
  const [imageResults, setImageResults] = useState<Case[] | null>(null);

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: [
      searchParams.query 
        ? `/api/cases/search?query=${searchParams.query}&searchType=${searchParams.type}` 
        : "/api/cases"
    ],
    enabled: !imageResults, // Disable the query when we have image results
  });

  // Sort cases by status priority and then by creation date within each status
  const sortedCases = [...(imageResults || cases || [])].sort((a, b) => {
    const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (statusDiff !== 0) return statusDiff;
    // If status is the same, sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Find Missing Children</h1>
        <SearchSection 
          onSearch={(query, searchType, results) => {
            if (results) {
              setImageResults(results);
            } else {
              setImageResults(null);
              setSearchParams({ query, type: searchType });
            }
          }} 
        />
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sortedCases.length > 0 ? (
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
      ) : (
        <div className="text-center text-gray-500 py-12">
          No cases found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
}