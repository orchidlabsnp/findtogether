import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookmarkPlus, User as UserIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import type { User } from "@db/schema";
import { motion, AnimatePresence } from "framer-motion";
import UserDashboard from "./UserDashboard";

interface ProfileCardProps {
  address: string;
  user?: User;
}

export default function ProfileCard({ address, user }: ProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReportCase = async () => {
    setIsLoading(true);
    try {
      window.location.href = "/report-case";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2 relative"
        onClick={() => setIsOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </motion.div>
        </AnimatePresence>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto overflow-x-clip flex flex-col item-center">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-8">
            <motion.div 
              className="flex items-center justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-blue-600" />
              </div>
            </motion.div>

            <motion.div 
              className="text-center mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
              <p className="font-mono text-sm">{address}</p>
            </motion.div>

            <motion.div 
              className="space-y-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                className="w-full relative" 
                variant="outline" 
                onClick={handleReportCase}
                disabled={isLoading}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Report Case
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              {/* <Button 
                className="w-full relative"
                onClick={() => {
                  // Handle saved cases
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Saved Cases
                  </motion.div>
                </AnimatePresence>
              </Button> */}
            </motion.div>

            <UserDashboard address={address} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}