import React from "react";
import { useEthereum } from "utils/hooks/useEthereum";

const Network: React.FC = () => {
  const { chainName } = useEthereum();

  return (
    <div style={{display: "flex", alignSelf: "center"}}>
        <strong style={{fontSize: "1.5rem"}}>
            {chainName}
        </strong >
    </div>
  );
};

export default Network;
