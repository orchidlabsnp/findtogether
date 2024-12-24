import { useQuery } from "@tanstack/react-query";
import { Case } from "@db/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, MapPin, Loader2, Tag, Clock, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { format } from "date-fns";

interface UserDashboardProps {
  address: string;
}

export default function UserDashboard({ address }: UserDashboardProps) {
  // Normalize address to lowercase for consistent comparison
  const normalizedAddress = address.toLowerCase();

  const { data: userCases, isLoading, error } = useQuery<Case[]>({
    queryKey: [`/api/cases/user/${normalizedAddress}`],
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Consider data stale immediately
  });

  console.log("UserDashboard - Address:", normalizedAddress);
  console.log("UserDashboard - Cases:", userCases);
  console.log("UserDashboard - Loading:", isLoading);
  console.log("UserDashboard - Error:", error);

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

  const getStatusIcon = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'investigating':
        return <Search className="h-3 w-3 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
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
      <div className="flex justify-center items-center p-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error("Error fetching user cases:", error);
    return (
      <div className="text-center p-2 text-red-600">
        <AlertCircle className="h-6 w-6 mx-auto mb-1" />
        <p className="text-xs">Error loading cases. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-bold flex items-center gap-1">
              <Bell className="h-4 w-4 text-primary" />
              Your Reported Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <AnimatePresence mode="wait">
              {!userCases?.length ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex flex-col items-center gap-1">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                    <p className="text-xs text-gray-600 font-medium">No cases reported yet</p>
                    <p className="text-xs text-gray-500">
                      Your reported cases will appear here
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="grid gap-2">
                  {userCases.map((case_, index) => (
                    <motion.div
                      key={case_.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden hover:shadow-sm transition-shadow duration-200">
                        <CardContent className="p-3">
                          <div className="flex flex-col space-y-2">
                            {/* Header with Case ID and Status */}
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-gray-500">#{case_.id}</span>
                                <h3 className="text-xs font-semibold text-gray-900">{case_.childName}</h3>
                              </div>
                              <Badge 
                                variant="outline"
                                className={`flex items-center gap-1 px-2 py-0.5 text-xs ${getStatusColor(case_.status)}`}
                              >
                                {getStatusIcon(case_.status)}
                                <span className="font-medium">{case_.status?.toUpperCase()}</span>
                              </Badge>
                            </div>

                            {/* Case Type and Age */}
                            <div className="flex flex-wrap gap-2">
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3 text-gray-600" />
                                <span className="text-xs">{getCaseTypeLabel(case_.caseType)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-600" />
                                <span className="text-xs">Age: {case_.age}</span>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{case_.location}</span>
                            </div>

                            {/* Description */}
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                {case_.description}
                              </p>
                            </div>

                            {/* Contact Info */}
                            <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
                              <strong>Contact:</strong> {case_.contactInfo}
                            </div>

                            {/* Timestamps */}
                            {case_.createdAt && (
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Created: {format(new Date(case_.createdAt), 'Pp')}</span>
                                </div>
                                {case_.updatedAt && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Updated: {format(new Date(case_.updatedAt), 'Pp')}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Case Image */}
                            {case_.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={case_.imageUrl} 
                                  alt={`Case ${case_.id} - ${case_.childName}`}
                                  className="rounded w-full h-32 object-cover shadow-sm"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
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