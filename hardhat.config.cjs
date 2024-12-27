require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: true,
      evmVersion: "paris"
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
      mining: {
        auto: true,
        interval: 0
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};