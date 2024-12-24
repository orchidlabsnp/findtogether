import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Case } from "@db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Tag, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

const ADMIN_ADDRESS = "0x5A498a4520b56Fe0119Bd3D8D032D53c65c035a7";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingCaseId, setUpdatingCaseId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to access admin features",
        variant: "destructive"
      });
      setLocation("/");
      return;
    }

    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then((accounts: string[]) => {
        const address = accounts[0];
        setCurrentAddress(address);

        if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
          toast({
            title: "Access Denied",
            description: "Only admin can access this page",
            variant: "destructive"
          });
          setLocation("/");
        }
      })
      .catch(() => {
        toast({
          title: "Authentication Failed",
          description: "Please connect your wallet",
          variant: "destructive"
        });
        setLocation("/");
      });
  }, []);

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
    gcTime: 0, 
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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

  const handleStatusUpdate = async (caseId: number, newStatus: string) => {
    setIsUpdating(true);
    setUpdatingCaseId(caseId);
    try {
      const response = await fetch(`/api/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/cases"] });

      toast({
        title: "Status Updated",
        description: "Case status has been successfully updated",
      });

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setUpdatingCaseId(null);
    }
  };

  if (!currentAddress || currentAddress.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-[100vw] px-2 sm:px-4 lg:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 sm:space-y-6 w-full"
        >
          <h1 className="text-2xl sm:text-3xl font-bold px-2 mt-5">Admin Dashboard</h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Active Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    <div className="grid gap-4">
                      {cases?.filter(c => c.status === 'open' || c.status === 'investigating').map((case_, index) => (
                        <motion.div
                          key={case_.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="overflow-hidden hover:shadow-sm transition-shadow duration-200 max-w-xl">
                            <CardContent className="p-2">
                              <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-xs text-gray-500">#{case_.id}</span>
                                    <h3 className="text-xs font-semibold text-gray-900">{case_.childName}</h3>
                                  </div>
                                  <Select
                                    value={case_.status || undefined}
                                    onValueChange={(value) => handleStatusUpdate(case_.id, value)}
                                    disabled={isUpdating && updatingCaseId === case_.id}
                                  >
                                    <SelectTrigger className={`w-24 h-6 text-xs ${getStatusColor(case_.status)}`}>
                                      {isUpdating && updatingCaseId === case_.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <SelectValue placeholder="Status" />
                                      )}
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="investigating">Investigating</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3 text-gray-600" />
                                    <span className="text-[10px]">{getCaseTypeLabel(case_.caseType)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-600" />
                                    <span className="text-[10px]">Age: {case_.age}</span>
                                  </div>
                                </div>

                                <div className="flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-[10px] text-gray-600">{case_.location}</span>
                                </div>

                                <div className="bg-gray-50 rounded p-1.5">
                                  <p className="text-[10px] text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                    {case_.description}
                                  </p>
                                </div>

                                <div className="text-[10px] text-gray-600 bg-blue-50 rounded p-1.5">
                                  <strong>Contact:</strong> {case_.contactInfo}
                                </div>

                                {case_.createdAt && (
                                  <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-500">
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

                                {case_.imageUrl && (
                                  <div className="mt-1.5">
                                    <img 
                                      src={case_.imageUrl} 
                                      alt={`Case ${case_.id} - ${case_.childName}`}
                                      className="rounded w-full h-20 object-cover shadow-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Resolved Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    <div className="grid gap-4">
                      {cases?.filter(c => c.status === 'resolved').map((case_, index) => (
                        <motion.div
                          key={case_.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="overflow-hidden hover:shadow-sm transition-shadow duration-200 max-w-xl">
                            <CardContent className="p-2">
                              <div className="flex flex-col space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-xs text-gray-500">#{case_.id}</span>
                                    <h3 className="text-xs font-semibold text-gray-900">{case_.childName}</h3>
                                  </div>
                                  <Select
                                    value={case_.status || undefined}
                                    onValueChange={(value) => handleStatusUpdate(case_.id, value)}
                                    disabled={isUpdating && updatingCaseId === case_.id}
                                  >
                                    <SelectTrigger className={`w-24 h-6 text-xs ${getStatusColor(case_.status)}`}>
                                      {isUpdating && updatingCaseId === case_.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <SelectValue placeholder="Status" />
                                      )}
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="investigating">Investigating</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3 text-gray-600" />
                                    <span className="text-[10px]">{getCaseTypeLabel(case_.caseType)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-600" />
                                    <span className="text-[10px]">Age: {case_.age}</span>
                                  </div>
                                </div>

                                <div className="flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-[10px] text-gray-600">{case_.location}</span>
                                </div>

                                <div className="bg-gray-50 rounded p-1.5">
                                  <p className="text-[10px] text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                    {case_.description}
                                  </p>
                                </div>

                                <div className="text-[10px] text-gray-600 bg-blue-50 rounded p-1.5">
                                  <strong>Contact:</strong> {case_.contactInfo}
                                </div>

                                {case_.createdAt && (
                                  <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-500">
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

                                {case_.imageUrl && (
                                  <div className="mt-1.5">
                                    <img 
                                      src={case_.imageUrl} 
                                      alt={`Case ${case_.id} - ${case_.childName}`}
                                      className="rounded w-full h-20 object-cover shadow-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}