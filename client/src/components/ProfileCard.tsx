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
        <DialogContent className="w-[90vw] max-w-[800px] h-[90vh] max-h-[800px] p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-xl font-semibold">Profile</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-8 max-w-2xl mx-auto">
                <motion.div 
                  className="flex items-center justify-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-blue-600" />
                  </div>
                </motion.div>

                <motion.div 
                  className="text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-sm text-gray-500 mb-2">Wallet Address</p>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded-lg">{address}</p>
                </motion.div>

                <motion.div 
                  className="space-y-4 max-w-sm mx-auto"
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
                </motion.div>

                <div className="max-w-3xl mx-auto">
                  <UserDashboard address={address} />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}