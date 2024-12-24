import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useRef, useState } from 'react';
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

interface ReportCaseProps {
  address: string;
}

export default function ReportCase({ address }: ReportCaseProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const [showProfileCard, setShowProfileCard] = useState(true);

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
      const formData = new FormData();
      const files = fileRef.current?.files;

      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }

      // Add the reporter's address to the form data
      formData.append('reporterAddress', address);

      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch("/api/cases", {
        method: "POST",
        body: formData,
      });

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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ReportCaseForm) {
    submitCase(data);
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {showProfileCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-2xl mx-auto relative">
            {isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4 p-4 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Processing your report...</p>
                </div>
              </motion.div>
            )}
            <CardHeader>
              <CardTitle>Report Missing Child Case</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="childName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child's Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Known Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select case type" />
                          </SelectTrigger>
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
                          <Input {...field} placeholder="Phone number or email" />
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
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
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
    </div>
  );
}