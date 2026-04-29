import { ethers } from 'ethers';

// RemitHub ABI - RemittanceCreated event
export const REMIT_HUB_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "remitId", "type": "bytes32" },
      { "indexed": true, "name": "sender", "type": "address" },
      { "indexed": false, "name": "receiver", "type": "address" },
      { "indexed": false, "name": "token", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "feeTaken", "type": "uint256" },
      { "indexed": false, "name": "corridor", "type": "string" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "RemittanceCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "receiver", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "corridor", "type": "string" }
    ],
    "name": "remit",
    "outputs": [{ "name": "remitId", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ERC20 ABI subset
export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  }
];

// Get provider
export function getProvider() {
  const rpcUrl = process.env.CHAIN_RPC || 'https://rpc-amoy.polygon.technology';
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Get contract instance
export function getRemitHubContract(signerOrProvider) {
  const address = process.env.REMIT_HUB_ADDRESS;
  if (!address) {
    throw new Error('REMIT_HUB_ADDRESS not configured');
  }
  return new ethers.Contract(address, REMIT_HUB_ABI, signerOrProvider);
}

export function getUSDCContract(signerOrProvider) {
  const address = process.env.USDC_ADDRESS;
  if (!address) {
    throw new Error('USDC_ADDRESS not configured');
  }
  return new ethers.Contract(address, ERC20_ABI, signerOrProvider);
}

// Parse RemittanceCreated event from transaction receipt
export async function parseRemittanceCreatedEvent(txHash) {
  const provider = getProvider();
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    throw new Error('Transaction not found');
  }
  
  if (receipt.status !== 1) {
    throw new Error('Transaction failed on-chain');
  }
  
  const iface = new ethers.Interface(REMIT_HUB_ABI);
  
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({
        topics: log.topics,
        data: log.data
      });
      
      if (parsed.name === 'RemittanceCreated') {
        return {
          remitId: parsed.args.remitId,
          sender: parsed.args.sender,
          receiver: parsed.args.receiver,
          token: parsed.args.token,
          amount: parsed.args.amount.toString(),
          feeTaken: parsed.args.feeTaken.toString(),
          corridor: parsed.args.corridor,
          timestamp: Number(parsed.args.timestamp),
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber
        };
      }
    } catch (e) {
      // Not the event we're looking for
      continue;
    }
  }
  
  throw new Error('RemittanceCreated event not found in transaction');
}

// Check if we're in sandbox mode
export function isSandboxMode() {
  // Sandbox if explicitly enabled OR if contract addresses not configured
  return process.env.SANDBOX_MODE === 'true' || 
         !process.env.REMIT_HUB_ADDRESS || 
         !process.env.USDC_ADDRESS;
}

// Simulate RemittanceCreated event (for sandbox mode)
export function simulateRemittanceCreated(txHash, sender, receiver, amountUSDC, feeUSDC, corridor) {
  // Generate deterministic remitId from txHash
  const remitId = ethers.keccak256(ethers.toUtf8Bytes(txHash));
  
  return {
    remitId,
    sender: sender || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    receiver,
    token: process.env.USDC_ADDRESS || '0x0000000000000000000000000000000000000001',
    amount: ethers.parseUnits(amountUSDC, 6).toString(),
    feeTaken: ethers.parseUnits(feeUSDC, 6).toString(),
    corridor,
    timestamp: Math.floor(Date.now() / 1000),
    txHash,
    blockNumber: 12345678
  };
}