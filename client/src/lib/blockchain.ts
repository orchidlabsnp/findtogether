import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';

// Smart contract configuration
const CONTRACT_ADDRESS = "0xD1E5b50e97a846813467a56A83689B56Ec4811E3";
const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

// Types
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

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Web3 Instance Management
export function getWeb3(): Web3 {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Please install MetaMask to use this feature");
  }
  return new Web3(window.ethereum);
}

// Wallet Connection
export async function connectWallet(): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }
  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    return accounts[0];
  } catch (error) {
    console.error("Error connecting to MetaMask", error);
    throw error;
  }
}

// Contract Instance
export function getContract(): Contract<AbiItem[]> {
  const web3 = getWeb3();
  return new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
}

// Helper Functions
function stringToBytes32(str: string): string {
  const web3 = getWeb3();
  const cleanStr = str.replace(/[^\x20-\x7E]/g, '').trim().slice(0, 31);
  return web3.utils.padRight(web3.utils.utf8ToHex(cleanStr), 64);
}

export function getCaseTypeEnum(type: string): number {
  const types: Record<string, number> = {
    'child_missing': 0,
    'child_labour': 1,
    'child_harassment': 2
  };
  return types[type.toLowerCase()] ?? 0;
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

// Main Blockchain Functions
export async function submitCaseToBlockchain(caseData: CaseSubmission): Promise<number> {
  try {
    const web3 = getWeb3();
    const contract = getContract();

    // Get connected account
    const accounts = await web3.eth.requestAccounts();
    const account = accounts[0];

    if (!account) {
      throw new Error("Please connect your wallet first");
    }

    // Prepare case data
    const params = [
      stringToBytes32(caseData.childName),
      caseData.age,
      stringToBytes32(caseData.location),
      caseData.description || '',
      caseData.contactInfo || '',
      getCaseTypeEnum(caseData.caseType),
      caseData.imageUrl || '',
      caseData.physicalTraits || ''
    ];

    // Create transaction
    const submitCase = contract.methods.submitCase(...params);

    // Estimate gas with some buffer
    const gasEstimate = await submitCase.estimateGas({ from: account });
    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2).toString();

    // Send transaction
    const tx = await submitCase.send({
      from: account,
      gas: gasLimit
    });

    // Get case ID from event
    const event = tx.events?.CaseSubmitted;
    if (!event?.returnValues?.caseId) {
      throw new Error("Failed to get case ID from transaction");
    }

    return Number(event.returnValues.caseId);
  } catch (error: any) {
    console.error('Blockchain submission error:', error);

    if (error.message.includes('User denied')) {
      throw new Error('Transaction was rejected');
    }
    if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds for gas fees');
    }
    if (error.message.includes('execution reverted')) {
      throw new Error('Transaction failed: ' + error.message.split('execution reverted:')[1]?.trim() || 'Unknown error');
    }

    throw new Error('Failed to submit case: ' + error.message);
  }
}

// Contract ABI - Only including essential functions
export const CONTRACT_ABI: AbiItem[] = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "childName",
        "type": "bytes32"
      },
      {
        "internalType": "uint8",
        "name": "age",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "location",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "contactInfo",
        "type": "string"
      },
      {
        "internalType": "enum CaseRegistry.CaseType",
        "name": "caseType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "imageUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "physicalTraits",
        "type": "string"
      }
    ],
    "name": "submitCase",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "childName",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "reporter",
        "type": "address"
      }
    ],
    "name": "CaseSubmitted",
    "type": "event"
  }
];