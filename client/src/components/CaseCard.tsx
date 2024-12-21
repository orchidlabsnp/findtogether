import type { Case } from "@db/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CaseCardProps {
  case: Case;
}

export default function CaseCard({ case: case_ }: CaseCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card>
        <CardHeader className="relative h-48">
          {case_.imageUrl ? (
            <img
              src={case_.imageUrl}
              alt={case_.childName}
              className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-2">{case_.childName}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Age: {case_.age}</p>
            <p>Location: {case_.location}</p>
            <p className="line-clamp-2">{case_.description}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1">
              Details
            </Button>
            <Button className="flex-1">Contact</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
