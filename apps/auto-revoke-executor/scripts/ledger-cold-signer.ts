// Ledger (cold wallet) signing adapter for the auto-revoke executor operator scripts, built on
// Ledger's Device Management Kit. The cold wallet is a deployed MetaMask MultiSig DeleGator smart
// account whose sole signer is this Ledger key (so there is no EIP-7702 authorization, and Ledger's
// 7702 whitelist never applies). The adapter exposes:
//
//   1. `account` — a viem `LocalAccount` whose `signTypedData` is backed by the Ledger, used as the
//      MultiSig signer so the smart-accounts-kit can sign the cold delegation (ceremony).
//   2. `signTransaction` — sign a serialized transaction (kill switch), used when the Ledger key
//      submits the on-chain revocation of the cold delegation.
//
// NOTE: the DMK talks to the physical device over USB-HID, so this module cannot be exercised
// without the Ledger plugged in and the Ethereum app open.

import {
  type DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKitBuilder,
  type ExecuteDeviceActionReturnType,
} from '@ledgerhq/device-management-kit';
import { Signature, SignerEthBuilder, TypedData } from '@ledgerhq/device-signer-kit-ethereum';
import { nodeHidTransportFactory } from '@ledgerhq/device-transport-kit-node-hid';
import { firstValueFrom } from 'rxjs';
import { type Address, getAddress, type Hex, hexToBytes, type LocalAccount, serializeSignature } from 'viem';
import { toAccount } from 'viem/accounts';

export interface LedgerColdSigner {
  address: Address;
  account: LocalAccount;
  signTransaction(serializedUnsignedTransaction: Hex): Promise<Signature>;
  disconnect(): Promise<void>;
}

export const connectLedgerColdSigner = async (derivationPath: string): Promise<LedgerColdSigner> => {
  const dmk = new DeviceManagementKitBuilder().addTransport(nodeHidTransportFactory).build();

  const device = await firstValueFrom(dmk.startDiscovering({}));
  await dmk.stopDiscovering();
  const sessionId = await dmk.connect({ device });
  const signer = new SignerEthBuilder({ dmk, sessionId }).build();

  const addressResponse = await resolveDeviceAction(signer.getAddress(derivationPath));
  const address = getAddress(addressResponse.address);

  const account = toAccount({
    address,
    async signTypedData(typedData) {
      // The smart-accounts-kit calls this with the canonical Delegation EIP-712 payload; the shapes
      // (domain/types/primaryType/message) line up with the DMK `TypedData` model.
      const signature = await resolveDeviceAction(signer.signTypedData(derivationPath, typedData as TypedData));
      return serializeSignature({ r: signature.r, s: signature.s, v: BigInt(signature.v) });
    },
    signMessage() {
      // The MultiSig DeleGator signs delegations via signTypedData; signMessage shouldn't be reached.
      throw new Error('cold wallet signMessage is not expected in this flow');
    },
    signTransaction() {
      // viem's account.signTransaction isn't used; the kill switch calls the adapter's own
      // signTransaction (below) with a pre-serialized transaction instead.
      throw new Error('use the adapter signTransaction(serializedTransaction) instead');
    },
  });

  return {
    address,
    account,
    async signTransaction(serializedUnsignedTransaction) {
      const signature = await resolveDeviceAction(
        signer.signTransaction(derivationPath, hexToBytes(serializedUnsignedTransaction)),
      );
      return signature;
    },
    async disconnect() {
      await dmk.disconnect({ sessionId });
    },
  };
};

// A DMK device action emits a stream of states; resolve to the `Completed` output or throw.
const resolveDeviceAction = <Output, Error, Intermediate>(
  action: ExecuteDeviceActionReturnType<Output, Error, Intermediate>,
): Promise<Output> => {
  return new Promise<Output>((resolve, reject) => {
    action.observable.subscribe({
      next: (state: DeviceActionState<Output, Error, Intermediate>) => {
        if (state.status === DeviceActionStatus.Completed) resolve(state.output);
        else if (state.status === DeviceActionStatus.Error) reject(toError(state.error));
        else if (state.status === DeviceActionStatus.Stopped) reject(new Error('Ledger action was stopped'));
      },
      error: reject,
    });
  });
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : JSON.stringify(error));
};
