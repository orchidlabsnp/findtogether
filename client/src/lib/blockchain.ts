import { getContract, getAddress, getCaseStatusEnum } from './web3';

export async function updateCaseStatus(caseId: number, newStatus: string): Promise<void> {
  try {
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);
    console.log('Updating case status:', { caseId, statusEnum, address });

    // First check if the contract is paused
    const isPaused = await contract.methods.paused().call();
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Check if caller has admin role
    const ADMIN_ROLE = await contract.methods.ADMIN_ROLE().call();
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    // Send the transaction
    const tx = await contract.methods.updateCaseStatus(caseId, statusEnum).send({
      from: address,
      gas: 200000 // Explicitly set gas limit
    });

    console.log('Status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in updateCaseStatus:', error);
    throw error;
  }
}

export async function batchUpdateStatus(caseIds: number[], newStatus: string): Promise<void> {
  try {
    const contract = getContract();
    const address = await getAddress();

    if (!address) throw new Error("No connected account");

    const statusEnum = getCaseStatusEnum(newStatus);
    console.log('Batch updating case statuses:', { caseIds, statusEnum, address });

    // First check if the contract is paused
    const isPaused = await contract.methods.paused().call();
    if (isPaused) {
      throw new Error("Contract is currently paused");
    }

    // Check if caller has admin role
    const ADMIN_ROLE = await contract.methods.ADMIN_ROLE().call();
    const hasRole = await contract.methods.hasRole(ADMIN_ROLE, address).call();
    if (!hasRole) {
      throw new Error("Caller does not have admin role");
    }

    // Send the transaction
    const tx = await contract.methods.batchUpdateStatus(caseIds, statusEnum).send({
      from: address,
      gas: 500000 // Higher gas limit for batch operation
    });

    console.log('Batch status update transaction complete:', tx);
  } catch (error: any) {
    console.error('Error in batchUpdateStatus:', error);
    throw error;
  }
}
