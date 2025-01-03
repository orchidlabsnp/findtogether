import { getContract, getAddress } from './web3';
import Web3 from 'web3';

// Constants from the smart contract
const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

export async function updateCaseStatus(caseId: number, newStatus: string): Promise<void> {
  try {
    console.log('Starting updateCaseStatus...', { caseId, newStatus });
    const contract = getContract();
    const web3 = new Web3(window.ethereum);
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    // Convert status to enum value (0, 1, 2)
    const statusEnum = getStatusEnum(newStatus);
    console.log('Converted status to enum:', { newStatus, statusEnum });

    // First check if the contract is paused
    const isPaused = await contract.methods.paused().call();
    console.log('Contract pause status:', isPaused);
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Check if caller has admin role
    console.log('Checking admin role for address:', address);
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    console.log('Has admin role:', hasRole);
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    // Prepare transaction parameters
    const gasEstimate = await contract.methods.updateCaseStatus(caseId, statusEnum).estimateGas({ from: address });
    console.log('Estimated gas:', gasEstimate);

    // Send the transaction
    console.log('Sending transaction...');
    const tx = await contract.methods.updateCaseStatus(caseId, statusEnum).send({
      from: address,
      gas: Math.floor(gasEstimate * 1.2).toString() // Add 20% buffer to estimated gas
    });

    console.log('Status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in updateCaseStatus:', error);
    throw new Error(`Failed to update case status: ${error.message}`);
  }
}

export async function batchUpdateStatus(caseIds: number[], newStatus: string): Promise<void> {
  try {
    console.log('Starting batchUpdateStatus...', { caseIds, newStatus });
    const contract = getContract();
    const web3 = new Web3(window.ethereum);
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getStatusEnum(newStatus);
    console.log('Converted status to enum:', { newStatus, statusEnum });

    // First check if the contract is paused
    const isPaused = await contract.methods.paused().call();
    console.log('Contract pause status:', isPaused);
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Check if caller has admin role
    console.log('Checking admin role for address:', address);
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    console.log('Has admin role:', hasRole);
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    // Prepare transaction parameters
    const gasEstimate = await contract.methods.batchUpdateStatus(caseIds, statusEnum).estimateGas({ from: address });
    console.log('Estimated gas:', gasEstimate);

    // Send the transaction
    console.log('Sending batch update transaction...');
    const tx = await contract.methods.batchUpdateStatus(caseIds, statusEnum).send({
      from: address,
      gas: Math.floor(gasEstimate * 1.2).toString() // Add 20% buffer to estimated gas
    });

    console.log('Batch status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in batchUpdateStatus:', error);
    throw new Error(`Failed to update case statuses: ${error.message}`);
  }
}

// Helper function to convert status string to enum value
function getStatusEnum(status: string): number {
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