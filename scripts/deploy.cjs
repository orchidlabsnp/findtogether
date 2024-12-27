const hre = require("hardhat");

async function main() {
  console.log("Deploying CaseRegistry contract...");

  const CaseRegistry = await hre.ethers.getContractFactory("CaseRegistry");
  const caseRegistry = await CaseRegistry.deploy();

  await caseRegistry.waitForDeployment();
  const address = await caseRegistry.getAddress();

  console.log("CaseRegistry deployed to:", address);

  // Verify the deployment
  const adminRole = await caseRegistry.ADMIN_ROLE();
  const [deployer] = await hre.ethers.getSigners();
  const hasRole = await caseRegistry.hasRole(adminRole, deployer.address);
  
  console.log("Deployment verified:");
  console.log("- Deployer address:", deployer.address);
  console.log("- Has admin role:", hasRole);

  // Save the contract address to a file for frontend use
  const fs = require('fs');
  const path = require('path');
  const envContent = `VITE_CONTRACT_ADDRESS=${address}\n`;
  fs.writeFileSync('.env', envContent);

  console.log("Contract address saved to .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
