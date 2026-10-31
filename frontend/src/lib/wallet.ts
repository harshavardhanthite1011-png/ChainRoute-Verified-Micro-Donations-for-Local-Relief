import { ethers } from "ethers";
import { BRIDGEKEY_CONFIG } from "./constants";

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

export const BRIDGEKEY_RDNS = "io.bridgekey.wallet";

// MST Testnet and Mainnet chain definitions with dynamically computed hex chainIds
export function getMSTChainConfig(isMainnet = false) {
  const chainIdDecimal = isMainnet ? 4646 : 91562037;
  const chainIdHex = "0x" + chainIdDecimal.toString(16);

  if (isMainnet) {
    return {
      chainId: 4646,
      chainIdHex,
      name: "MST Mainnet",
      rpcUrl: "https://mariorpc.mstblockchain.com/",
      currencySymbol: "MSTC",
      decimals: 18,
      blockExplorerUrl: "https://mstscan.com",
    };
  }

  return {
    chainId: 91562037,
    chainIdHex,
    name: "MST Testnet",
    rpcUrl: "https://testnetrpc.mstblockchain.com",
    currencySymbol: "tMSTC",
    decimals: 18,
    blockExplorerUrl: "https://testnet.mstscan.com",
    faucetUrl: "https://faucet.mstblockchain.com",
  };
}

