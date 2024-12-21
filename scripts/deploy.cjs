const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log("Starting deployment of ChildProtectionReports...");

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy the contract
    const ChildProtectionReports = await ethers.getContractFactory("ChildProtectionReports");
    console.log("Deploying...");
    const childProtectionReports = await ChildProtectionReports.deploy();

    await childProtectionReports.deployed();
    const address = childProtectionReports.address;
    console.log("ChildProtectionReports deployed to:", address);

    // Add a delay to ensure proper transaction confirmation
    console.log("Waiting for deployment confirmation...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

    // Save deployment information
    const deploymentInfo = {
      network: process.env.HARDHAT_NETWORK || 'sepolia',
      address,
      timestamp: new Date().toISOString(),
      deployer: deployer.address
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }

    // Save deployment info to file
    fs.writeFileSync(
      path.join(deploymentsDir, 'deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    // Update environment with contract address
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add CONTRACT_ADDRESS
    if (envContent.includes('CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${address}`;
    }

    fs.writeFileSync(envPath, envContent);

    console.log("Deployment completed successfully!");
    console.log("Contract address saved to environment and deployments/deployment-info.json");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
