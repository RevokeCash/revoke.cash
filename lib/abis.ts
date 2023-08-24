import { parseAbi } from 'viem';

export const ERC20_ABI = parseAbi([
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function decimals() public view returns (uint8)',
  'function totalSupply() public view returns (uint256)',
  'function balanceOf(address _owner) public view returns (uint256 balance)',
  'function transfer(address _to, uint256 _value) public returns (bool success)',
  'function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)',
  'function approve(address _spender, uint256 _value) public returns (bool success)',
  'function allowance(address _owner, address _spender) public view returns (uint256 remaining)',
  'event Transfer(address indexed _from, address indexed _to, uint256 _value)',
  'event Approval(address indexed _owner, address indexed _spender, uint256 _value)',
  // EIP2612 Permit:
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',
  'function nonces(address owner) public view returns (uint256)',
  'function DOMAIN_SEPARATOR() external view returns (bytes32)',
]);

export const ERC721_ABI = parseAbi([
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function balanceOf(address _owner) public view returns (uint256 balance)',
  'function ownerOf(uint256 _tokenId) public view returns (address owner)',
  'function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) public payable',
  'function safeTransferFrom(address _from, address _to, uint256 _tokenId) public payable',
  'function transferFrom(address _from, address _to, uint256 _tokenId) public payable',
  'function approve(address _approved, uint256 _tokenId) public payable',
  'function setApprovalForAll(address _operator, bool _approved) public',
  'function getApproved(uint256 _tokenId) public view returns (address)',
  'function isApprovedForAll(address _owner, address _operator) public view returns (bool)',
  'event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId)',
  'event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId)',
  'event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved)',
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

export const OPENSEA_SEAPORT_ABI = parseAbi(['function incrementCounter() public returns (uint256)']);

export const BLUR_ABI = parseAbi(['function incrementNonce() public']);

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
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable',
]);
