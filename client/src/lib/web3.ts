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
    return new Web3(window.ethereum);
  }
  throw new Error("MetaMask is not installed");
}

// Get contract instance
export function getContract() {
  const web3Instance = getWeb3();
  return new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
}

// Helper functions for enum conversion
export function getCaseTypeEnum(type: string): number {
  const types = {
    'child_missing': 0, // Missing
    'child_labour': 1, // Labour
    'child_harassment': 2 // Harassment
  };
  return types[type as keyof typeof types] || 0;
}

export function getCaseTypeString(type: number): string {
  const types = ['child_missing', 'child_labour', 'child_harassment'];
  return types[type] || 'child_missing';
}

export function getCaseStatusEnum(status: string): number {
  const statuses = {
    'open': 0, // Status.Open
    'investigating': 1, // Status.Investigating
    'resolved': 2 // Status.Resolved
  };
  return statuses[status as keyof typeof statuses] || 0;
}

export function getCaseStatusString(status: number): string {
  const statuses = ['open', 'investigating', 'resolved'];
  return statuses[status] || 'open';
}

// Smart contract interaction functions
export async function updateCaseStatus(caseId: number, newStatus: string): Promise<void> {
  try {
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);
    console.log('Updating case status:', { caseId, statusEnum, address });

    // First check if the contract is paused
    const isPaused = await contract.methods.paused().call();
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Check if caller has admin role
    const ADMIN_ROLE = await contract.methods.ADMIN_ROLE().call();
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    // Send the transaction
    const tx = await contract.methods.updateCaseStatus(caseId, statusEnum).send({
      from: address,
      gas: 200000 // Explicitly set gas limit
    });

    console.log('Status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in updateCaseStatus:', error);
    throw error;
  }
}

export async function batchUpdateStatus(caseIds: number[], newStatus: string): Promise<void> {
  try {
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);
    console.log('Batch updating case statuses:', { caseIds, statusEnum, address });

    // First check if the contract is paused
    const isPaused = await contract.methods.paused().call();
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Check if caller has admin role
    const ADMIN_ROLE = await contract.methods.ADMIN_ROLE().call();
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    // Send the transaction
    const tx = await contract.methods.batchUpdateStatus(caseIds, statusEnum).send({
      from: address,
      gas: 500000 // Higher gas limit for batch operation
    });

    console.log('Batch status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in batchUpdateStatus:', error);
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