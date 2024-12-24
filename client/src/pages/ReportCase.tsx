import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useRef, useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const reportCaseSchema = z.object({
  childName: z.string().min(1, "Child's name is required"),
  age: z.number().min(0).max(18),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(10, "Please provide more details"),
  contactInfo: z.string().min(1, "Contact information is required"),
  caseType: z.enum(["child_missing", "child_labour", "child_harassment"], {
    required_error: "Please select a case type",
  }),
});

type ReportCaseForm = z.infer<typeof reportCaseSchema>;

export default function ReportCase() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const [showProfileCard, setShowProfileCard] = useState(true);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [duplicateCase, setDuplicateCase] = useState<{
    existingCase: any;
    matchDetails: {
      physicalMatch: number;
      distinctiveFeatureMatch: number;
      contactMatch: number;
      overallSimilarity: number;
    };
  } | null>(null);

  useEffect(() => {
    const getWalletAddress = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts[0]) {
            setCurrentAddress(accounts[0].toLowerCase());
          }
        } catch (error) {
          console.error("Error getting wallet address:", error);
          toast({
            title: "Error",
            description: "Failed to get wallet address",
            variant: "destructive"
          });
          setLocation("/");
        }
      } else {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to report cases",
          variant: "destructive"
        });
        setLocation("/");
      }
    };

    getWalletAddress();
  }, []);

  const form = useForm<ReportCaseForm>({
    resolver: zodResolver(reportCaseSchema),
    defaultValues: {
      childName: "",
      age: 0,
      location: "",
      description: "",
      contactInfo: "",
      caseType: "child_missing",
    },
  });

  const { mutate: submitCase, isPending } = useMutation({
    mutationFn: async (data: ReportCaseForm) => {
      if (!currentAddress) {
        throw new Error("Please connect your wallet first");
      }

      const formData = new FormData();
      const files = fileRef.current?.files;

      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }

      formData.append('reporterAddress', currentAddress);

      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch("/api/cases", {
        method: "POST",
        body: formData,
      });

      if (response.status === 409) {
        const duplicateData = await response.json();
        throw new Error("DUPLICATE_CASE:" + JSON.stringify(duplicateData));
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Reported",
        description: "The case has been successfully reported.",
      });
      setLocation("/find");
      setShowProfileCard(false);
    },
    onError: (error) => {
      if (error.message.startsWith("DUPLICATE_CASE:")) {
        const duplicateData = JSON.parse(error.message.replace("DUPLICATE_CASE:", ""));
        setDuplicateCase(duplicateData);
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  function formatSimilarity(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  function onSubmit(data: ReportCaseForm) {
    submitCase(data);
  }

  if (!currentAddress) {
    return (
      <div className="min-h-screen w-full bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="p-6">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-4">Connecting to wallet...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background py-8 px-4 sm:px-6 lg:px-8">
      {showProfileCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="relative shadow-lg">
            {isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg"
              >
                <div className="flex flex-col items-center gap-4 p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Processing your report...</p>
                </div>
              </motion.div>
            )}
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Report Case</CardTitle>
              <p className="text-center text-muted-foreground">
                Please provide accurate information to help us locate the child
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="childName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child's Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="w-full" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Known Location</FormLabel>
                        <FormControl>
                          <Input {...field} className="w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Please provide details about the circumstances..."
                            className="min-h-[100px] w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select case type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="child_missing">Missing Child</SelectItem>
                            <SelectItem value="child_labour">Child Labour</SelectItem>
                            <SelectItem value="child_harassment">Child Harassment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Information</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone number or email" className="w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="files">Upload Images/Videos</Label>
                    <Input
                      id="files"
                      type="file"
                      ref={fileRef}
                      multiple
                      accept="image/*,video/*"
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90"
                    />
                    <p className="text-sm text-muted-foreground">
                      You can upload multiple images and videos
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full relative"
                    disabled={isPending}
                  >
                    <AnimatePresence mode="wait">
                      {isPending ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </motion.div>
                      ) : (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Submit Report
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {duplicateCase && (
        <AlertDialog open={!!duplicateCase} onOpenChange={() => setDuplicateCase(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Similar Case Already Exists</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    We found a similar case in our database. Please review the details below:
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <strong>Name:</strong> {duplicateCase.existingCase.childName}
                    </div>
                    <div>
                      <strong>Location:</strong> {duplicateCase.existingCase.location}
                    </div>
                    <div>
                      <strong>Status:</strong> {duplicateCase.existingCase.status}
                    </div>
                    <div>
                      <strong>Date Reported:</strong>{" "}
                      {format(new Date(duplicateCase.existingCase.createdAt), "PPp")}
                    </div>

                    <div className="border-t pt-3">
                      <strong>Match Analysis:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>Physical Description Match: {formatSimilarity(duplicateCase.matchDetails.physicalMatch)}</li>
                        <li>Feature Match: {formatSimilarity(duplicateCase.matchDetails.distinctiveFeatureMatch)}</li>
                        <li>Contact Info Match: {formatSimilarity(duplicateCase.matchDetails.contactMatch)}</li>
                        <li>Overall Similarity: {formatSimilarity(duplicateCase.matchDetails.overallSimilarity)}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setLocation(`/find?case=${duplicateCase.existingCase.id}`);
                }}
              >
                View Existing Case
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}