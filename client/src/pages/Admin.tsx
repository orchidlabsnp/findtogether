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
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";


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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl">Pending Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {cases?.filter((c: Case) => c.status === 'open' || c.status === 'investigating').map((case_: Case) => (
                      <motion.div 
                        key={case_.id} 
                        className="border-b py-4 last:border-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:items-center mb-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-base sm:text-lg">Case #{case_.id}: {case_.childName}</h3>
                            <p className="text-sm text-gray-600">Location: {case_.location}</p>
                            <p className="text-sm text-gray-600">Type: {case_.caseType}</p>
                          </div>
                          <Select
                            value={case_.status || undefined}
                            onValueChange={(value) => handleStatusUpdate(case_.id, value)}
                            disabled={isUpdating && updatingCaseId === case_.id}
                          >
                            <SelectTrigger className="w-full sm:w-32">
                              {isUpdating && updatingCaseId === case_.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
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
                        <p className="text-sm text-gray-700 line-clamp-3 sm:line-clamp-none">{case_.description}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl">Resolved Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {cases?.filter((c: Case) => c.status === 'resolved').map((case_: Case) => (
                      <motion.div 
                        key={case_.id} 
                        className="border-b py-4 last:border-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:items-center mb-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-base sm:text-lg">Case #{case_.id}: {case_.childName}</h3>
                            <p className="text-sm text-gray-600">Location: {case_.location}</p>
                            <p className="text-sm text-gray-600">Type: {case_.caseType}</p>
                          </div>
                          <Select
                            value={case_.status || undefined}
                            onValueChange={(value) => handleStatusUpdate(case_.id, value)}
                            disabled={isUpdating && updatingCaseId === case_.id}
                          >
                            <SelectTrigger className="w-full sm:w-32">
                              {isUpdating && updatingCaseId === case_.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
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
                        <p className="text-sm text-gray-700 line-clamp-3 sm:line-clamp-none">{case_.description}</p>
                      </motion.div>
                    ))}
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