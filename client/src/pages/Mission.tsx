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
          <p>
            FindTogether is dedicated to creating a safer world for children by leveraging
            technology and community engagement to combat child trafficking, labor exploitation,
            underage marriage, and sexual harassment.
          </p>

          <div className="my-12">
            <img
              src="https://images.unsplash.com/photo-1587347236627-4474f8dddec9"
              alt="Community support"
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          </div>

          <h2>Our Vision</h2>
          <p>
            We envision a world where every child is protected, valued, and given the
            opportunity to thrive in a safe environment. Through our platform, we aim to:
          </p>
          
          <ul>
            <li>Facilitate quick and efficient reporting of missing children cases</li>
            <li>Create a global network of concerned citizens and organizations</li>
            <li>Provide resources and support to affected families</li>
            <li>Raise awareness about child safety and protection</li>
          </ul>

          <h2>How You Can Help</h2>
          <p>
            Join our community of volunteers and supporters. Whether you can help spread
            awareness, provide professional services, or contribute to our cause, every
            action counts in making a difference in children's lives.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
