import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';
import { uploadToIPFS } from './ipfs';

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

// Constants from the smart contract
const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

// Get Web3 instance with validation
function getWeb3(): Web3 {
  if (typeof window.ethereum !== "undefined") {
    const web3 = new Web3(window.ethereum);
    if (!web3) {
      throw new Error("Failed to initialize Web3");
    }
    return web3;
  }
  throw new Error("MetaMask is not installed");
}

// Get contract instance with validation
export function getContract() {
  try {
    const web3Instance = getWeb3();
    const contract = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    if (!contract) {
      throw new Error("Failed to initialize contract");
    }
    return contract;
  } catch (error) {
    console.error("Error getting contract instance:", error);
    throw new Error("Failed to connect to smart contract. Please check your network connection.");
  }
}

// Helper functions for enum conversion
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

// Helper function to convert string to bytes32
function stringToBytes32(web3: Web3, str: string): string {
  const truncated = str.slice(0, 31);
  return web3.utils.padRight(web3.utils.fromUtf8(truncated), 64);
}

// Submit case to blockchain
export async function submitCaseToBlockchain(caseInput: {
  childName: string;
  age: number;
  location: string;
  description: string;
  contactInfo: string;
  caseType: string;
  imageUrl: string;
  physicalTraits: string;
}): Promise<number> {
  try {
    console.log('Starting blockchain submission...');
    const web3Instance = getWeb3();
    const contract = getContract();
    const account = await getAddress();

    if (!account) throw new Error("No connected account");

    // Check if contract is paused
    const isPaused = await contract.methods.paused().call();
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Validate inputs
    if (!caseInput.childName || !caseInput.location) {
      throw new Error("Required fields missing");
    }

    // Prepare parameters with proper type conversion
    const params = [
      stringToBytes32(web3Instance, caseInput.childName),
      Number(caseInput.age),
      stringToBytes32(web3Instance, caseInput.location),
      caseInput.description || '',
      caseInput.contactInfo || '',
      getCaseTypeEnum(caseInput.caseType),
      caseInput.imageUrl || '',
      caseInput.physicalTraits || ''
    ];

    console.log('Submitting with parameters:', {
      childName: params[0],
      age: params[1],
      location: params[2],
      caseType: params[5]
    });

    // First validate parameters
    const submitCase = contract.methods.submitCase(...params);

    // Estimate gas with proper error handling
    let gasEstimate;
    try {
      gasEstimate = await submitCase.estimateGas({ from: account });
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      if (error.message.includes("execution reverted")) {
        throw new Error(`Contract execution would fail: ${error.message}`);
      }
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }

    // Add 30% buffer for safety
    const gasLimit = Math.floor(Number(gasEstimate) * 1.3).toString();

    // Submit transaction
    const tx = await submitCase.send({
      from: account,
      gas: gasLimit
    });

    console.log('Transaction receipt:', tx);

    if (!tx.events?.CaseSubmitted?.returnValues?.caseId) {
      throw new Error("Failed to get case ID from event");
    }

    const caseId = Number(tx.events.CaseSubmitted.returnValues.caseId);
    console.log('Successfully submitted case with ID:', caseId);

    return caseId;
  } catch (error: any) {
    console.error('Error in submitCaseToBlockchain:', error);
    // Handle specific error cases
    if (error.message.includes("User denied")) {
      throw new Error("Transaction rejected in MetaMask");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for gas");
    } else if (error.message.includes("nonce too low")) {
      throw new Error("Please reset your MetaMask account");
    }
    throw error;
  }
}

// Update case status
export async function updateCaseStatus(caseId: number, newStatus: string): Promise<void> {
  try {
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);
    console.log('Updating case status:', { caseId, statusEnum, address });

    // Estimate gas
    const gasEstimate = await contract.methods.updateCaseStatus(caseId, statusEnum)
      .estimateGas({ from: address });

    // Add 20% buffer to gas limit
    const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

    // Send transaction
    const tx = await contract.methods.updateCaseStatus(caseId, statusEnum)
      .send({
        from: address,
        gas: gasLimit
      });

    console.log('Status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in updateCaseStatus:', error);
    throw error;
  }
}

// Batch update status
export async function batchUpdateCaseStatus(caseIds: number[], newStatus: string): Promise<void> {
  try {
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);
    console.log('Batch updating case statuses:', { caseIds, statusEnum, address });

    // Estimate gas
    const gasEstimate = await contract.methods.batchUpdateStatus(caseIds, statusEnum)
      .estimateGas({ from: address });

    // Add 20% buffer to gas limit
    const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

    // Send transaction
    const tx = await contract.methods.batchUpdateStatus(caseIds, statusEnum)
      .send({
        from: address,
        gas: gasLimit
      });

    console.log('Batch status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in batchUpdateStatus:', error);
    throw error;
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
    const web3Instance = getWeb3();
    const caseCore = await contract.methods.getCaseCore(caseId).call() as CaseCore;

    return {
      childName: web3Instance.utils.hexToUtf8(caseCore.childName).replace(/\0/g, ''),
      age: Number(caseCore.age),
      location: web3Instance.utils.hexToUtf8(caseCore.location).replace(/\0/g, ''),
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
    const web3Instance = getWeb3();
    const account = await getAddress();

    if (!account) throw new Error("No connected account");

    // Upload image to IPFS if provided
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await uploadToIPFS(imageFile);
    }

    // Prepare case data for blockchain
    const caseInput = {
      childName: web3Instance.utils.utf8ToHex(caseData.childName),
      age: caseData.age,
      location: web3Instance.utils.utf8ToHex(caseData.location),
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

    // Submit to database (this part remains)
    //  Database submission logic needs to be implemented here.  Example:
    //  const databaseCaseId = await databaseSubmission(caseInput);

    // Submit to blockchain after successful database submission
    const blockchainCaseId = await submitCaseToBlockchain(caseInput);
    return blockchainCaseId;

  } catch (error) {
    console.error("Error submitting case:", error);
    throw error;
  }
}