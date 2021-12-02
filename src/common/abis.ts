import ERC20Artifact from '@openzeppelin/contracts/build/contracts/ERC20.json'
import ERC721MetadataArtifact from '@openzeppelin/contracts/build/contracts/ERC721.json'

export const ERC20 = ERC20Artifact.abi
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

export const OPENSEA_REGISTRY = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"initialAddressSet","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"endGrantAuthentication","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"revokeAuthentication","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"pending","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"contracts","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"delegateProxyImplementation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"proxies","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"startGrantAuthentication","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"registerProxy","outputs":[{"name":"proxy","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DELAY_PERIOD","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"authAddress","type":"address"}],"name":"grantInitialAuthentication","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
