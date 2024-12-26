import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  Calendar, 
  Mail, 
  MapPin, 
  Phone, 
  User,
  ChevronDown,
  ChevronUp,
  Brain,
  Fingerprint,
  Search,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type { Case } from "@db/schema";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CaseDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  const { data: case_, isLoading, error } = useQuery<Case>({
    queryKey: [`/api/cases/${id}`],
    enabled: !!id,
  });

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading Case</h1>
            </div>
            <p className="text-sm text-gray-600">
              {error instanceof Error ? error.message : "Failed to load case details"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : case_ ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {case_.childName}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {case_.createdAt && format(new Date(case_.createdAt), "PPP")}
                    </span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full ${getStatusColor(case_.status)}`}>
                  <span className="capitalize font-medium">{case_.status}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Image Section */}
              {case_.imageUrl && (
                <div className="aspect-video w-full relative rounded-lg overflow-hidden">
                  <img
                    src={case_.imageUrl}
                    alt={case_.childName}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Child Information */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Child Information
                    </h2>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Age</p>
                          <p className="text-sm text-muted-foreground">
                            {case_.age} years old
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Last Known Location</p>
                          <p className="text-sm text-muted-foreground">
                            {case_.location || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      Case Description
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {case_.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Contact and AI Analysis */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Contact Information
                    </h2>
                    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Contact Number</p>
                          <p className="text-sm text-muted-foreground">
                            {case_.contactInfo}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {case_.aiCharacteristics && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        AI Analysis
                      </h2>
                      <motion.div
                        className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg"
                      >
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="physical">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold">Physical Characteristics</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-6">
                                {Object.entries(JSON.parse(case_.aiCharacteristics).physical || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <Lightbulb className="h-3 w-3 text-amber-500" />
                                    <span className="text-sm capitalize">{key.replace('_', ' ')}: </span>
                                    <span className="text-sm text-muted-foreground">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="clothing">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-purple-600" />
                                <span className="font-semibold">Clothing Details</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-6">
                                {Object.entries(JSON.parse(case_.aiCharacteristics).clothing || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <Lightbulb className="h-3 w-3 text-amber-500" />
                                    <span className="text-sm capitalize">{key.replace('_', ' ')}: </span>
                                    <span className="text-sm text-muted-foreground">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="distinctive">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-indigo-600" />
                                <span className="font-semibold">Distinctive Features</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-6">
                                {Object.entries(JSON.parse(case_.aiCharacteristics).distinctive || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <Lightbulb className="h-3 w-3 text-amber-500" />
                                    <span className="text-sm capitalize">{key.replace('_', ' ')}: </span>
                                    <span className="text-sm text-muted-foreground">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </motion.div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-44 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string | null) {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-red-100 text-red-800';
    case 'investigating':
      return 'bg-yellow-100 text-yellow-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}