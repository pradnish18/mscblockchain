'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ethers } from 'ethers';
import { toast } from 'sonner';

export default function Web3Wallet({ onConnect, onDisconnect }) {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
          await fetchBalance(address);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
          onConnect?.(address);
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      }
    }
  };

  const fetchBalance = async (address) => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
        
        if (usdcAddress) {
          // Real USDC balance
          const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
          const contract = new ethers.Contract(usdcAddress, abi, provider);
          const bal = await contract.balanceOf(address);
          const decimals = await contract.decimals();
          setBalance(ethers.formatUnits(bal, decimals));
        } else {
          // Simulate for demo
          setBalance('1250.00');
        }
      }
    } catch (error) {
      console.error('Balance fetch failed:', error);
      setBalance('0.00');
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setBalance(null);
      onDisconnect?.();
    } else {
      setAccount(accounts[0]);
      fetchBalance(accounts[0]);
      onConnect?.(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connect = async () => {
    setLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        // No MetaMask - simulate
        const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
        setAccount(demoAddress);
        setBalance('1250.00');
        setChainId(80002); // Polygon Amoy
        onConnect?.(demoAddress);
        toast.success('Simulated wallet connected (install MetaMask for real connection)');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setAccount(address);
      setChainId(Number(network.chainId));
      await fetchBalance(address);
      onConnect?.(address);
      toast.success('Wallet connected!');
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setBalance(null);
    setChainId(null);
    onDisconnect?.();
    toast.info('Wallet disconnected');
  };

  const truncateAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!account) {
    return (
      <Button onClick={connect} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {chainId && chainId !== 80002 && (
        <Badge variant="destructive">Wrong Network</Badge>
      )}
      {balance && (
        <Badge variant="outline" className="font-mono">
          {parseFloat(balance).toFixed(2)} USDC
        </Badge>
      )}
      <Badge variant="outline" className="font-mono">
        {truncateAddress(account)}
      </Badge>
      <Button variant="outline" size="sm" onClick={disconnect}>
        Disconnect
      </Button>
    </div>
  );
}