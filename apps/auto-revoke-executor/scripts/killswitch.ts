// Emergency kill switch for the auto-revoke executor. Disables every cold delegation listed in
// the ceremony output file on-chain, which instantly neuters the hot wallet: once a delegation is
// disabled, the hot wallet can no longer redeem it, so a leaked/compromised hot key becomes useless
// without having to rotate AUTO_REVOKE_DELEGATION_ADDRESS or move user funds.
//
// The cold wallet is a deployed MultiSig DeleGator (a contract), so `disableDelegation` must originate
// from the cold smart account. We avoid 4337/bundlers: with the Ledger connected, the cold account
// signs a `cold -> Ledger EOA` delegation scoped to `disableDelegation`, and the Ledger EOA then
// redeems it via a normal `redeemDelegations` tx — making the cold account call `disableDelegation`.
// So the Ledger signs the delegation + the tx, and only needs a little gas on each chain (funded
// separately). The hot wallet is deliberately not used — it may be the thing being revoked.
//
// Run (from apps/auto-revoke-executor):
//   `yarn killswitch`                 disable every chain in the file
//   `yarn killswitch --chains=1,8453` disable specific chains
//   `yarn killswitch --in=path.json`  input file (default src/config/cold-delegations.json)
//   `yarn killswitch --path="44'/60'/0'/0/0"` Ledger derivation path
//
// It is idempotent: cold delegations already disabled on-chain are skipped (before any signing),
// so it is safe to re-run (e.g. after topping up gas on a chain that failed).
import { readFileSync } from 'node:fs';
import {
  createExecution,
  type Delegation,
  ExecutionMode,
  getSmartAccountsEnvironment,
} from '@metamask/smart-accounts-kit';
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts';
import { hashDelegation } from '@metamask/smart-accounts-kit/utils';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { type Address, getAddress, type Hash, type Hex, type PublicClient, serializeTransaction } from 'viem';
import { buildColdSmartAccount, DISABLE_DELEGATION_SIGNATURE, signColdDelegation } from './cold-account';
import { type CeremonyOutput, DEFAULT_DELEGATIONS_PATH, DEFAULT_DERIVATION_PATH, parseFlags } from './delegations';
import { connectLedgerColdSigner, type LedgerColdSigner } from './ledger-cold-signer';

const main = async (): Promise<void> => {
  const options = parseOptions(process.argv.slice(2));
  const coldDelegationsByChain = readDelegations(options.inputPath, options.chainIds);

  console.log(`Disabling cold delegations on chains: ${[...coldDelegationsByChain.keys()].join(', ')}`);
  console.log('Connect your Ledger, open the Ethereum app, and confirm prompts as they appear.\n');

  const cold = await connectLedgerColdSigner(options.derivationPath);
  console.log(`Ledger EOA (kill-switch delegate): ${cold.address}\n`);

  try {
    for (const [chainId, coldDelegation] of coldDelegationsByChain) {
      await disableColdDelegation(chainId, coldDelegation, cold);
    }
  } finally {
    await cold.disconnect();
  }

  console.log('\nKill switch complete.');
};

const disableColdDelegation = async (
  chainId: number,
  coldDelegation: Delegation,
  cold: LedgerColdSigner,
): Promise<void> => {
  console.log(`- chain ${chainId}: disabling cold delegation`);
  const environment = getSmartAccountsEnvironment(chainId);
  const delegationManager = getAddress(environment.DelegationManager);
  const publicClient = createViemPublicClientForChain(chainId);
  const delegationHash = hashDelegation(coldDelegation);

  if (await isDisabled(publicClient, delegationManager, delegationHash)) {
    console.log('    already disabled on-chain, skipping');
    return;
  }

  const balance = await publicClient.getBalance({ address: cold.address });
  if (balance === 0n) {
    console.warn(`    Ledger EOA has no gas on chain ${chainId}; fund ${cold.address} and re-run. Skipping.`);
    return;
  }

  // Sign a fresh `cold -> Ledger EOA` delegation scoped to `disableDelegation`, then redeem it: its
  // single execution makes the cold smart account call `disableDelegation(coldDelegation)`.
  const coldSmartAccount = await buildColdSmartAccount(publicClient, cold);
  console.log('    sign the kill-switch (cold->ledger) delegation on your Ledger...');
  const killswitch = await signColdDelegation(
    coldSmartAccount,
    cold.address,
    DISABLE_DELEGATION_SIGNATURE,
    environment,
  );

  const disableCalldata = DelegationManager.encode.disableDelegation({ delegation: coldDelegation });
  const redeemData = DelegationManager.encode.redeemDelegations({
    delegations: [[killswitch]],
    modes: [ExecutionMode.SingleDefault],
    executions: [[createExecution({ target: delegationManager, value: 0n, callData: disableCalldata })]],
  });

  const hash = await sendFromLedger(cold, publicClient, chainId, delegationManager, redeemData);
  await publicClient.waitForTransactionReceipt({ hash });

  if (!(await isDisabled(publicClient, delegationManager, delegationHash))) {
    throw new Error(`disable tx ${hash} mined but the cold delegation is still enabled on chain ${chainId}`);
  }
  console.log(`    disabled (tx ${hash})`);
};

const sendFromLedger = async (
  cold: LedgerColdSigner,
  publicClient: PublicClient,
  chainId: number,
  to: Address,
  data: Hex,
): Promise<Hash> => {
  const [nonce, fees, gas] = await Promise.all([
    publicClient.getTransactionCount({ address: cold.address }),
    publicClient.estimateFeesPerGas(),
    publicClient.estimateGas({ account: cold.address, to, data }),
  ]);

  const unsignedTransaction = {
    type: 'eip1559' as const,
    chainId,
    nonce,
    to,
    data,
    value: 0n,
    gas,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  };

  console.log('    sign the disable transaction on your Ledger...');
  const signature = await cold.signTransaction(serializeTransaction(unsignedTransaction));
  const serializedTransaction = serializeTransaction(unsignedTransaction, {
    r: signature.r,
    s: signature.s,
    v: BigInt(signature.v),
  });

  return publicClient.sendRawTransaction({ serializedTransaction });
};

const isDisabled = (publicClient: PublicClient, delegationManager: Address, delegationHash: Hex): Promise<boolean> => {
  return DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: delegationManager,
    delegationHash,
  });
};

interface KillswitchOptions {
  inputPath: string;
  derivationPath: string;
  chainIds?: number[];
}

const parseOptions = (args: string[]): KillswitchOptions => {
  const flags = parseFlags(args);

  return {
    inputPath: flags.get('in') ?? DEFAULT_DELEGATIONS_PATH,
    derivationPath: flags.get('path') ?? DEFAULT_DERIVATION_PATH,
    chainIds: flags.has('chains') ? flags.get('chains')!.split(',').map(Number) : undefined,
  };
};

const readDelegations = (inputPath: string, chainIds?: number[]): Map<number, Delegation> => {
  let file: CeremonyOutput;
  try {
    file = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch {
    throw new Error(`Could not read delegations file at ${inputPath} (run the ceremony first)`);
  }

  const entries = Object.entries(file)
    .map(([chainId, coldDelegation]) => [Number(chainId), coldDelegation] as const)
    .filter(([chainId]) => !chainIds || chainIds.includes(chainId));

  if (entries.length === 0) throw new Error('No matching delegations to disable');
  return new Map(entries);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
