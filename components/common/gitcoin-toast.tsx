import React from 'react';
import { toast } from 'react-toastify';

export const displayGitcoinToast = () => {
  // const toastContent = (
  //   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  //     <div>
  //       Hello friend! <span role="img" aria-label="wave">👋</span>
  //     </div>

  //     <div>
  //      Gitcoin Grants Round 12 is now live with over $2M in donation matching!
  //      Please consider supporting Revoke.cash by donating to the <a href="https://gitcoin.co/grants/259/rosco-kalis-crypto-software-engineer" target="_blank" rel="noopener noreferrer" style={{ color: 'red' }}>Revoke.cash grant</a>
  //     </div>
  //   </div>
  // )

  const toastContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        Hello friend! <span role="img" aria-label="wave">👋</span>
      </div>

      <div>
        My dad and I are launching our generative art project on Art Blocks on the 16th of May at 19:00 CET
      </div>

      <div>
        <a href="https://www.artblocks.io/project/303" target="_blank" rel="noopener noreferrer" style={{ color: 'red' }}>Check out the project on Art Blocks</a>
      </div>
    </div>
  )

  toast.info(toastContent, {
    position: "top-left",
    autoClose: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  })
}
