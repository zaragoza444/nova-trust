import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 22016
    },
    zBlockChainHardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 44002
    },
    nrwWorldHardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 33001
    },
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
      chainId: 22016
    }
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
