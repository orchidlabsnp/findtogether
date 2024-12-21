import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Phone, Mail, MapPin } from "lucide-react";

const rescueCenters = [
  {
    id: 1,
    name: "Children's Hope Center",
    address: "123 Hope Street, San Francisco, CA",
    phone: "+1 (555) 123-4567",
    email: "hope@childrenscenter.org",
    type: "Rescue Center"
  },
  {
    id: 2,
    name: "Safe Haven Youth Shelter",
    address: "456 Safety Ave, Oakland, CA",
    phone: "+1 (555) 987-6543",
    email: "contact@safehaven.org",
    type: "Safe Zone"
  },
  // Add more centers as needed
];

export default function SafeZones() {
  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Safe Zones & Rescue Centers</h1>
        <p className="text-gray-600 mb-8">
          Find nearby safe zones and rescue centers where you can seek immediate help and support.
          These locations are staffed with trained professionals ready to assist 24/7.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {rescueCenters.map((center) => (
            <Card key={center.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{center.name}</h3>
                  <Badge>{center.type}</Badge>
                </div>

                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{center.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{center.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{center.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Coming Soon: Interactive Map</h2>
            <p className="text-gray-600">
              We're working on integrating an interactive map feature to help you easily locate
              the nearest safe zones and rescue centers in your area. Stay tuned for updates!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
