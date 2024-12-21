import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2"
            alt="Happy family"
            className="w-full h-full object-cover opacity-20"
          />
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
