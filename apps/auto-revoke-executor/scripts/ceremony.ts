// One-time operator ceremony that provisions the cold/hot wallet split for the auto-revoke executor.
//
// The cold wallet is a deployed MetaMask MultiSig DeleGator smart account whose sole signer is the
// Ledger key (threshold 1). We use a deployed smart account rather than an EIP-7702-upgraded EOA
// because Ledger's firmware only whitelists the Ethereum Foundation's Simple7702Account as a 7702
// delegate, not MetaMask's DeleGator — so 7702-via-Ledger is not possible.
//
// Per chain it:
//   1. Deploys the cold MultiSig DeleGator (paid by the hot wallet) if it isn't deployed yet. The
//      address is deterministic across chains (CREATE2 from the Ledger signer + salt).
//   2. Has the cold smart account sign a cold delegation scoped to `redeemDelegations` on
//      the DelegationManager (the Ledger signs the EIP-712 payload as the MultiSig signer). That
//      signed delegation is the executor's outer `permissionContext`.
//
// Output is a per-chain JSON map of signed cold delegations, which becomes executor config.
//
// Run (from apps/auto-revoke-executor): `yarn ceremony` (defaults to Sepolia only), or
//   `yarn ceremony --all`                  all auto-revoke chains
//   `yarn ceremony --chains=1,8453`        specific chains
//   `yarn ceremony --out=path.json`        output path (default src/config/cold-delegations.json)
//   `yarn ceremony --path="44'/60'/0'/0/0"` Ledger derivation path
//   `yarn ceremony --force`                re-run chains already present in the output file
//
// Requires AUTO_REVOKE_EXECUTOR_PRIVATE_KEY (the hot wallet, funded on each target chain) in the env.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';
import { ChainId } from '@revoke.cash/chains';
import { AUTO_REVOKE_SUPPORTED_CHAINS, isAutoRevokeSupportedChain } from '@revoke.cash/core/auto-revoke/config';
import { createViemPublicClientForChain, getChainRpcUrl, getViemChainConfig } from '@revoke.cash/core/chains';
import { AUTO_REVOKE_DELEGATION_ADDRESS } from '@revoke.cash/core/constants';
import { type Address, createWalletClient, getAddress, type Hex, http, type PublicClient } from 'viem';
import { type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts';
import {
  buildColdSmartAccount,
  type ColdSmartAccount,
  REDEEM_DELEGATIONS_SIGNATURE,
  signColdDelegation,
} from './cold-account';
import { type CeremonyOutput, DEFAULT_DELEGATIONS_PATH, type SignedDelegation } from './delegations';
import { connectLedgerColdSigner, type LedgerColdSigner } from './ledger-cold-signer';

const DEFAULT_DERIVATION_PATH = "44'/60'/0'/0/0";

interface CeremonyOptions {
  chainIds: number[];
  outputPath: string;
  derivationPath: string;
  force: boolean;
}

const main = async (): Promise<void> => {
  const options = parseOptions(process.argv.slice(2));
  const hotAccount = loadHotAccount();
  const existing = readExistingDelegations(options.outputPath);

  console.log(`Hot wallet (executor / delegate): ${hotAccount.address}`);
  console.log(`Expected cold smart account (delegation root): ${getAddress(AUTO_REVOKE_DELEGATION_ADDRESS)}`);
  console.log(`Chains: ${options.chainIds.join(', ')}`);
  console.log('Connect your Ledger, open the Ethereum app, and confirm prompts as they appear.\n');

  const cold = await connectLedgerColdSigner(options.derivationPath);
  console.log(`Ledger signer (cold smart-account owner): ${cold.address}\n`);

  try {
    for (const chainId of options.chainIds) {
      if (existing[chainId] && !options.force) {
        console.log(`- chain ${chainId}: already provisioned`);
        continue;
      }
      existing[chainId] = await provisionChain(chainId, cold, hotAccount);
      writeDelegations(options.outputPath, existing);
      console.log(`- chain ${chainId}: done\n`);
    }
  } finally {
    await cold.disconnect();
  }

  console.log(`\nCeremony complete. Signed cold delegations written to ${options.outputPath}`);
};

const provisionChain = async (
  chainId: number,
  cold: LedgerColdSigner,
  hotAccount: PrivateKeyAccount,
): Promise<SignedDelegation> => {
  console.log(`- chain ${chainId}: provisioning`);
  const environment = getSmartAccountsEnvironment(chainId);
  const publicClient = createViemPublicClientForChain(chainId);

  const coldSmartAccount = await buildColdSmartAccount(publicClient, cold);
  console.log(`    cold smart account: ${coldSmartAccount.address}`);
  assertColdSmartAccountAddress(coldSmartAccount.address);

  await ensureColdDeployed(coldSmartAccount, publicClient, hotAccount, chainId);

  console.log('    sign the cold delegation on your Ledger...');
  return signColdDelegation(coldSmartAccount, hotAccount.address, REDEEM_DELEGATIONS_SIGNATURE, environment);
};

const ensureColdDeployed = async (
  coldSmartAccount: ColdSmartAccount,
  publicClient: PublicClient,
  hotAccount: PrivateKeyAccount,
  chainId: number,
): Promise<void> => {
  if (await coldSmartAccount.isDeployed()) {
    console.log('    cold smart account already deployed, skipping deployment');
    return;
  }

  const { factory, factoryData } = await coldSmartAccount.getFactoryArgs();
  if (!factory || !factoryData) {
    throw new Error(`Could not resolve factory args for the cold smart account on chain ${chainId}`);
  }

  const walletClient = createWalletClient({
    account: hotAccount,
    chain: getViemChainConfig(chainId),
    transport: http(getChainRpcUrl(chainId)),
  });

  console.log('    deploying cold smart account (paid by the hot wallet)...');
  const hash = await walletClient.sendTransaction({ to: factory, data: factoryData });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`    cold smart account deployed (tx ${hash})`);
};

