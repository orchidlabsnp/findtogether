import { useState } from "react";
import { motion } from "framer-motion";
import SearchSection from "@/components/SearchSection";
import CaseCard from "@/components/CaseCard";
import { useQuery } from "@tanstack/react-query";
import type { Case } from "@db/schema";

export default function FindNow() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: [searchQuery ? `/api/cases/search?query=${searchQuery}` : "/api/cases"],
  });

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Find Missing Children</h1>
        <SearchSection onSearch={setSearchQuery} />
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases?.map((case_, index) => (
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
      )}
    </div>
  );
}
