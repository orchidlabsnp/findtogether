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

// Get Web3 instance with validation
function getWeb3() {
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
  const types = {
    'child_missing': 0,
    'child_labour': 1,
    'child_harassment': 2
  };
  return types[type as keyof typeof types] ?? 0;
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
  return statuses[status as keyof typeof statuses] ?? 0;
}

export function getCaseStatusString(status: number): string {
  const statuses = ['open', 'investigating', 'resolved'];
  return statuses[status] || 'open';
}

// Blockchain interaction functions
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
    const contract = getContract();
    const web3Instance = getWeb3();
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

    // Convert strings to bytes32
    const blockchainInput = {
      childName: web3Instance.utils.padRight(web3Instance.utils.asciiToHex(caseInput.childName), 64),
      age: caseInput.age,
      location: web3Instance.utils.padRight(web3Instance.utils.asciiToHex(caseInput.location), 64),
      description: caseInput.description || '',
      contactInfo: caseInput.contactInfo || '',
      caseType: getCaseTypeEnum(caseInput.caseType),
      imageUrl: caseInput.imageUrl || '',
      physicalTraits: caseInput.physicalTraits || ''
    };

    console.log('Submitting case to blockchain with input:', {
      age: blockchainInput.age,
      caseType: blockchainInput.caseType,
      // Sensitive data redacted from logs
      location: '[REDACTED]',
      description: '[REDACTED]'
    });

    // Estimate gas with proper error handling
    let gasEstimate;
    try {
      gasEstimate = await contract.methods.submitCase(
        blockchainInput.childName,
        blockchainInput.age,
        blockchainInput.location,
        blockchainInput.description,
        blockchainInput.contactInfo,
        blockchainInput.caseType,
        blockchainInput.imageUrl,
        blockchainInput.physicalTraits
      ).estimateGas({ from: account });
      console.log('Gas estimate:', gasEstimate);
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      if (error.message.includes("execution reverted")) {
        throw new Error("Transaction would fail: " + error.message);
      }
      throw new Error("Gas estimation failed: " + error.message);
    }

    // Add 20% buffer to gas limit
    const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();
    console.log('Using gas limit:', gasLimit);

    // Submit transaction
    const result = await contract.methods.submitCase(
      blockchainInput.childName,
      blockchainInput.age,
      blockchainInput.location,
      blockchainInput.description,
      blockchainInput.contactInfo,
      blockchainInput.caseType,
      blockchainInput.imageUrl,
      blockchainInput.physicalTraits
    ).send({ 
      from: account,
      gas: gasLimit
    });

    // Verify event emission
    if (!result.events?.CaseSubmitted?.returnValues?.caseId) {
      throw new Error("Failed to get case ID from blockchain event");
    }

    const blockchainCaseId = Number(result.events.CaseSubmitted.returnValues.caseId);
    console.log('Successfully received blockchain case ID:', blockchainCaseId);

    return blockchainCaseId;
  } catch (error: any) {
    console.error('Error submitting case to blockchain:', error);
    // Provide more specific error messages
    if (error.message.includes("User denied")) {
      throw new Error("Transaction was rejected by user");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for gas");
    } else if (error.message.includes("nonce too low")) {
      throw new Error("Please reset your MetaMask account");
    }
    throw error;
  }
}

export async function updateCaseStatus(caseId: number, newStatus: string): Promise<void> {
  try {
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);
    console.log('Updating case status:', { caseId, statusEnum, address });

    // Estimate gas with proper error handling
    let gasEstimate;
    try {
      gasEstimate = await contract.methods.updateCaseStatus(caseId, statusEnum)
        .estimateGas({ from: address });
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }

    // Add 20% buffer to gas limit
    const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

    // Send transaction
    const tx = await contract.methods.updateCaseStatus(caseId, statusEnum).send({
      from: address,
      gas: gasLimit
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

    // Estimate gas with proper error handling
    let gasEstimate;
    try {
      gasEstimate = await contract.methods.batchUpdateStatus(caseIds, statusEnum)
        .estimateGas({ from: address });
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }

    // Add 20% buffer to gas limit
    const gasLimit = Math.floor(Number(gasEstimate) * 1.2).toString();

    // Send transaction
    const tx = await contract.methods.batchUpdateStatus(caseIds, statusEnum).send({
      from: address,
      gas: gasLimit
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