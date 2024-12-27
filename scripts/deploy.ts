import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CaseRegistry contract...");

  const CaseRegistry = await ethers.getContractFactory("CaseRegistry");
  const caseRegistry = await CaseRegistry.deploy();

  await caseRegistry.waitForDeployment();
  const address = await caseRegistry.getAddress();

  console.log("CaseRegistry deployed to:", address);

  // Verify the deployment
  const adminRole = await caseRegistry.ADMIN_ROLE();
  const [deployer] = await ethers.getSigners();
  const hasRole = await caseRegistry.hasRole(adminRole, deployer.address);
  
  console.log("Deployment verified:");
  console.log("- Deployer address:", deployer.address);
  console.log("- Has admin role:", hasRole);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
