import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Case } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: false,
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-6 relative z-10"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Help Us Find Missing Children
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl">
            Join our community in the fight against child trafficking, labor exploitation, 
            and abuse. Together, we can make a difference.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/find">Find Now</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/mission">Learn More</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Cases Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold text-gray-900">Recent Cases</h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600">
                Failed to load cases. Please try again later.
              </div>
            ) : cases && cases.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cases.map((case_) => (
                  <motion.div
                    key={case_.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{case_.childName}</h3>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{case_.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusColor(case_.status)}>
                            {case_.status?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{case_.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {case_.createdAt ? format(new Date(case_.createdAt), 'PPP') : 'Date not available'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No cases found at the moment.
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold mb-4">Report Cases</h3>
              <p className="text-gray-600">
                Quick and secure reporting system for missing children cases.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold mb-4">Search Database</h3>
              <p className="text-gray-600">
                Access our comprehensive database of reported cases.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold mb-4">Community Support</h3>
              <p className="text-gray-600">
                Join a network of caring individuals working together.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}