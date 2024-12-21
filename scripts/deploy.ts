import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ChildProtectionReports...");

  // Deploy the contract
  const ChildProtectionReports = await ethers.getContractFactory("ChildProtectionReports");
  const childProtectionReports = await ChildProtectionReports.deploy();

  await childProtectionReports.waitForDeployment();

  const address = await childProtectionReports.getAddress();
  console.log("ChildProtectionReports deployed to:", address);

  // Add a delay to ensure proper transaction confirmation
  console.log("Waiting for deployment confirmation...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

  console.log("Deployment completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
