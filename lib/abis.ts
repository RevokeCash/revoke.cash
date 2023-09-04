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

export const PERMIT2_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: true, internalType: 'address', name: 'spender', type: 'address' },
      { indexed: false, internalType: 'uint160', name: 'amount', type: 'uint160' },
      { indexed: false, internalType: 'uint48', name: 'expiration', type: 'uint48' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'Lockdown',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: true, internalType: 'address', name: 'spender', type: 'address' },
      { indexed: false, internalType: 'uint48', name: 'newNonce', type: 'uint48' },
      { indexed: false, internalType: 'uint48', name: 'oldNonce', type: 'uint48' },
    ],
    name: 'NonceInvalidation',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: true, internalType: 'address', name: 'spender', type: 'address' },
      { indexed: false, internalType: 'uint160', name: 'amount', type: 'uint160' },
      { indexed: false, internalType: 'uint48', name: 'expiration', type: 'uint48' },
      { indexed: false, internalType: 'uint48', name: 'nonce', type: 'uint48' },
    ],
    name: 'Permit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'word', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'mask', type: 'uint256' },
    ],
    name: 'UnorderedNonceInvalidation',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'allowance',
    outputs: [
      { internalType: 'uint160', name: 'amount', type: 'uint160' },
      { internalType: 'uint48', name: 'expiration', type: 'uint48' },
      { internalType: 'uint48', name: 'nonce', type: 'uint48' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint160', name: 'amount', type: 'uint160' },
      { internalType: 'uint48', name: 'expiration', type: 'uint48' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint48', name: 'newNonce', type: 'uint48' },
    ],
    name: 'invalidateNonces',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'wordPos', type: 'uint256' },
      { internalType: 'uint256', name: 'mask', type: 'uint256' },
    ],
    name: 'invalidateUnorderedNonces',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'address', name: 'spender', type: 'address' },
        ],
        internalType: 'struct IAllowanceTransfer.TokenSpenderPair[]',
        name: 'approvals',
        type: 'tuple[]',
      },
    ],
    name: 'lockdown',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'nonceBitmap',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'token', type: 'address' },
              { internalType: 'uint160', name: 'amount', type: 'uint160' },
              { internalType: 'uint48', name: 'expiration', type: 'uint48' },
              { internalType: 'uint48', name: 'nonce', type: 'uint48' },
            ],
            internalType: 'struct IAllowanceTransfer.PermitDetails[]',
            name: 'details',
            type: 'tuple[]',
          },
          { internalType: 'address', name: 'spender', type: 'address' },
          { internalType: 'uint256', name: 'sigDeadline', type: 'uint256' },
        ],
        internalType: 'struct IAllowanceTransfer.PermitBatch',
        name: 'permitBatch',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      {
        components: [
          {
            components: [
              { internalType: 'address', name: 'token', type: 'address' },
              { internalType: 'uint160', name: 'amount', type: 'uint160' },
              { internalType: 'uint48', name: 'expiration', type: 'uint48' },
              { internalType: 'uint48', name: 'nonce', type: 'uint48' },
            ],
            internalType: 'struct IAllowanceTransfer.PermitDetails',
            name: 'details',
            type: 'tuple',
          },
          { internalType: 'address', name: 'spender', type: 'address' },
          { internalType: 'uint256', name: 'sigDeadline', type: 'uint256' },
        ],
        internalType: 'struct IAllowanceTransfer.PermitSingle',
        name: 'permitSingle',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
