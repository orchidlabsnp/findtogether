import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

export const CONTRACT_ADDRESS = "0xD1E5b50e97a846813467a56A83689B56Ec4811E3";

// Constants from the smart contract
export const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

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

export function getWeb3(): Web3 {
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

// Helper function to convert string to bytes32 with proper UTF-8 encoding and validation
export function stringToBytes32(str: string): string {
  if (!str) {
    throw new Error("Input string cannot be empty");
  }

  const web3 = getWeb3();

  // Remove any non-printable characters and trim
  const cleanStr = str.replace(/[^\x20-\x7E]/g, '').trim();

  if (!cleanStr) {
    throw new Error("Input string contains no valid characters");
  }

  // Truncate to 31 bytes to leave room for null terminator
  const truncated = cleanStr.slice(0, 31);

  try {
    const hex = web3.utils.utf8ToHex(truncated);
    return web3.utils.padRight(hex, 64);
  } catch (error: any) {
    console.error("Error converting string to bytes32:", error);
    throw new Error(`Failed to convert string "${str}" to bytes32: ${error.message}`);
  }
}

export const CONTRACT_ABI: AbiItem[] = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
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
        "indexed": false,
        "internalType": "uint8",
        "name": "age",
        "type": "uint8"
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
        "internalType": "enum CaseRegistry.Status",
        "name": "newStatus",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "updatedBy",
        "type": "address"
      }
    ],
    "name": "CaseStatusUpdated",
    "type": "event"
  },
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
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "caseIds",
        "type": "uint256[]"
      },
      {
        "internalType": "enum CaseRegistry.Status",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "batchUpdateStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      }
    ],
    "name": "getCaseCore",
    "outputs": [
      {
        "components": [
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
            "internalType": "enum CaseRegistry.Status",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum CaseRegistry.CaseType",
            "name": "caseType",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "reporter",
            "type": "address"
          },
          {
            "internalType": "uint40",
            "name": "timestamp",
            "type": "uint40"
          }
        ],
        "internalType": "struct CaseRegistry.CaseCore",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];