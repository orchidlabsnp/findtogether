import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import ChildProtectionReports from '../../contracts/ChildProtectionReports.sol/ChildProtectionReports.json';

if (!process.env.ALCHEMY_API_KEY) {
  throw new Error('Missing ALCHEMY_API_KEY environment variable');
}

if (!process.env.SEPOLIA_PRIVATE_KEY) {
  throw new Error('Missing SEPOLIA_PRIVATE_KEY environment variable');
}

const web3 = new Web3(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
const account = web3.eth.accounts.privateKeyToAccount(process.env.SEPOLIA_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Contract address will be set after deployment
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(
  ChildProtectionReports.abi as AbiItem[],
  CONTRACT_ADDRESS
);

export async function createBlockchainReport(
  caseType: string,
  childName: string,
  age: number,
  location: string,
  description: string,
  contactInfo: string,
  ipfsHash: string,
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
        aiCharacteristics,
        ipfsHash
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
