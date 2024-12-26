import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, Users, Book, Bell, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] flex items-center">
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

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-4xl font-bold text-primary mb-2">8M+</h3>
              <p className="text-gray-600">Children Missing Annually</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-4xl font-bold text-primary mb-2">160M</h3>
              <p className="text-gray-600">Child Labor Victims</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-4xl font-bold text-primary mb-2">1B</h3>
              <p className="text-gray-600">Children Experiencing Violence</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-4xl font-bold text-primary mb-2">73M</h3>
              <p className="text-gray-600">Child Marriage Cases</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Report Cases</h3>
              <p className="text-gray-600 mb-4">
                Quick and secure reporting system for missing children cases. Our platform ensures 
                rapid response and maximum visibility for each case.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• 24/7 case submission</li>
                <li>• Immediate authority notification</li>
                <li>• Global database integration</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Community Support</h3>
              <p className="text-gray-600 mb-4">
                Join a network of caring individuals working together to protect children's rights 
                and ensure their safety.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Volunteer opportunities</li>
                <li>• Support groups</li>
                <li>• Resource sharing</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Rapid Response</h3>
              <p className="text-gray-600 mb-4">
                Our advanced alert system ensures quick dissemination of critical information to 
                authorities and community members.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Real-time alerts</li>
                <li>• Location tracking</li>
                <li>• Law enforcement coordination</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Areas of Focus */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Areas of Focus</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <Book className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Child Labor Prevention</h3>
                <p className="text-gray-600">
                  Working to eliminate child labor through education, policy advocacy, and 
                  support for vulnerable families. We believe every child deserves a childhood 
                  free from exploitation.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Abuse Prevention</h3>
                <p className="text-gray-600">
                  Implementing comprehensive programs to prevent child abuse through awareness, 
                  education, and early intervention strategies.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Child Rights Advocacy</h3>
                <p className="text-gray-600">
                  Promoting and protecting children's rights through legal advocacy, policy 
                  reform, and community engagement initiatives.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <Bell className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Missing Children Support</h3>
                <p className="text-gray-600">
                  Providing comprehensive support services for families of missing children, 
                  including search coordination and emotional support.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Join Us in Protecting Children</h2>
            <p className="text-lg mb-8">
              Every child deserves safety, security, and the chance to thrive. Together, we can 
              make a difference in their lives.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/find" className="inline-flex items-center gap-2">
                Get Involved Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}