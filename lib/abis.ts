import { parseAbi } from 'viem';

export const ERC20_ABI = parseAbi([
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function decimals() public view returns (uint8)',
  'function totalSupply() public view returns (uint256)',
  'function balanceOf(address owner) public view returns (uint256 balance)',
  'function transfer(address to, uint256 value) public returns (bool success)',
  'function transferFrom(address from, address to, uint256 value) public returns (bool success)',
  'function approve(address spender, uint256 value) public returns (bool success)',
  'function allowance(address owner, address spender) public view returns (uint256 remaining)',
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
  'event Approval(address indexed owner, address indexed spender, uint256 amount)',
  // EIP2612 Permit:
  'function permit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',
  'function nonces(address owner) public view returns (uint256)',
  'function DOMAIN_SEPARATOR() external view returns (bytes32)',
  'function version() external view returns (string)', // This is not part of the standard but is used by some tokens
  // increase/decrease allowance (non standard)
  'function increaseAllowance(address spender, uint256 addedValue) public returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool)',
]);

export const ERC721_ABI = parseAbi([
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function balanceOf(address owner) public view returns (uint256 balance)',
  'function ownerOf(uint256 tokenId) public view returns (address owner)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) public',
  'function safeTransferFrom(address from, address to, uint256 tokenId) public',
  'function transferFrom(address from, address to, uint256 tokenId) public',
  'function approve(address approved, uint256 tokenId) public',
  'function setApprovalForAll(address spender, bool approved) public',
  'function getApproved(uint256 tokenId) public view returns (address)',
  'function isApprovedForAll(address owner, address spender) public view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed spender, bool approved)',
]);

export const ERC1155_ABI = parseAbi([
  'function balanceOf(address owner, uint256 id) public view returns (uint256)',
  'function balanceOfBatch(address[] owners, uint256[] ids) public view returns (uint256[])',
  'function setApprovalForAll(address spender, bool approved) public',
  'function isApprovedForAll(address owner, address spender) public view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) public',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 amount)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] amounts)',
  'event ApprovalForAll(address indexed owner, address indexed spender, bool approved)',
  'event URI(string value, uint256 indexed id)',
]);

export const OPENSEA_REGISTRY_ABI = parseAbi([
  'function name() public view returns (string)',
  'function initialAddressSet() public view returns (bool)',
  'function endGrantAuthentication(address addr) public',
  'function revokeAuthentication(address addr) public',
  'function pending(address) public view returns (uint256)',
  'function contracts(address) public view returns (bool)',
  'function renounceOwnership() public',
  'function owner() public view returns (address)',
  'function delegateProxyImplementation() public view returns (address)',
  'function proxies(address) public view returns (address)',
  'function startGrantAuthentication(address addr) public',
  'function registerProxy() public returns (address proxy)',
  'function DELAY_PERIOD() public view returns (uint256)',
  'function grantInitialAuthentication(address authAddress) public',
  'function transferOwnership(address newOwner) public',
  'event OwnershipRenounced(address indexed previousOwner)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
]);

export const OPENSEA_SEAPORT_ABI = parseAbi([
  'function incrementCounter() public returns (uint256)',
  'event CounterIncremented(uint256, address indexed)',
]);

export const BLUR_ABI = parseAbi([
  'function incrementNonce() public',
  'event NonceIncremented(address indexed, uint256)',
]);

export const DAI_PERMIT_ABI = parseAbi([
  'function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) public',
  'function gello() public',
]);

export const PERMIT2_ABI = parseAbi([
  'event Approval(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration)',
  'event Lockdown(address indexed owner, address indexed token, address indexed spender)',
  'event Permit(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration, uint48 nonce)',
  'event NonceInvalidation(address indexed owner, address indexed token, address indexed spender, uint48 newNonce, uint48 oldNonce)',
  'event UnorderedNonceInvalidation(address indexed owner, uint256 word, uint256 mask)',
  'function DOMAIN_SEPARATOR() external view returns (bytes32)',
  'function allowance(address owner, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)',
  'function approve(address token, address spender, uint160 amount, uint48 expiration) external',
  'function invalidateNonces(address token, address spender, uint48 newNonce) external',
  'function invalidateUnorderedNonces(uint256 wordPos, uint256 mask) external',
  'function lockdown(TokenSpenderPair[] calldata approvals) external',
  'function permit(address owner, PermitBatch calldata permitBatch, bytes calldata signature) external',
  'function permit(address owner, PermitSingle calldata permitSingle, bytes calldata signature) external',
  'struct TokenSpenderPair { address token; address spender; }',
  'struct PermitSingle { PermitDetails details; address spender; uint256 sigDeadline; }',
  'struct PermitBatch { PermitDetails[] details; address spender; uint256 sigDeadline; }',
  'struct PermitDetails { address token; uint160 amount; uint48 expiration; uint48 nonce; }',
]);

export const UNISWAP_V2_ROUTER_ABI = parseAbi([
  'function getAmountsIn(uint256 amountOut, address[] memory path) public view returns (uint[] memory amounts)',
  // Some Uniswap v2 forks (notably Solarbeam on Moonriver) have a different signature for getAmountsIn
  'function getAmountsIn(uint256 amountOut, address[] memory path, uint256 fee) public view returns (uint[] memory amounts)',
]);

export const UNISWAP_V3_QUOTER_ABI = parseAbi([
  'function quoteExactOutput(bytes memory path, uint256 amountOut) external returns (uint256 amountIn, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)',
]);

export const UNISWAP_V3_POOL_ABI = parseAbi([
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
]);

export const UNSTOPPABLE_DOMAINS_ABI = parseAbi([
  'function getMany(string[] calldata keys, uint256 tokenId) external view returns (string[] memory)',
  'function reverseNameOf(address addr) external view returns (string memory)',
]);

export const AVVY_DOMAINS_ABI = parseAbi([
  'function resolveStandard(string calldata name, uint256 key) external view returns (string memory)',
  'function reverseResolveEVMToName(address addy) external view returns (string memory preimage)',
]);
