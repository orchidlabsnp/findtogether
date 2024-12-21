import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

// Initialize web3 and contract instances
let web3: Web3;
let contract: Contract;
let account: any;

// Contract ABI
const ChildProtectionReports = {
  abi: [
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
          "name": "reportId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "caseType",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "location",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "reporter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ReportCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "reportId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "newStatus",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ReportStatusUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "reportId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "verifier",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ReportVerified",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_caseType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_childName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_age",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_location",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_contactInfo",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_aiCharacteristics",
          "type": "string"
        }
      ],
      "name": "createReport",
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
          "name": "_reportId",
          "type": "uint256"
        }
      ],
      "name": "getReport",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "caseType",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "childName",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "age",
              "type": "uint256"
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
              "internalType": "address",
              "name": "reporter",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "status",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "aiCharacteristics",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "isVerified",
              "type": "bool"
            }
          ],
          "internalType": "struct ChildProtectionReports.Report",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getReportCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_reportId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_newStatus",
          "type": "string"
        }
      ],
      "name": "updateReportStatus",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_reportId",
          "type": "uint256"
        }
      ],
      "name": "verifyReport",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};

if (!process.env.ALCHEMY_API_KEY) {
  throw new Error('Missing ALCHEMY_API_KEY environment variable');
}

if (!process.env.SEPOLIA_PRIVATE_KEY) {
  throw new Error('Missing SEPOLIA_PRIVATE_KEY environment variable');
}

// Format private key
let privateKey = process.env.SEPOLIA_PRIVATE_KEY;
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

try {
  web3 = new Web3(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
  account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  // Initialize contract
  const CONTRACT_ADDRESS = "0xE7facc9f57fc0DD54f3Ef1A422345835edeFE0f2";
  contract = new web3.eth.Contract(
    ChildProtectionReports.abi as AbiItem[],
    CONTRACT_ADDRESS
  );

  console.log('Blockchain service initialized successfully');
} catch (error) {
  console.error('Error initializing blockchain service:', error);
  throw new Error('Failed to initialize blockchain connection. Please check your configuration.');
}

export async function createBlockchainReport(
  caseType: string,
  childName: string,
  age: number,
  location: string,
  description: string,
  contactInfo: string,
  aiCharacteristics: string
): Promise<number> {
  try {
    const result = await contract.methods
      .createReport(
        caseType,
        childName,
        age,
        location,
        description,
        contactInfo,
        aiCharacteristics
      )
      .send({ from: account.address });

    const reportId = Number(result.events.ReportCreated.returnValues.reportId);
    console.log('Report created on blockchain with ID:', reportId);
    return reportId;
  } catch (error) {
    console.error('Blockchain report creation error:', error);
    throw new Error('Failed to create report on blockchain');
  }
}

export async function getBlockchainReport(reportId: number) {
  try {
    const report = await contract.methods.getReport(reportId).call();
    return report;
  } catch (error) {
    console.error('Blockchain report retrieval error:', error);
    throw new Error('Failed to retrieve report from blockchain');
  }
}
