import { useQuery } from "@tanstack/react-query";
import { Case } from "@db/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, MapPin, Loader2, Tag } from "lucide-react";
import { format } from "date-fns";

interface UserDashboardProps {
  address: string;
}

export default function UserDashboard({ address }: UserDashboardProps) {
  // Normalize address to lowercase for consistent comparison
  const normalizedAddress = address.toLowerCase();

  const { data: userCases, isLoading } = useQuery<Case[]>({
    queryKey: [`/api/cases/user/${normalizedAddress}`],
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Consider data stale immediately
  });

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCaseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'child_missing': 'Missing Child',
      'child_labour': 'Child Labour',
      'child_harassment': 'Child Harassment'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 sm:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Your Reported Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {!userCases?.length ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-gray-500 text-center py-4"
                >
                  You haven't reported any cases yet.
                </motion.p>
              ) : (
                <div className="grid gap-4">
                  {userCases.map((case_, index) => (
                    <motion.div
                      key={case_.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="font-semibold text-base sm:text-lg truncate">Case #{case_.id}: {case_.childName}</h3>
                          <p className="text-sm text-gray-600 truncate">Location: {case_.location}</p>
                          <p className="text-sm text-gray-600">Type: {getCaseTypeLabel(case_.caseType)}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={`${getStatusColor(case_.status)}`}
                        >
                          {case_.status?.toUpperCase() || 'PENDING'}
                        </Badge>
                      </div>

                      <div className="mt-2 sm:mt-4">
                        <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words leading-relaxed sm:leading-loose line-clamp-3 hover:line-clamp-none transition-all duration-200 cursor-pointer">
                          {case_.description}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {case_.createdAt ? format(new Date(case_.createdAt), 'PPP') : 'Date not available'}
                          </span>
                        </div>
                        {case_.status === 'investigating' && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Bell className="h-4 w-4 flex-shrink-0" />
                            <span>Case is under active investigation</span>
                          </div>
                        )}
                      </div>

                      {case_.imageUrl && (
                        <div className="mt-4">
                          <img 
                            src={case_.imageUrl} 
                            alt={`Case ${case_.id}`}
                            className="rounded-md w-full max-w-xs object-cover"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}