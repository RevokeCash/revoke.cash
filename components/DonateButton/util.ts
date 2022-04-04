import { chains } from 'eth-chains'

export function getNativeToken(chainId: number): string {
  return chains.get(chainId)?.nativeCurrency?.symbol ?? 'ETH';
}

export function getDefaultAmount(nativeToken: string): string {
  const mapping = {
    'ETH': '0.01',
    'AETH': '0.01',
    'RBTC': '0.001',
    'BCH': '0.05',
    'BNB': '0.05',
    'xDAI': '25',
    'MATIC': '10',
    'AVAX': '0.25',
    'TLOS': '25',
    'METIS': '0.25',
    'FUSE': '50',
    'FTM': '20',
    'ONE': '100',
    'HT': '5',
    'SDN': '25',
    'GLMR': '5',
    'MOVR': '0.25',
    'IOTX': '250',
    'KLAYTN': '25',
  }

  return mapping[nativeToken] ?? '1';
}
