import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from project root .env or contracts/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const accounts = PRIVATE_KEY && PRIVATE_KEY.length === 64 || PRIVATE_KEY.length === 66 
  ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] 
  : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mstTestnet: {
      url: process.env.MST_TESTNET_RPC || "https://testnetrpc.mstblockchain.com",
      chainId: 91562037,
      accounts: accounts,
    },
    mstMainnet: {
      url: process.env.MST_MAINNET_RPC || "https://mariorpc.mstblockchain.com/",
      chainId: 4646,
      accounts: accounts,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
