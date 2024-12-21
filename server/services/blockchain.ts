import Web3 from 'web3';
import type { Contract, ContractAbi } from 'web3';

// Initialize web3 and contract instances
let web3: Web3;
let contract: Contract<ContractAbi>;
let account: { address: string };

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

// Initialize Web3 and contract
async function initializeBlockchain() {
  try {
    // Initialize Web3 with WebSocket provider for better stability
    web3 = new Web3(`wss://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);

    try {
      // Create and add account with proper Web3 account type
      const web3Account = web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(web3Account);
      account = web3Account;
      
      console.log('Account added successfully:', {
        address: account.address,
        hasPrivateKey: !!account.privateKey
      });
    } catch (accountError) {
      console.error('Failed to initialize account:', accountError);
      return false;
    }

    // Initialize contract
    const CONTRACT_ADDRESS = "0xE7facc9f57fc0DD54f3Ef1A422345835edeFE0f2";
    contract = new web3.eth.Contract(
      ChildProtectionReports.abi as ContractAbi,
      CONTRACT_ADDRESS
    );

    // Verify connection by calling a view function
    console.log('Verifying contract connection...');
    const reportCount = await contract.methods.getReportCount().call();
    console.log('Contract connection verified. Current report count:', reportCount);
    
    return true;
  } catch (error) {
    console.error('Error initializing blockchain service:', error);
    if (error instanceof Error) {
      console.error('Details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return false;
  }
}

// Initialize blockchain connection
await initializeBlockchain();

export async function createBlockchainReport(
  caseType: string,
  childName: string,
  age: number,
  location: string,
  description: string,
  contactInfo: string,
  aiCharacteristics: string
): Promise<{ reportId: number; transactionHash: string; status: string }> {
  console.log('Initiating blockchain report creation...');
  
  // Ensure blockchain connection is active
  if (!contract) {
    console.log('Reconnecting to blockchain...');
    const connected = await initializeBlockchain();
    if (!connected) {
      throw new Error('Failed to connect to blockchain');
    }
  }
  
  try {
    // Create method call
    const method = contract.methods.createReport(
      caseType,
      childName,
      age,
      location,
      description,
      contactInfo,
      aiCharacteristics
    );

    // Estimate gas with error handling
    console.log('Estimating gas for transaction...');
    let gasEstimate;
    try {
      gasEstimate = await method.estimateGas({ from: account.address });
      console.log('Gas estimation successful:', gasEstimate.toString());
    } catch (gasError: any) {
      console.error('Gas estimation failed:', gasError);
      throw new Error(`Gas estimation failed: ${gasError.message}`);
    }

    // Get current gas price
    const gasPrice = await web3.eth.getGasPrice();
    console.log('Current gas price:', gasPrice);

    // Prepare transaction parameters
    // Convert gas price from BigInt to string
    const gasPriceString = gasPrice.toString();
    console.log('Converted gas price to string:', gasPriceString);

    const txParams = {
      from: account.address,
      gas: Math.floor(Number(gasEstimate) * 1.2).toString(), // 20% buffer
      gasPrice: gasPriceString
    };

    console.log('Transaction parameters prepared:', {
      from: txParams.from,
      gas: txParams.gas,
      gasPrice: txParams.gasPrice
    });

    console.log('Sending transaction with params:', txParams);

    // Send transaction
    console.log('Initiating transaction send...');
    let result;
    try {
      result = await method.send(txParams);
      console.log('Transaction sent successfully:', {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed
      });
    } catch (sendError: any) {
      console.error('Transaction send failed:', {
        error: sendError.message,
        code: sendError.code,
        data: sendError.data
      });
      throw sendError;
    }

    if (!result.events?.ReportCreated) {
      console.error('Missing ReportCreated event in transaction result:', result);
      throw new Error('Transaction successful but ReportCreated event not found');
    }

    const reportId = Number(result.events.ReportCreated.returnValues.reportId);
    console.log('Report successfully created on blockchain:', {
      reportId,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed
    });

    return {
      reportId,
      transactionHash: result.transactionHash,
      status: 'success'
    };
  } catch (error: any) {
    console.error('Blockchain report creation error:', error);
    
    const errorDetails = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      reason: error.reason || 'Unknown error',
      data: error.data || null
    };
    
    console.error('Detailed error:', errorDetails);
    
    throw {
      error: 'Failed to create report on blockchain',
      details: errorDetails,
      status: 'failed'
    };
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
