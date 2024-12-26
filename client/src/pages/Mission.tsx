import { motion } from "framer-motion";

export default function Mission() {
  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Our Mission</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg leading-relaxed">
            FindTogether is on a mission to protect every child's right to a safe, healthy, and 
            dignified childhood. We leverage cutting-edge technology and community engagement to 
            combat child trafficking, prevent exploitation, and ensure rapid response in cases 
            of missing children.
          </p>

          <div className="my-12">
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c"
              alt="Children holding hands"
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
            <p className="text-sm text-center text-gray-600 italic">
              Together, we can create a world where every child feels safe and protected
            </p>
          </div>

          <h2 className="text-3xl font-bold mb-6">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-semibold mb-3">Swift Action</h3>
              <p>
                When a child goes missing, every minute counts. Our platform enables immediate 
                reporting and rapid response coordination between families, law enforcement, 
                and communities.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Global Reach</h3>
              <p>
                Child exploitation knows no borders. Our network spans across regions, 
                connecting resources and communities worldwide in the fight against child 
                trafficking and abuse.
              </p>
            </div>
          </div>

          <div className="my-12">
            <img
              src="https://images.unsplash.com/photo-1594708767771-a7502209ff51"
              alt="Child protection awareness"
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          </div>

          <h2 className="text-3xl font-bold mb-6">Our Impact</h2>
          <p>
            Through our innovative approach combining technology with community action, we have:
          </p>
          <ul className="space-y-4">
            <li>Helped reunite hundreds of families with their missing children</li>
            <li>Created a network of over 10,000 active volunteers worldwide</li>
            <li>Developed partnerships with law enforcement agencies in 50+ countries</li>
            <li>Implemented prevention programs reaching millions of children</li>
          </ul>

          <div className="my-12 bg-blue-50 p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-6">Join Our Cause</h2>
            <p className="mb-6">
              Every contribution matters in our mission to protect children. Whether you're a:
            </p>
            <ul className="space-y-4 mb-6">
              <li>• Volunteer wanting to help in search operations</li>
              <li>• Professional offering expertise in child protection</li>
              <li>• Technology expert contributing to our platform</li>
              <li>• Community member spreading awareness</li>
            </ul>
            <p>
              Your involvement can make a crucial difference in a child's life. Together, we 
              can build a safer world for our children.
            </p>
          </div>

          <div className="my-12">
            <img
              src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a"
              alt="Community support network"
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          </div>

          <h2 className="text-3xl font-bold mb-6">Our Commitment</h2>
          <p>
            We are committed to:
          </p>
          <ul className="space-y-4">
            <li>
              <strong>Protection:</strong> Ensuring every child's right to safety and security
            </li>
            <li>
              <strong>Prevention:</strong> Implementing programs to prevent child exploitation
            </li>
            <li>
              <strong>Response:</strong> Providing rapid, coordinated responses to missing children cases
            </li>
            <li>
              <strong>Support:</strong> Offering comprehensive support to affected families
            </li>
            <li>
              <strong>Advocacy:</strong> Fighting for stronger child protection policies and laws
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}