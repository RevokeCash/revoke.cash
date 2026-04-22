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
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) public payable',
  'function safeTransferFrom(address from, address to, uint256 tokenId) public payable',
  'function transferFrom(address from, address to, uint256 tokenId) public payable',
  'function approve(address approved, uint256 tokenId) public payable',
  'function setApprovalForAll(address spender, bool approved) public',
  'function getApproved(uint256 tokenId) public view returns (address)',
  'function isApprovedForAll(address owner, address spender) public view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed spender, bool approved)',
]);

export const ERC1155_ABI = parseAbi([
  'function balanceOf(address account, uint256 id) public view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) public view returns (uint256[])',
  'function setApprovalForAll(address operator, bool approved) public',
  'function isApprovedForAll(address account, address operator) public view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public',
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

export const AGW_SESSIONS_ABI = parseAbi([
  'function sessionStatus(address account, bytes32 sessionHash) external view returns (uint8)',
  'function revokeKey(bytes32 sessionHash) external',
  'event SessionCreated(address indexed account, bytes32 indexed sessionHash, SessionSpec sessionSpec)',
  'event SessionRevoked(address indexed account, bytes32 indexed sessionHash)',
  'struct SessionSpec { address signer; uint256 expiresAt; UsageLimit feeLimit; CallSpec[] callPolicies; TransferSpec[] transferPolicies; }',
  'struct CallSpec { address target; bytes4 selector; uint256 maxValuePerUse; UsageLimit valueLimit; Constraint[] constraints; }',
  'struct UsageLimit { uint8 limitType; uint256 limit; uint256 period; }',
  'struct Constraint { uint8 condition; uint64 index; bytes32 refValue; UsageLimit limit; }',
  'struct TransferSpec { address target; uint256 maxValuePerUse; UsageLimit valueLimit; }',
]);

export const DELEGATE_V1_ABI = parseAbi([
  'function checkDelegateForAll(address delegate, address vault) external view returns (bool)',
  'function checkDelegateForContract(address delegate, address vault, address contract_) external view returns (bool)',
  'function checkDelegateForToken(address delegate, address vault, address contract_, uint256 tokenId) external view returns (bool)',
  'function getDelegatesForAll(address vault) external view returns (address[])',
  'function getDelegatesForContract(address vault, address contract_) external view returns (address[])',
  'function getDelegatesForToken(address vault, address contract_, uint256 tokenId) external view returns (address[])',
  'function getContractLevelDelegations(address vault) external view returns ((address,address)[])',
  'function getTokenLevelDelegations(address vault) external view returns ((address,uint256,address)[])',
  'function getDelegationsByDelegate(address delegate) external view returns ((uint8,address,address,address,uint256)[])',
  'function revokeAllDelegates() external',
  'function revokeDelegate(address delegate) external',
  'function revokeSelf(address vault) external',
  'function supportsInterface(bytes4 interfaceId) external view returns (bool)',
  'event DelegateForAll(address vault, address delegate, bool value)',
  'event DelegateForContract(address vault, address delegate, address contract_, bool value)',
  'event DelegateForToken(address vault, address delegate, address contract_, uint256 tokenId, bool value)',
  'event RevokeAllDelegates(address vault)',
  'event RevokeDelegate(address vault, address delegate)',
]);

export const DELEGATE_V2_ABI = parseAbi([
  'function getOutgoingDelegations(address from) external view returns ((uint8,address,address,bytes32,address,uint256,uint256)[])',
  'function getIncomingDelegations(address to) external view returns ((uint8,address,address,bytes32,address,uint256,uint256)[])',
  'function getOutgoingDelegationHashes(address from) external view returns (bytes32[])',
  'function getIncomingDelegationHashes(address to) external view returns (bytes32[])',
  'function checkDelegateForAll(address to, address from, bytes32 rights) external view returns (bool)',
  'function checkDelegateForContract(address to, address from, address contract_, bytes32 rights) external view returns (bool)',
  'function checkDelegateForERC1155(address to, address from, address contract_, uint256 tokenId, bytes32 rights) external view returns (uint256)',
  'function checkDelegateForERC20(address to, address from, address contract_, bytes32 rights) external view returns (uint256)',
  'function checkDelegateForERC721(address to, address from, address contract_, uint256 tokenId, bytes32 rights) external view returns (bool)',
  'function delegateAll(address to, bytes32 rights, bool enable) external payable returns (bytes32)',
  'function delegateContract(address to, address contract_, bytes32 rights, bool enable) external payable returns (bytes32)',
  'function delegateERC1155(address to, address contract_, uint256 tokenId, bytes32 rights, uint256 amount) external payable returns (bytes32)',
  'function delegateERC20(address to, address contract_, bytes32 rights, uint256 amount) external payable returns (bytes32)',
  'function delegateERC721(address to, address contract_, uint256 tokenId, bytes32 rights, bool enable) external payable returns (bytes32)',
  'event DelegateAll(address indexed from, address indexed to, bytes32 rights, bool enable)',
  'event DelegateContract(address indexed from, address indexed to, address indexed contract_, bytes32 rights, bool enable)',
  'event DelegateERC1155(address indexed from, address indexed to, address indexed contract_, uint256 tokenId, bytes32 rights, uint256 amount)',
  'event DelegateERC20(address indexed from, address indexed to, address indexed contract_, bytes32 rights, uint256 amount)',
  'event DelegateERC721(address indexed from, address indexed to, address indexed contract_, uint256 tokenId, bytes32 rights, bool enable)',
]);

export const WARM_XYZ_ABI = parseAbi([
  'function getColdWalletLinks(address hotWallet) external view returns ((address,uint256)[])',
  'function getColdWallets(address hotWallet) external view returns (address[])',
  'function getHotWallet(address coldWallet) external view returns (address)',
  'function getHotWalletLink(address coldWallet) external view returns ((address,uint256))',
  'function removeColdWallet(address coldWallet) external',
  'function renounceHotWallet() external',
  'function setHotWallet(address hotWalletAddress, uint256 expirationTimestamp, bool lockHotWalletAddress) external',
  'event HotWalletChanged(address coldWallet, address from, address to, uint256 expirationTimestamp)',
]);
