import ERC20Artifct from '@openzeppelin/contracts/build/contracts/ERC20.json'
import ERC721MetadataArtifact from '@openzeppelin/contracts/build/contracts/ERC721.json'

export const ERC20 = ERC20Artifct.abi
export const ERC721Metadata = ERC721MetadataArtifact.abi

export const TokensView = [
  {
    constant: true,
    inputs: [
      { internalType: "address", name: "_t2crAddress", type: "address" },
      { internalType: "address[]", name: "_tokenAddresses", type: "address[]" }
    ],
    name: "getTokensIDsForAddresses",
    outputs: [{ internalType: "bytes32[]", name: "result", type: "bytes32[]" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { internalType: "address", name: "_t2crAddress", type: "address" },
      { internalType: "bytes32[]", name: "_tokenIDs", type: "bytes32[]" }
    ],
    name: "getTokens",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "ID", type: "bytes32" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "ticker", type: "string" },
          { internalType: "address", name: "addr", type: "address" },
          { internalType: "string", name: "symbolMultihash", type: "string" },
          {
            internalType: "enum IArbitrableTokenList.TokenStatus",
            name: "status",
            type: "uint8"
          },
          { internalType: "uint256", name: "decimals", type: "uint256" }
        ],
        internalType: "struct TokensView.Token[]",
        name: "tokens",
        type: "tuple[]"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
]