const parseOptions = (args: string[]): CeremonyOptions => {
  const flags = new Map(
    args.map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value ?? 'true'] as const;
    }),
  );

  const chainIds = flags.has('all')
    ? [...AUTO_REVOKE_SUPPORTED_CHAINS]
    : flags.has('chains')
      ? flags.get('chains')!.split(',').map(Number)
      : [ChainId.EthereumSepolia];

  const unsupported = chainIds.filter((chainId) => !isAutoRevokeSupportedChain(chainId));
  if (unsupported.length > 0) {
    throw new Error(`Unsupported auto-revoke chain(s): ${unsupported.join(', ')}`);
  }

  return {
    chainIds,
    outputPath: flags.get('out') ?? DEFAULT_DELEGATIONS_PATH,
    derivationPath: flags.get('path') ?? DEFAULT_DERIVATION_PATH,
    force: flags.has('force'),
  };
};

const loadHotAccount = (): PrivateKeyAccount => {
  const privateKey = process.env.AUTO_REVOKE_EXECUTOR_PRIVATE_KEY as Hex | undefined;
  if (!privateKey) throw new Error('AUTO_REVOKE_EXECUTOR_PRIVATE_KEY (hot wallet) is required');
  return privateKeyToAccount(privateKey);
};

const assertColdSmartAccountAddress = (coldAddress: Address): void => {
  if (coldAddress !== getAddress(AUTO_REVOKE_DELEGATION_ADDRESS)) {
    throw new Error(
      `Cold smart-account address ${coldAddress} does not match AUTO_REVOKE_DELEGATION_ADDRESS ` +
        `${getAddress(AUTO_REVOKE_DELEGATION_ADDRESS)}. If this is the intended cold wallet, set ` +
        `AUTO_REVOKE_DELEGATION_ADDRESS to ${coldAddress}; otherwise check the Ledger derivation path (--path).`,
    );
  }
};

const readExistingDelegations = (outputPath: string): CeremonyOutput => {
  try {
    return JSON.parse(readFileSync(outputPath, 'utf8'));
  } catch {
    return {};
  }
};

const writeDelegations = (outputPath: string, delegations: CeremonyOutput): void => {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(delegations, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
