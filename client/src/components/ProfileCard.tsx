import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookmarkPlus, User as UserIcon } from "lucide-react";
import { useState } from "react";
import type { User } from "@db/schema";

interface ProfileCardProps {
  address: string;
  user?: User;
}

export default function ProfileCard({ address, user }: ProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <UserIcon className="h-4 w-4" />
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex items-center justify-center mb-6">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
              <p className="font-mono text-sm">{address}</p>
            </div>

            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Report Case
              </Button>
              <Button className="w-full">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Saved Cases
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