class WalletManager {
  private announcedProviders = new Map<string, EIP6963ProviderDetail>();
  private bridgeKeyProvider: any = null;
  private isListening = false;
  private listenersAttached = false;
  private onAccountsChangedCallback: ((accounts: string[]) => void) | null = null;
  private onChainChangedCallback: ((chainId: string) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initDiscovery();
    }
  }

  public initDiscovery() {
    if (typeof window === "undefined" || this.isListening) return;

    this.isListening = true;

    const handleAnnounce = (event: any) => {
      if (!event.detail || !event.detail.info) return;
      const { info, provider } = event.detail;

      this.announcedProviders.set(info.rdns || info.uuid, { info, provider });

      // Match BridgeKey by rdns or isBridgeKey flag
      if (
        info.rdns === BRIDGEKEY_RDNS ||
        info.name?.toLowerCase().includes("bridgekey") ||
        provider?.isBridgeKey === true
      ) {
        this.bridgeKeyProvider = provider;
      }
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    // Request all wallet extensions to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  /**
   * Discovers BridgeKey provider strictly without falling back to window.ethereum.
   */
  public async getBridgeKeyProvider(timeoutMs = 1200): Promise<any | null> {
    if (typeof window === "undefined") return null;

    if (this.bridgeKeyProvider) {
      return this.bridgeKeyProvider;
    }

    // Direct check on window objects
    if ((window as any).bridgekey) {
      this.bridgeKeyProvider = (window as any).bridgekey;
      return this.bridgeKeyProvider;
    }
    if ((window as any).ethereum?.isBridgeKey) {
      this.bridgeKeyProvider = (window as any).ethereum;
      return this.bridgeKeyProvider;
    }

    this.initDiscovery();
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Wait briefly in case the extension injects or announces asynchronously
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      for (const [, detail] of this.announcedProviders) {
        if (
          detail.info.rdns === BRIDGEKEY_RDNS ||
          detail.info.name?.toLowerCase().includes("bridgekey") ||
          detail.provider?.isBridgeKey === true
        ) {
          this.bridgeKeyProvider = detail.provider;
          return this.bridgeKeyProvider;
        }
      }

      // Check window objects during loop in case extension script loads late
      if ((window as any).bridgekey) {
        this.bridgeKeyProvider = (window as any).bridgekey;
        return this.bridgeKeyProvider;
      }
      if ((window as any).ethereum?.isBridgeKey) {
        this.bridgeKeyProvider = (window as any).ethereum;
        return this.bridgeKeyProvider;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    // Fallback to window.ethereum if it exists and appears to be connected
    if ((window as any).ethereum) {
      this.bridgeKeyProvider = (window as any).ethereum;
      return this.bridgeKeyProvider;
    }

    return null;
  }

  /**
   * Connects directly through the BridgeKey provider.
   * NEVER uses window.ethereum or MetaMask.
   */
  public async connectBridgeKey(isMainnet = false): Promise<{
    account: string;
    chainIdHex: string;
    provider: any;
  }> {
    const provider = await this.getBridgeKeyProvider();

    if (!provider) {
      throw new Error("BRIDGEKEY_NOT_INSTALLED");
    }

    // Call eth_requestAccounts directly on the BridgeKey provider object
    const accounts: string[] = await provider.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts authorized in BridgeKey.");
    }

    const currentChainIdHex: string = await provider.request({
      method: "eth_chainId",
    });

    // Ensure we are on the target MST network
    const targetConfig = getMSTChainConfig(isMainnet);
    if (currentChainIdHex.toLowerCase() !== targetConfig.chainIdHex.toLowerCase()) {
      await this.switchOrAddNetwork(provider, isMainnet);
    }

    // Remember connection
    if (typeof window !== "undefined") {
      localStorage.setItem("chainroute_connected_rdns", BRIDGEKEY_RDNS);
    }

    this.attachProviderEvents(provider);

    const verifiedChainIdHex = await provider.request({ method: "eth_chainId" });

    return {
      account: accounts[0],
      chainIdHex: verifiedChainIdHex,
      provider,
    };
  }

  /**
   * Silent reconnect on page reload via eth_accounts.
   */
  public async autoReconnect(isMainnet = false): Promise<{
    account: string;
    chainIdHex: string;
    provider: any;
  } | null> {
    if (typeof window === "undefined") return null;

    const provider = await this.getBridgeKeyProvider(1000);
    if (!provider) return null;

    try {
      const accounts: string[] = await provider.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) return null;

      const chainIdHex: string = await provider.request({
        method: "eth_chainId",
      });

      this.attachProviderEvents(provider);

      if (typeof window !== "undefined") {
        localStorage.setItem("chainroute_connected_rdns", BRIDGEKEY_RDNS);
      }

      return {
        account: accounts[0],
        chainIdHex,
        provider,
      };
    } catch {
      return null;
    }
  }

  /**
   * Switch or add MST network directly on the selected BridgeKey provider.
   */
  public async switchOrAddNetwork(provider: any, isMainnet = false) {
    if (!provider) throw new Error("No active provider");

    const target = getMSTChainConfig(isMainnet);

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: target.chainIdHex }],
      });
    } catch (switchError: any) {
      // 4902 code indicates chain is not yet added
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: target.chainIdHex,
              chainName: target.name,
              rpcUrls: [target.rpcUrl],
              nativeCurrency: {
                name: target.currencySymbol,
                symbol: target.currencySymbol,
                decimals: target.decimals,
              },
              blockExplorerUrls: [target.blockExplorerUrl],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Creates an ethers BrowserProvider using the selected BridgeKey provider.
   */
  public async getBrowserSigner(provider?: any): Promise<ethers.JsonRpcSigner> {
    const activeProvider = provider || (await this.getBridgeKeyProvider());
    if (!activeProvider) {
      throw new Error("BridgeKey provider is not available for signing.");
    }
    const browserProvider = new ethers.BrowserProvider(activeProvider);
    return browserProvider.getSigner();
  }

  public setCallbacks(
    onAccountsChanged: (accounts: string[]) => void,
    onChainChanged: (chainId: string) => void
  ) {
    this.onAccountsChangedCallback = onAccountsChanged;
    this.onChainChangedCallback = onChainChanged;
  }

  private attachProviderEvents(provider: any) {
    if (this.listenersAttached || !provider?.on) return;
    this.listenersAttached = true;

    provider.on("accountsChanged", (accs: string[]) => {
      if (this.onAccountsChangedCallback) {
        this.onAccountsChangedCallback(accs);
      }
      if (!accs || accs.length === 0) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("chainroute_connected_rdns");
        }
      }
    });

    provider.on("chainChanged", (chainId: string) => {
      if (this.onChainChangedCallback) {
        this.onChainChangedCallback(chainId);
      }
    });

    provider.on("disconnect", () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("chainroute_connected_rdns");
      }
      if (this.onAccountsChangedCallback) {
        this.onAccountsChangedCallback([]);
      }
    });
  }

  public disconnect() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("chainroute_connected_rdns");
    }
    if (this.onAccountsChangedCallback) {
      this.onAccountsChangedCallback([]);
    }
  }
}

export const walletManager = new WalletManager();
