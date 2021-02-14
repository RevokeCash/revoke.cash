export function getNativeToken(chainId: number): string {
  const alternatives = {
    30: 'RBTC',
    56: 'BNB',
    97: 'BNB',
    99: 'POA',
    100: 'xDAI',
    137: 'MATIC',
    43113: 'AVAX',
    43114: 'AVAX',
    80001: 'MATIC',
  }

  return alternatives[chainId] || 'ETH'
}

export function getDefaultAmount(nativeToken: string): string {
  const mapping = {
    'ETH': '0.01',
    'RBTC': '0.0002',
    'BNB': '0.2',
    'POA': '300',
    'xDAI': '10',
    'MATIC': '150',
    'AVAX': '0.25'
  }

  return mapping[nativeToken]
}
