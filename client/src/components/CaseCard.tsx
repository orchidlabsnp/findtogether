import type { Case } from "@db/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MapPin, Calendar, Phone, Mail, Info, Heart } from "lucide-react";
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
          <Badge className="absolute top-4 right-4 bg-white/90 z-10">
            Case #{case_.id}
          </Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-1">{case_.childName}</h3>
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
              <span>{case_.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Reported: {format(new Date(case_.createdAt), 'PP')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{case_.contactInfo}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              <Info className="h-4 w-4 inline mr-2" />
              {case_.description}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Button className="flex-1">
              <Heart className="h-4 w-4 mr-2" />
              Save Case
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
