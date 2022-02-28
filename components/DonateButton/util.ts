export function getNativeToken(chainId: number): string {
  const alternatives = {
    30: 'RBTC',
    56: 'BNB',
    97: 'BNB',
    99: 'POA',
    100: 'xDAI',
    137: 'MATIC',
    10000: 'BCH',
    43113: 'AVAX',
    43114: 'AVAX',
    80001: 'MATIC',
  }

  return alternatives[chainId] || 'ETH'
}

export function getDefaultAmount(nativeToken: string): string {
  const mapping = {
    'ETH': '0.01',
    'RBTC': '0.001',
    'BCH': '0.05',
    'BNB': '0.05',
    'POA': '200',
    'xDAI': '10',
    'MATIC': '10',
    'AVAX': '0.25'
  }

  return mapping[nativeToken]
}
