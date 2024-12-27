import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';
import { uploadToIPFS, uploadJSONToIPFS } from './ipfs';

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

// Get Web3 instance
function getWeb3() {
  if (typeof window.ethereum !== "undefined") {
    const web3Instance = new Web3(window.ethereum);
    return web3Instance;
  }
  throw new Error("MetaMask is not installed");
}

// Get contract instance
export function getContract() {
  const web3Instance = getWeb3();
  return new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
}

export async function submitCase(caseData: any, imageFile?: File): Promise<number> {
  try {
    const contract = getContract();
    const account = await getAddress();

    if (!account) throw new Error("No connected account");

    // Upload image to IPFS if provided
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await uploadToIPFS(imageFile);
    }

    // Prepare case data for blockchain
    const caseInput = {
      childName: caseData.childName,
      age: caseData.age,
      location: caseData.location,
      description: caseData.description,
      contactInfo: caseData.contactInfo,
      caseType: getCaseTypeEnum(caseData.caseType),
      imageUrl: imageUrl,
      physicalTraits: JSON.stringify({
        hair: caseData.hair,
        eyes: caseData.eyes,
        height: caseData.height,
        weight: caseData.weight
      })
    };

    // Submit to blockchain
    const result = await contract.methods.submitCase(caseInput).send({ from: account });
    if (!result.events?.CaseSubmitted?.returnValues?.caseId) {
      throw new Error("Failed to get case ID from event");
    }
    return Number(result.events.CaseSubmitted.returnValues.caseId);
  } catch (error) {
    console.error("Error submitting case:", error);
    throw error;
  }
}

interface CaseCore {
  childName: string;
  age: number;
  location: string;
  status: number;
  caseType: number;
  reporter: string;
  timestamp: string;
}

export async function getCaseDetails(caseId: number) {
  try {
    const contract = getContract();
    const web3Instance = getWeb3();
    const caseCore = await contract.methods.getCaseCore(caseId).call() as CaseCore;

    return {
      childName: web3Instance.utils.hexToUtf8(caseCore.childName),
      age: Number(caseCore.age),
      location: web3Instance.utils.hexToUtf8(caseCore.location),
      status: getCaseStatusString(Number(caseCore.status)),
      caseType: getCaseTypeString(Number(caseCore.caseType)),
      reporter: caseCore.reporter,
      timestamp: Number(caseCore.timestamp) * 1000 // Convert to milliseconds
    };
  } catch (error) {
    console.error("Error getting case details:", error);
    throw error;
  }
}

export async function updateCaseStatus(caseId: number, newStatus: string) {
  try {
    const contract = getContract();
    const account = await getAddress();

    if (!account) throw new Error("No connected account");

    await contract.methods.updateCaseStatus(caseId, getCaseStatusEnum(newStatus))
      .send({ from: account });
  } catch (error) {
    console.error("Error updating case status:", error);
    throw error;
  }
}

// Helper functions for enum conversion
export function getCaseTypeEnum(type: string): number {
  const types = {
    'child_missing': 0,
    'child_labour': 1,
    'child_harassment': 2
  };
  return types[type as keyof typeof types] || 0;
}

export function getCaseTypeString(type: number): string {
  const types = ['child_missing', 'child_labour', 'child_harassment'];
  return types[type] || 'child_missing';
}

export function getCaseStatusEnum(status: string): number {
  const statuses = {
    'open': 0,
    'investigating': 1,
    'resolved': 2
  };
  return statuses[status as keyof typeof statuses] || 0;
}

export function getCaseStatusString(status: number): string {
  const statuses = ['open', 'investigating', 'resolved'];
  return statuses[status] || 'open';
}