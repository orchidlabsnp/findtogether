import { AbiItem } from 'web3-utils';

export const CONTRACT_ADDRESS = "0xD1E5b50e97a846813467a56A83689B56Ec4811E3";

export const CONTRACT_ABI: AbiItem[] = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
      }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
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
    "inputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "childName",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "age",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
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
        "internalType": "struct CaseRegistry.CaseInput",
        "name": "input",
        "type": "tuple"
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
  }
];
