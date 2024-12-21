import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProfileCard from "./ProfileCard";
import { connectWallet, getAddress } from "@/lib/web3";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function MetaMaskAuth() {
  const [address, setAddress] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      const addr = await getAddress();
      setAddress(addr);
    };
    checkConnection();
  }, []);

  const { mutate: createUser } = useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      return response.json();
    },
  });

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAddress(addr);
      if (addr) {
        createUser(addr);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to MetaMask",
        variant: "destructive",
      });
    }
  };

  if (address) {
    return <ProfileCard address={address} />;
  }

  return (
    <Button onClick={handleConnect}>
      Connect Wallet
    </Button>
  );
}
