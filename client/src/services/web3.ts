import { ethers } from 'ethers';
import CaseRegistryArtifact from '../../../artifacts/contracts/CaseRegistry.sol/CaseRegistry.json';

export type Web3Provider = ethers.BrowserProvider;
export type Web3Signer = ethers.JsonRpcSigner;

// Contract address will be set after deployment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export async function getWeb3Provider(): Promise<Web3Provider | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('MetaMask not installed');
    return null;
  }

  return new ethers.BrowserProvider(window.ethereum);
}

export async function connectWallet(): Promise<string[]> {
  const provider = await getWeb3Provider();
  if (!provider) throw new Error('No provider available');

  try {
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts;
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw error;
  }
}

export async function getCaseRegistryContract(
  signerOrProvider: Web3Provider | Web3Signer
) {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    CaseRegistryArtifact.abi,
    signerOrProvider
  );
}

export async function submitCase(
  provider: Web3Provider,
  caseData: {
    childName: string;
    age: number;
    dateOfBirth: string;
    hair: string;
    eyes: string;
    height: number;
    weight: number;
    location: string;
    description: string;
    contactInfo: string;
    caseType: number;
    imageUrl: string;
    aiCharacteristics: string;
  }
) {
  const signer = await provider.getSigner();
  const contract = await getCaseRegistryContract(signer);

  try {
    const tx = await contract.submitCase(
      caseData.childName,
      caseData.age,
      caseData.dateOfBirth,
      caseData.hair,
      caseData.eyes,
      caseData.height,
      caseData.weight,
      caseData.location,
      caseData.description,
      caseData.contactInfo,
      caseData.caseType,
      caseData.imageUrl,
      caseData.aiCharacteristics
    );

    const receipt = await tx.wait();
    const event = receipt?.logs?.find((e: any) => e.fragment.name === 'CaseSubmitted');

    return {
      transactionHash: receipt.hash,
      caseId: event?.args?.caseId.toString()
    };
  } catch (error) {
    console.error('Error submitting case:', error);
    throw error;
  }
}

export async function updateCaseStatus(
  provider: Web3Provider,
  caseId: number,
  newStatus: number
) {
  const signer = await provider.getSigner();
  const contract = await getCaseRegistryContract(signer);

  try {
    const tx = await contract.updateCaseStatus(caseId, newStatus);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      status: newStatus
    };
  } catch (error) {
    console.error('Error updating case status:', error);
    throw error;
  }
}

export async function getCaseDetails(
  provider: Web3Provider,
  caseId: number
) {
  const contract = await getCaseRegistryContract(provider);

  try {
    const caseDetails = await contract.getCaseById(caseId);
    return caseDetails;
  } catch (error) {
    console.error('Error fetching case details:', error);
    throw error;
  }
}

export async function getUserCases(
  provider: Web3Provider,
  userAddress: string
) {
  const contract = await getCaseRegistryContract(provider);

  try {
    const caseIds = await contract.getCasesByUser(userAddress);
    return caseIds;
  } catch (error) {
    console.error('Error fetching user cases:', error);
    throw error;
  }
}