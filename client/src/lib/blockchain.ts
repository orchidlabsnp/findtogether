import { getContract, getAddress, stringToBytes32, getWeb3 } from './contract';
import type { CaseSubmission } from './web3';

// Constants from the smart contract
const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

// Submit case to blockchain with proper error handling
export async function submitCaseToBlockchain(caseData: CaseSubmission): Promise<number> {
  try {
    console.log('Starting blockchain case submission...', { ...caseData, description: '[REDACTED]' });
    const contract = getContract();
    const account = await getAddress();

    if (!account) {
      throw new Error("No connected account");
    }

    // Check if contract is paused
    const isPaused = await contract.methods.paused().call();
    console.log('Contract pause status:', isPaused);
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Validate required fields
    if (!caseData.childName?.trim() || !caseData.location?.trim()) {
      throw new Error("Child name and location are required and cannot be empty");
    }

    if (caseData.age < 0 || caseData.age > 18) {
      throw new Error("Age must be between 0 and 18");
    }

    // Convert strings to bytes32
    const childNameBytes32 = stringToBytes32(caseData.childName);
    const locationBytes32 = stringToBytes32(caseData.location);

    // Get case type enum value
    const types: Record<string, number> = {
      'child_missing': 0,
      'child_labour': 1,
      'child_harassment': 2
    };
    const caseTypeEnum = types[caseData.caseType.toLowerCase()];
    if (caseTypeEnum === undefined) {
      throw new Error(`Invalid case type: ${caseData.caseType}`);
    }

    // Prepare parameters for contract call
    const params = [
      childNameBytes32,
      caseData.age,
      locationBytes32,
      caseData.description || '',
      caseData.contactInfo || '',
      caseTypeEnum,
      caseData.imageUrl || '',
      caseData.physicalTraits || ''
    ];

    console.log('Contract parameters:', {
      childName: childNameBytes32,
      age: caseData.age,
      location: locationBytes32,
      caseType: caseTypeEnum
    });

    // First validate the transaction will succeed
    const submitCase = contract.methods.submitCase(...params);

    // Estimate gas with proper error handling
    let gasEstimate;
    try {
      gasEstimate = await submitCase.estimateGas({ from: account });
      console.log('Estimated gas:', gasEstimate);
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      if (error.message.includes('execution reverted:')) {
        const revertReason = error.message.split('execution reverted:')[1].trim();
        throw new Error(`Contract rejected transaction: ${revertReason}`);
      }
      throw error;
    }

    // Add 20% buffer for gas limit
    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2);

    // Send the transaction
    console.log('Sending transaction...');
    const tx = await submitCase.send({
      from: account,
      gas: gasLimit.toString()
    });

    console.log('Transaction complete:', tx);

    // Extract case ID from event
    const event = tx.events?.CaseSubmitted;
    if (!event || !event.returnValues?.caseId) {
      throw new Error("Failed to get case ID from event");
    }

    const caseId = Number(event.returnValues.caseId);
    console.log('Successfully submitted case ID:', caseId);

    return caseId;
  } catch (error: any) {
    console.error('Error in submitCaseToBlockchain:', error);

    if (error.message.includes("User denied")) {
      throw new Error("Transaction was rejected in MetaMask");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for gas");
    }

    // Re-throw the error to be handled by the UI
    throw error;
  }
}

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