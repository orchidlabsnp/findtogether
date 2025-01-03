import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';
import { uploadToIPFS } from './ipfs';

// Constants from the smart contract
const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

export interface CaseSubmission {
  childName: string;
  age: number;
  location: string;
  description: string;
  contactInfo: string;
  caseType: string;
  imageUrl?: string | null;
  physicalTraits?: string | null;
}

interface TransactionConfig {
  from: string;
  gas?: string;
  maxPriorityFeePerGas?: string | undefined;
  maxFeePerGas?: string | undefined;
}

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

function getWeb3(): Web3 {
  if (typeof window.ethereum !== "undefined") {
    return new Web3(window.ethereum);
  }
  throw new Error("MetaMask is not installed");
}

export function getContract() {
  try {
    const web3 = getWeb3();
    return new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
  } catch (error) {
    console.error("Error getting contract instance:", error);
    throw new Error("Failed to connect to smart contract");
  }
}

export function getCaseTypeEnum(type: string): number {
  const types: Record<string, number> = {
    'child_missing': 0,
    'child_labour': 1,
    'child_harassment': 2
  };
  const enumValue = types[type.toLowerCase()];
  if (enumValue === undefined) {
    throw new Error(`Invalid case type: ${type}`);
  }
  return enumValue;
}

export function getCaseTypeString(type: number): string {
  const types = ['child_missing', 'child_labour', 'child_harassment'];
  return types[type] || 'child_missing';
}

export function getCaseStatusEnum(status: string): number {
  const statuses: Record<string, number> = {
    'open': 0,
    'investigating': 1,
    'resolved': 2
  };
  const statusEnum = statuses[status.toLowerCase()];
  if (statusEnum === undefined) {
    throw new Error(`Invalid status: ${status}`);
  }
  return statusEnum;
}

export function getCaseStatusString(status: number): string {
  const statuses = ['open', 'investigating', 'resolved'];
  return statuses[status] || 'open';
}

// Helper function to convert string to bytes32 with proper UTF-8 encoding and validation
function stringToBytes32(web3: Web3, str: string): string {
  if (!str) {
    throw new Error("Input string cannot be empty");
  }
  // Remove any non-printable characters
  const cleanStr = str.replace(/[^\x20-\x7E]/g, '');
  // Truncate to 31 bytes to leave room for null terminator
  const truncated = cleanStr.slice(0, 31);
  try {
    return web3.utils.padRight(
      web3.utils.utf8ToHex(truncated),
      64
    );
  } catch (error) {
    console.error("Error converting string to bytes32:", error);
    throw new Error(`Failed to convert string "${str}" to bytes32`);
  }
}

// Submit case to blockchain
export async function submitCase(caseData: CaseSubmission): Promise<number> {
  try {
    console.log('Starting case submission...', { ...caseData, description: '[REDACTED]' });
    const web3 = getWeb3();
    const contract = getContract();
    const account = await getAddress();

    if (!account) {
      throw new Error("No connected account");
    }

    // Check if contract is paused
    const isPaused = await contract.methods.paused().call();
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Validate required fields
    if (!caseData.childName?.trim() || !caseData.location?.trim()) {
      throw new Error("Child name and location are required and cannot be empty");
    }

    if (caseData.age < 0 || caseData.age > 18) {
      throw new Error("Age must be between 0 and 18");
    }

    // Prepare parameters for contract call
    const params = [
      stringToBytes32(web3, caseData.childName),
      caseData.age,
      stringToBytes32(web3, caseData.location),
      caseData.description || '',
      caseData.contactInfo || '',
      getCaseTypeEnum(caseData.caseType),
      caseData.imageUrl || '',
      caseData.physicalTraits || ''
    ];

    // First validate the transaction will succeed
    const submitCase = contract.methods.submitCase(...params);

    // Gas estimation parameters
    const gasEstimateConfig: TransactionConfig = {
      from: account,
      maxPriorityFeePerGas: undefined,
      maxFeePerGas: undefined
    };

    // Estimate gas with proper error handling
    let gasEstimate;
    try {
      gasEstimate = await submitCase.estimateGas(gasEstimateConfig);
      console.log('Gas estimate:', gasEstimate);
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      // Extract the revert reason if present
      let errorMessage = error.message;
      if (error.message.includes('execution reverted:')) {
        const revertReason = error.message.split('execution reverted:')[1].trim();
        errorMessage = `Contract rejected transaction: ${revertReason}`;
      }
      throw new Error(errorMessage);
    }

    // Add 30% buffer for safety and convert to string
    const gasLimit = Math.floor(Number(gasEstimate) * 1.3).toString();

    // Transaction parameters
    const txConfig: TransactionConfig = {
      from: account,
      gas: gasLimit,
      maxPriorityFeePerGas: undefined,
      maxFeePerGas: undefined
    };

    // Submit transaction
    console.log('Sending transaction...');
    const tx = await submitCase.send(txConfig);

    console.log('Transaction receipt:', tx);

    // Extract case ID from event
    const event = tx.events?.CaseSubmitted;
    if (!event || !event.returnValues?.caseId) {
      throw new Error("Failed to get case ID from event");
    }

    const caseId = Number(event.returnValues.caseId);
    console.log('Successfully submitted case ID:', caseId);

    return caseId;
  } catch (error: any) {
    console.error('Error submitting case:', error);
    // Improve error messages for common issues
    if (error.message.includes("User denied")) {
      throw new Error("Transaction was rejected in MetaMask");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for gas");
    }
    throw new Error(`Failed to submit case: ${error.message}`);
  }
}

