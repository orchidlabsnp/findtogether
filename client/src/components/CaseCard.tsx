import type { Case } from "@db/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MapPin, Calendar, Phone, Mail, Info, Heart, HelpCircle, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface CaseCardProps {
  case: Case;
}

export default function CaseCard({ case: case_ }: CaseCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden">
        <CardHeader className="relative h-56 p-0 overflow-hidden">
          <div className="absolute inset-0 bg-gray-100">
            {case_.imageUrl ? (
              <img
                src={case_.imageUrl}
                alt={case_.childName}
                className="w-full h-full object-cover transition-transform hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://placehold.co/600x400?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>
          <Badge className="absolute top-4 right-4 bg-slate-800 z-10">
            Case #{case_.id}
          </Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-1">Name: {case_.childName}</h3>
              <p className="text-sm text-gray-500">
                Age: {case_.age} years
              </p>
            </div>
            <Badge variant={case_.status === 'open' ? 'destructive' : 'default'}>
              {case_.status.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Last location: {case_.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Reported: {format(new Date(case_.createdAt), 'PP')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>Contact: {case_.contactInfo}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="outline" className="capitalize">
                {case_.caseType ? 
                  case_.caseType.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ') 
                  : 'Child Missing'
                }
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              <Info className="h-4 w-4 inline mr-2" />
              About: {case_.description}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  Save Child
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact Information</DialogTitle>
                  <DialogDescription>
                    Emergency contacts and details for {case_.childName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Primary Contact</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{case_.contactInfo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>contact@findtogether.org</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Emergency Numbers</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-red-500" />
                        <span>Emergency: 911</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <span>Child Protection Hotline: 1-800-422-4453</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Additional Resources</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-muted-foreground" />
                        <a href="/safe-zones" className="text-blue-600 hover:underline">
                          Find Nearby Safe Zones
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <a href="/mission" className="text-blue-600 hover:underline">
                          How to Help
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
