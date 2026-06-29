type AuthenticationExtensionsClientOutputs = Record<keyof any, never>;

interface AuthenticatorAssertionResponse {
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle: ArrayBuffer | null;
}

interface AuthenticatorAttestationResponse {
  attestationObject: ArrayBuffer;
  getPublicKey(): ArrayBuffer | null;
}

declare const window: {
  document: {
    title: string;
  };
  location: {
    hostname: string;
    origin: string;
  };
  navigator: {
    credentials: {
      create(options?: unknown): Promise<unknown>;
      get(options?: unknown): Promise<unknown>;
    };
  };
};
