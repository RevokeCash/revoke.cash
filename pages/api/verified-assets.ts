import { IRON_OPTIONS } from 'components/common/constants';
import { ironSession } from 'iron-session/express';
import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import requestIp from 'request-ip';
import axios from 'axios';

const rateLimiter = rateLimit({
  windowMs: 1 * 1000, // 1s
  max: 10, // 10 requests
});

const getAllAssets = async () => ({
  ...(await getAllAssetsFromCoinGecko()),
  ...(await getAllAssetsFromTokenLists()),
})

const getAllAssetsFromCoinGecko = async () => {
  console.log('xxx')
  const { data: assets } = await axios.get('https://api.coingecko.com/api/v3/coins/list?include_platform=true')
  const filteredAssets = assets.filter(
    (asset) => asset?.name && asset?.symbol && Object.entries(asset.platforms).some(([platform, address]) => (address as string)?.startsWith('0x'))
  )
  const assetEntries = filteredAssets.map(
    (asset) => Object.entries(asset.platforms).flatMap(([platform, address]) => [
      address,
      {
        name: asset.name,
        symbol: asset.symbol.toUpperCase(),
      }
    ])
  )
  const filteredAssetEntries = assetEntries
    .filter(([address]) => (address as string)?.startsWith('0x'))
    .map(([address, data]) => [address.trim(), data])
  const mappedAssets = Object.fromEntries(filteredAssetEntries)
  return mappedAssets
}

const getAllAssetsFromTokenLists = async () => {
  const tokenLists = [
    'https://tokens.1inch.eth.link/',
    'https://static.optimism.io/optimism.tokenlist.json',
    'https://raw.githubusercontent.com/pancakeswap/pancake-swap-interface/master/src/constants/token/pancakeswap.json',
    'https://tokens.honeyswap.org',
    'https://unpkg.com/quickswap-default-token-list@1.0.28/build/quickswap-default.tokenlist.json',
    'https://raw.githubusercontent.com/MetisProtocol/metis/master/tokenlist/toptoken.json',
    'https://bridge.arbitrum.io/token-list-42161.json',
    'https://raw.githubusercontent.com/pangolindex/tokenlists/main/aeb.tokenlist.json',
    'https://raw.githubusercontent.com/vasa-develop/nft-tokenlist/master/mainnet_curated_tokens.json'
  ]

  const tokens = await Promise.all(
    tokenLists.map(async (url) => (await axios.get(url))?.data?.tokens ?? [])
  )

  const tokenMapping = Object.fromEntries(
    tokens.flat().map(({ address, chainId, ...token }) => [address, token])
  )

  return tokenMapping
}

// Fire off the request to get the latest assets from CoinGecko
const assetPromise = getAllAssets()

const handler = nc<NextApiRequest, NextApiResponse>()
  .use(requestIp.mw({ attributeName: 'ip' }))
  .use(rateLimiter)
  .use(ironSession(IRON_OPTIONS))
  .get(async (req, res) => {
    const assets = await assetPromise;
    res.send(assets)
  })

export default handler;
