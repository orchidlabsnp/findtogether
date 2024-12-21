import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import MetaMaskAuth from "@/components/MetaMaskAuth";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-blue-600">FindTogether</a>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/find">
              <a className="text-gray-700 hover:text-blue-600 transition-colors">
                Find Now
              </a>
            </Link>
            <Link href="/mission">
              <a className="text-gray-700 hover:text-blue-600 transition-colors">
                Mission
              </a>
            </Link>
            <MetaMaskAuth />
          </nav>

          <Button className="md:hidden">Menu</Button>
        </div>
      </div>
    </motion.header>
  );
}
