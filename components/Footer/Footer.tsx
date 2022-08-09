import { DISCORD_URL } from 'components/common/constants';
import LogoLink from 'components/common/LogoLink';
import { getChainLogo } from 'components/common/util';
import { ChainId } from 'eth-chains';
import React from 'react';
import { ToastContainer } from 'react-toastify';

const Footer: React.FC = () => (
  <>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        gap: '10px',
        padding: '20px',
        width: '100%',
        margin: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        <LogoLink
          src="/assets/images/vendor/github.png"
          alt="Source Code"
          href="https://github.com/rkalis/revoke.cash"
        />
        <LogoLink
          src="/assets/images/vendor/twitter.png"
          alt="Official Twitter"
          href="https://twitter.com/RevokeCash"
        />
        <LogoLink src="/assets/images/vendor/discord.png" alt="Official Discord" href={DISCORD_URL} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        <LogoLink src={getChainLogo(ChainId.EthereumMainnet)} alt="Ethereum" href="https://ethereum.org/" />
        <LogoLink
          src={getChainLogo(ChainId.BinanceSmartChainMainnet)}
          alt="Binance Smart Chain"
          href="https://www.bnbchain.world/"
        />
        <LogoLink src={getChainLogo(ChainId.AvalancheMainnet)} alt="Avalanche" href="https://www.avax.network/" />
        <LogoLink src={getChainLogo(ChainId.PolygonMainnet)} alt="Polygon" href="https://polygon.technology/" />
        <LogoLink src={getChainLogo(ChainId.CronosMainnetBeta)} alt="Cronos" href="https://cronos.org/" />
        <LogoLink src={getChainLogo(ChainId.FantomOpera)} alt="Fantom" href="https://fantom.foundation/" />
        <LogoLink
          src={getChainLogo(ChainId.BitTorrentChainMainnet)}
          alt="BitTorrent Chain"
          href="https://www.bittorrent.com/"
        />
        <LogoLink src={getChainLogo(ChainId.KlaytnMainnetCypress)} alt="Klaytn" href="https://www.klaytn.com/" />
        <LogoLink src={getChainLogo(ChainId.CeloMainnet)} alt="Celo" href="https://celo.org/" />
        <LogoLink src={getChainLogo(9001)} alt="Evmos" href="https://evmos.org/" />
        <LogoLink src={getChainLogo(ChainId.HarmonyMainnetShard0)} alt="Harmony" href="https://harmony.one/" />
        <LogoLink src={getChainLogo(ChainId.ArbitrumOne)} alt="Arbitrum" href="https://arbitrum.io/" />
        <LogoLink src={getChainLogo(ChainId.OptimisticEthereum)} alt="Optimism" href="https://optimism.io/" />
        <LogoLink src={getChainLogo(ChainId.MetisAndromedaMainnet)} alt="Metis" href="https://www.metis.io/" />
        <LogoLink src={getChainLogo(ChainId.XDAIChain)} alt="Gnosis Chain" href="https://www.xdaichain.com/" />
        <LogoLink src={getChainLogo(ChainId.AuroraMainNet)} alt="Aurora" href="https://aurora.dev/" />
        <LogoLink src={getChainLogo(ChainId.RSKMainnet)} alt="Rootstock" href="https://www.rsk.co/" />
        <LogoLink src={getChainLogo(ChainId.SmartBitcoinCash)} alt="SmartBCH" href="https://smartbch.org/" />
        <LogoLink src={getChainLogo(ChainId.Moonbeam)} alt="Moonbeam" href="https://moonbeam.network/" />
        <LogoLink
          src={getChainLogo(ChainId.Moonriver)}
          alt="Moonriver"
          href="https://moonbeam.network/networks/moonriver/"
        />
        <LogoLink src={getChainLogo(592)} alt="Astar" href="https://astar.network/" />
        <LogoLink src={getChainLogo(ChainId.Shiden)} alt="Shiden" href="https://shiden.astar.network/" />
        <LogoLink src={getChainLogo(ChainId.CloverMainnet)} alt="CLV" href="https://clv.org/" />
        <LogoLink src={getChainLogo(57)} alt="Syscoin" href="https://syscoin.org/" />
        <LogoLink src={getChainLogo(ChainId.TelosEVMMainnet)} alt="Telos" href="https://www.telos.net/" />
        <LogoLink src={getChainLogo(ChainId.FuseMainnet)} alt="Fuse" href="https://fuse.io/" />
        <LogoLink src={getChainLogo(ChainId.HuobiECOChainMainnet)} alt="HECO" href="https://www.hecochain.com/" />
        <LogoLink src={getChainLogo(ChainId.IoTeXNetworkMainnet)} alt="IoTeX" href="https://iotex.io/" />
        <LogoLink src={getChainLogo(ChainId.PalmMainnet)} alt="Palm" href="https://palm.io/" />
      </div>
    </div>
    <ToastContainer
      position="top-right"
      icon={false}
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      progressStyle={{ backgroundColor: 'black' }}
    />
  </>
);

export default Footer;
