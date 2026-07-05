declare module "@cobo/cobo-waas2" {
  const CoboWaas2: {
    Env: {
      DEV: { basePath: string };
      PROD: { basePath: string };
    };
    ApiClient: {
      instance: {
        setEnv(env: { basePath: string }): void;
        setPrivateKey(privateKey: string, curveType?: string): void;
        signer?: {
          getPublicKey(): string;
        };
      };
    };
    WalletsApi: new () => {
      listWallets(opts?: { limit?: number }): Promise<{ data?: Array<Record<string, unknown>> }>;
      listSupportedChains(opts?: { limit?: number }): Promise<unknown>;
    };
  };

  export default CoboWaas2;
}
