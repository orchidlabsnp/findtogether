import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/your-api-key", // We'll need to update this
      accounts: [process.env.SEPOLIA_PRIVATE_KEY!]
    }
  }
};

export default config;
