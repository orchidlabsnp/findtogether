import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getWeb3Provider,
  connectWallet,
  type Web3Provider,
  type Web3Signer
} from '@/services/web3';

export function useWeb3() {
  const [provider, setProvider] = useState<Web3Provider | null>(null);
  const [signer, setSigner] = useState<Web3Signer | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const provider = await getWeb3Provider();
      if (!provider) {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to use this feature",
          variant: "destructive"
        });
        return;
      }

      const accounts = await connectWallet();
      const signer = await provider.getSigner();

      setProvider(provider);
      setSigner(signer);
      setAddress(accounts[0]);
      setIsConnected(true);

      toast({
        title: "Connected",
        description: "Successfully connected to wallet"
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress('');
    setIsConnected(false);
  }, []);

  // Handle account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [disconnect]);

  // Handle chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    provider,
    signer,
    address,
    isConnecting,
    isConnected,
    connect,
    disconnect
  };
}