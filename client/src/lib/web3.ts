import { getContract, getWeb3, ADMIN_ROLE } from './contract';
import type Web3 from 'web3';

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

// Re-export the submission function from blockchain.ts
export { submitCaseToBlockchain } from './blockchain';

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
    throw error;
  }
}