// Update case status
export async function updateCaseStatus(caseId: number, newStatus: string): Promise<void> {
  try {
    console.log('Starting status update...', { caseId, newStatus });
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);

    // Check admin role
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    const updateStatus = contract.methods.updateCaseStatus(caseId, statusEnum);

    // Gas estimation parameters
    const gasEstimateConfig: TransactionConfig = {
      from: address,
      maxPriorityFeePerGas: undefined,
      maxFeePerGas: undefined
    };

    // Estimate gas
    const gasEstimate = await updateStatus.estimateGas(gasEstimateConfig);
    console.log('Gas estimate:', gasEstimate);

    // Add 20% buffer and convert to string
    const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

    // Transaction parameters
    const txConfig: TransactionConfig = {
      from: address,
      gas: gasLimit,
      maxPriorityFeePerGas: undefined,
      maxFeePerGas: undefined
    };

    // Send transaction
    const tx = await updateStatus.send(txConfig);

    console.log('Status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in updateCaseStatus:', error);
    throw new Error(`Failed to update case status: ${error.message}`);
  }
}

// Batch update status
export async function batchUpdateStatus(caseIds: number[], newStatus: string): Promise<void> {
  try {
    console.log('Starting batch update...', { caseIds, newStatus });
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);

    // Check admin role
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    const batchUpdate = contract.methods.batchUpdateStatus(caseIds, statusEnum);

    // Gas estimation parameters
    const gasEstimateConfig: TransactionConfig = {
      from: address,
      maxPriorityFeePerGas: undefined,
      maxFeePerGas: undefined
    };

    // Estimate gas
    const gasEstimate = await batchUpdate.estimateGas(gasEstimateConfig);
    console.log('Gas estimate:', gasEstimate);

    // Add 20% buffer and convert to string
    const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

    // Transaction parameters
    const txConfig: TransactionConfig = {
      from: address,
      gas: gasLimit,
      maxPriorityFeePerGas: undefined,
      maxFeePerGas: undefined
    };

    // Send transaction
    const tx = await batchUpdate.send(txConfig);

    console.log('Batch update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in batchUpdateStatus:', error);
    throw new Error(`Failed to update case statuses: ${error.message}`);
  }
}

// Case details interface
export interface CaseCore {
  childName: string;
  age: number;
  location: string;
  status: number;
  caseType: number;
  reporter: string;
  timestamp: string;
}

// Get case details
export async function getCaseDetails(caseId: number): Promise<{
  childName: string;
  age: number;
  location: string;
  status: string;
  caseType: string;
  reporter: string;
  timestamp: number;
}> {
  try {
    const contract = getContract();
    const web3 = getWeb3();
    const caseCore = await contract.methods.getCaseCore(caseId).call() as CaseCore;

    return {
      childName: web3.utils.hexToUtf8(caseCore.childName).replace(/\0/g, ''),
      age: Number(caseCore.age),
      location: web3.utils.hexToUtf8(caseCore.location).replace(/\0/g, ''),
      status: getCaseStatusString(Number(caseCore.status)),
      caseType: getCaseTypeString(Number(caseCore.caseType)),
      reporter: caseCore.reporter,
      timestamp: Number(caseCore.timestamp) * 1000 // Convert to milliseconds
    };
  } catch (error: any) {
    console.error("Error getting case details:", error);
    throw new Error(`Failed to get case details: ${error.message}`);
  }
}