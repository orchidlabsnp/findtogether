declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet(): Promise<string | null> {
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return accounts[0];
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
      throw error;
    }
  } else {
    throw new Error("MetaMask is not installed");
  }
}

export async function getAddress(): Promise<string | null> {
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      return accounts[0] || null;
    } catch (error) {
      console.error("Error getting address", error);
      return null;
    }
  }
  return null;
}
