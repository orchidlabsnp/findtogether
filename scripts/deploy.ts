import { ethers } from "hardhat";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Save contract address for frontend use
  const envPath = path.resolve(__dirname, "..", ".env");
  const envContent = `VITE_CONTRACT_ADDRESS=${address}\n`;

  try {
    await fs.writeFile(envPath, envContent);
    console.log("Contract address saved to .env file");
  } catch (error) {
    console.error("Failed to save contract address:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });