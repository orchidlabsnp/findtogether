import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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

const reportCaseSchema = z.object({
  childName: z.string().min(1, "Child's name is required"),
  age: z.string().transform(Number).pipe(z.number().min(0).max(18)),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(10, "Please provide more details"),
  contactInfo: z.string().min(1, "Contact information is required"),
  imageUrl: z.string().optional(),
});

type ReportCaseForm = z.infer<typeof reportCaseSchema>;

export default function ReportCase() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ReportCaseForm>({
    resolver: zodResolver(reportCaseSchema),
    defaultValues: {
      childName: "",
      age: "0",
      location: "",
      description: "",
      contactInfo: "",
      imageUrl: "",
    },
  });

  const { mutate: submitCase, isPending } = useMutation({
    mutationFn: async (data: ReportCaseForm) => {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      <Card className="max-w-2xl mx-auto">
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
                      <Input type="number" {...field} />
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

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="http://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
