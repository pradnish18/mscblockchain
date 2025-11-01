'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SimpleWalletConnect() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());

      window.ethereum.request({ method: 'eth_accounts' }).then(handleAccountsChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setBalance(null);
    } else {
      setAccount(accounts[0]);
      fetchBalance(accounts[0]);
    }
  };

  const fetchBalance = async (address) => {
    try {
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const balanceWei = parseInt(balanceHex, 16);
      const balanceEth = (balanceWei / 1e18).toFixed(4);
      setBalance(balanceEth);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected. Please install MetaMask extension.');
      return;
    }

    setLoading(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      handleAccountsChanged(accounts);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isClient) {
    return null;
  }

  if (!account) {
    return (
      <Button onClick={connectWallet} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Connected</p>
            <p className="font-mono font-semibold">{formatAddress(account)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </div>
        {balance && (
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-semibold">{balance} MATIC</p>
          </div>
        )}
      </div>
    </Card>
  );
}
