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
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Tag, Clock, Calendar, PlayCircle, PauseCircle } from "lucide-react";
import { format } from "date-fns";
import { getContract, getAddress, getCaseStatusEnum } from "@/lib/web3";
import { updateCaseStatus, batchUpdateStatus } from "@/lib/blockchain"; // Assuming these functions are defined elsewhere


const ADMIN_ADDRESS = "0x5A498a4520b56Fe0119Bd3D8D032D53c65c035a7";
const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingCaseId, setUpdatingCaseId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
  const [hasAdminRole, setHasAdminRole] = useState(false);


  useEffect(() => {
    async function checkContractStatus() {
      try {
        const contract = getContract();
        const paused = await contract.methods.paused().call();
        setIsPaused(paused);
      } catch (error) {
        console.error("Error checking contract status:", error);
      }
    }

    checkContractStatus();
  }, []);

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
      .then(async (accounts: string[]) => {
        const address = accounts[0];
        setCurrentAddress(address);

        if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
          const contract = getContract();
          const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
          setHasAdminRole(hasRole);
          if (!hasRole) {
            toast({
              title: "Access Denied",
              description: "Only admin can access this page",
              variant: "destructive"
            });
            setLocation("/");
          }
        } else {
          setHasAdminRole(true);
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

  const handlePauseToggle = async () => {
    try {
      const contract = getContract();
      const address = await getAddress();

      if (!address) throw new Error("No connected account");

      if (isPaused) {
        await contract.methods.unpause().send({ from: address });
        toast({ title: "Contract Unpaused", description: "The contract is now active" });
      } else {
        await contract.methods.pause().send({ from: address });
        toast({ title: "Contract Paused", description: "The contract is now paused" });
      }

      setIsPaused(!isPaused);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdate = async (caseId: number, newStatus: string) => {
    setIsUpdating(true);
    setUpdatingCaseId(caseId);

    try {
      console.log('Initiating status update for case:', caseId, 'to status:', newStatus);

      // Find the case we're updating
      const caseToUpdate = cases?.find(c => c.id === caseId);
      if (!caseToUpdate) {
        throw new Error("Case not found");
      }

      // If case is on blockchain, update both blockchain and database
      if (caseToUpdate.blockchainCaseId) {
        console.log('Case is on blockchain, updating both systems...');
        // Update blockchain status
        await updateCaseStatus(caseToUpdate.blockchainCaseId, newStatus);
      } else {
        console.log('Case is not on blockchain, updating only database...');
      }

      // Update database
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
        description: caseToUpdate.blockchainCaseId 
          ? "Case status has been updated in both database and blockchain"
          : "Case status has been updated in database",
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update case status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setUpdatingCaseId(null);
    }
  };

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedCases.length === 0) {
      toast({
        title: "No Cases Selected",
        description: "Please select cases to update",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get selected cases details
      const selectedCasesDetails = cases?.filter(c => selectedCases.includes(c.id)) || [];
      const blockchainCases = selectedCasesDetails.filter(c => c.blockchainCaseId);

      // If any cases are on blockchain, update them first
      if (blockchainCases.length > 0) {
        console.log('Updating blockchain cases:', blockchainCases.map(c => c.blockchainCaseId));
        await batchUpdateStatus(
          blockchainCases.map(c => c.blockchainCaseId!),
          newStatus
        );
      }

      // Update database for all cases
      await Promise.all(selectedCases.map(caseId =>
        fetch(`/api/cases/${caseId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        })
      ));

      toast({
        title: "Status Updated",
        description: blockchainCases.length > 0 
          ? `Updated ${selectedCases.length} cases in database and ${blockchainCases.length} in blockchain`
          : `Updated ${selectedCases.length} cases in database`,
      });

      // Refresh the cases list
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setSelectedCases([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update cases status",
        variant: "destructive"
      });
    }
  };

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

  const renderCaseCard = (case_: any) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id={`case-${case_.id}`} 
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCases([...selectedCases, case_.id]);
                  } else {
                    setSelectedCases(selectedCases.filter(id => id !== case_.id));
                  }
                }}
              />
              <span className="font-mono text-sm text-gray-500">#{case_.id}</span>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                {case_.childName}
                {case_.blockchainCaseId && (
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"
                    title={`Blockchain Case ID: ${case_.blockchainCaseId}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      <rect width="20" height="12" x="2" y="6" rx="2" />
                      <path d="M12 12h.01" />
                      <path d="M17 12h.01" />
                      <path d="M7 12h.01" />
                    </svg>
                    Blockchain
                  </Badge>
                )}
              </h3>
            </div>
            <Select
              value={case_.status || undefined}
              onValueChange={(value) => handleStatusUpdate(case_.id, value)}
              disabled={isUpdating && updatingCaseId === case_.id}
            >
              <SelectTrigger className={`w-32 h-8 text-sm ${getStatusColor(case_.status)}`}>
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

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-gray-600" />
              <span className="text-sm">{getCaseTypeLabel(case_.caseType)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm">Age: {case_.age}</span>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <MapPin className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">{case_.location}</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
              {case_.description}
            </p>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
            <strong>Contact:</strong> {case_.contactInfo}
          </div>

          {case_.createdAt && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Created: {format(new Date(case_.createdAt), 'PPp')}</span>
              </div>
              {case_.updatedAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Updated: {format(new Date(case_.updatedAt), 'PPp')}</span>
                </div>
              )}
            </div>
          )}

          {case_.imageUrl && (
            <div className="mt-2">
              <img
                src={case_.imageUrl}
                alt={`Case ${case_.id} - ${case_.childName}`}
                className="rounded-lg w-full h-48 object-cover shadow-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!currentAddress || (!hasAdminRole && currentAddress.toLowerCase() !== ADMIN_ADDRESS.toLowerCase())) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-4">
              <Button
                variant={isPaused ? "destructive" : "default"}
                onClick={handlePauseToggle}
                className="flex items-center gap-2"
              >
                {isPaused ? (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Unpause Contract
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-4 w-4" />
                    Pause Contract
                  </>
                )}
              </Button>
              {selectedCases.length > 0 && (
                <Select onValueChange={handleBatchStatusUpdate}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Batch Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 sm:gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Active Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    <div className="grid gap-6">
                      {cases?.filter(c => c.status === 'open' || c.status === 'investigating').map((case_, index) => (
                        <motion.div
                          key={case_.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                          className="mx-auto w-full max-w-3xl"
                        >
                          {renderCaseCard(case_)}
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
                    <div className="grid gap-6">
                      {cases?.filter(c => c.status === 'resolved').map((case_, index) => (
                        <motion.div
                          key={case_.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                          className="mx-auto w-full max-w-3xl"
                        >
                          {renderCaseCard(case_)}
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