import LogoLink from 'components/common/LogoLink';
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
        <LogoLink src="/logos/github.png" alt="Source Code" href="https://github.com/rkalis/revoke.cash" />
        <LogoLink src="/logos/twitter.png" alt="Official Twitter" href="https://twitter.com/RevokeCash" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        <LogoLink src="/logos/ethereum.png" alt="Ethereum" href="https://ethereum.org/" />
        <LogoLink src="/logos/binance.png" alt="Binance Smart Chain" href="https://www.bnbchain.world/" />
        <LogoLink src="/logos/avalanche.png" alt="Avalanche" href="https://www.avax.network/" />
        <LogoLink src="/logos/polygon.png" alt="Polygon" href="https://polygon.technology/" />
        <LogoLink src="/logos/cronos.jpeg" alt="Cronos" href="https://cronos.org/" />
        <LogoLink src="/logos/fantom.png" alt="Fantom" href="https://fantom.foundation/" />
        <LogoLink src="/logos/btt.svg" alt="BitTorrent Chain" href="https://www.bittorrent.com/" />
        <LogoLink src="/logos/klaytn.png" alt="Klaytn" href="https://www.klaytn.com/" />
        <LogoLink src="/logos/celo.png" alt="Celo" href="https://celo.org/" />
        <LogoLink src="/logos/evmos.png" alt="Evmos" href="https://evmos.org/" />
        <LogoLink src="/logos/harmony.png" alt="Harmony" href="https://harmony.one/" />
        <LogoLink src="/logos/arbitrum.svg" alt="Arbitrum" href="https://arbitrum.io/" />
        <LogoLink src="/logos/optimism.jpeg" alt="Optimism" href="https://optimism.io/" />
        <LogoLink src="/logos/metis.png" alt="Metis" href="https://www.metis.io/" />
        <LogoLink src="/logos/gnosis-chain.png" alt="Gnosis Chain" href="https://www.xdaichain.com/" />
        <LogoLink src="/logos/aurora.jpeg" alt="Aurora" href="https://aurora.dev/" />
        <LogoLink src="/logos/rootstock.png" alt="Rootstock" href="https://www.rsk.co/" />
        <LogoLink src="/logos/smartbch.png" alt="SmartBCH" href="https://smartbch.org/" />
        <LogoLink src="/logos/moonbeam.png" alt="Moonbeam" href="https://moonbeam.network/" />
        <LogoLink src="/logos/moonriver.png" alt="Moonriver" href="https://moonbeam.network/networks/moonriver/" />
        <LogoLink src="/logos/astar.png" alt="Astar" href="https://astar.network/" />
        <LogoLink src="/logos/shiden.svg" alt="Shiden" href="https://shiden.astar.network/" />
        <LogoLink src="/logos/clover.jpeg" alt="CLV" href="https://clv.org/" />
        <LogoLink src="/logos/syscoin.png" alt="Syscoin" href="https://syscoin.org/" />
        <LogoLink src="/logos/telos.png" alt="Telos" href="https://www.telos.net/" />
        <LogoLink src="/logos/fuse.png" alt="Fuse" href="https://fuse.io/" />
        <LogoLink src="/logos/heco.png" alt="HECO" href="https://www.hecochain.com/" />
        <LogoLink src="/logos/iotex.png" alt="IoTeX" href="https://iotex.io/" />
        <LogoLink src="/logos/palm.jpeg" alt="Palm" href="https://palm.io/" />
      </div>
      {/* <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        Learn more:{' '}
        <a href="https://kalis.me/unlimited-erc20-allowances/">Unlimited ERC20 allowances considered harmful</a>
      </div> */}
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
