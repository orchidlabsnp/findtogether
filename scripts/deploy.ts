import { ethers } from "hardhat";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log("Starting CaseRegistry contract deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const CaseRegistry = await ethers.getContractFactory("CaseRegistry");
    const caseRegistry = await CaseRegistry.deploy();

    console.log("Waiting for deployment confirmation...");
    await caseRegistry.waitForDeployment();

    const address = await caseRegistry.getAddress();
    console.log("CaseRegistry deployed to:", address);

    // Verify the deployment
    const adminRole = await caseRegistry.ADMIN_ROLE();
    const hasRole = await caseRegistry.hasRole(adminRole, deployer.address);

    console.log("Deployment verification:");
    console.log("- Deployer address:", deployer.address);
    console.log("- Has admin role:", hasRole);

    // Save contract address for frontend use
    const envPath = path.resolve(__dirname, "..", ".env");
    const envContent = `VITE_CONTRACT_ADDRESS=${address}\n`;

    await fs.writeFile(envPath, envContent);
    console.log("Contract address saved to .env file");

    // Test case submission
    console.log("Submitting test case...");
    const testCase = {
      childName: "Test Child",
      age: 10,
      location: "Test Location",
      description: "Test Description",
      contactInfo: "Test Contact",
      caseType: 0, // Missing
      imageUrl: "",
      physicalTraits: ""
    };

    const tx = await caseRegistry.submitCase(testCase);
    await tx.wait();
    console.log("Test case submitted successfully");

    // Test case status update
    console.log("Testing status update...");
    const updateTx = await caseRegistry.updateCaseStatus(1, 1); // Set to Investigating
    await updateTx.wait();
    console.log("Status updated successfully");

    // Verify case details
    const caseCore = await caseRegistry.getCaseCore(1);
    const caseDetails = await caseRegistry.getCaseDetails(1);
    console.log("Case verification:", {
      core: caseCore,
      details: caseDetails
    });

    console.log("Contract deployment and verification completed successfully");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });