'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Send, Users, Banknote, ArrowUpRight, LogOut, History, TrendingUp, AlertTriangle } from 'lucide-react';
import Web3Wallet from '@/components/Web3Wallet';

export default function AppDashboard() {
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total: 0, volume: '0', avgAmount: '0' });
  const [liveRate, setLiveRate] = useState(null);
  const sandbox = true;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    } else if (isAuthenticated) {
      fetchContacts();
      fetchTransactions();
      fetchLiveRate();
    }
  }, [loading, isAuthenticated, router]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions?limit=5');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);

        if (data.transactions.length > 0) {
          const totalVolume = data.transactions.reduce((sum, tx) =>
            sum + parseFloat(tx.amountUSDC), 0
          );
          setStats({
            total: data.total,
            volume: totalVolume.toFixed(2),
            avgAmount: (totalVolume / data.transactions.length).toFixed(2)
          });
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchLiveRate = async () => {
    try {
      const res = await fetch('/api/rates/live');
      if (res.ok) {
        const data = await res.json();
        setLiveRate(data.usd_inr);
      }
    } catch (error) {
      console.error('Error fetching live rate:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">⚡</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">⛓️</div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              RemitChain
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">{user?.email}</span>
            {profile?.role === 'ADMIN' && (
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                Admin
              </Badge>
            )}
            {sandbox && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                🧪 Sandbox
              </Badge>
            )}
            <Web3Wallet
              onConnect={setWalletAddress}
              onDisconnect={() => setWalletAddress(null)}
            />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">Manage your cross-border remittances</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Live USD/INR Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">₹{liveRate || '83.15'}</div>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.volume}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgAmount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link href="/app/send">
            <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
              <CardHeader>
                <Send className="h-8 w-8 text-blue-400 mb-2" />
                <CardTitle className="text-lg">Send Money</CardTitle>
                <CardDescription>Start a new remittance</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/app/contacts">
            <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
              <CardHeader>
                <Users className="h-8 w-8 text-cyan-400 mb-2" />
                <CardTitle className="text-lg">Contacts</CardTitle>
                <CardDescription>{contacts.length} saved recipients</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/app/transactions">
            <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
              <CardHeader>
                <History className="h-8 w-8 text-teal-400 mb-2" />
                <CardTitle className="text-lg">History</CardTitle>
                <CardDescription>View all transactions</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/app/cashout">
            <Card className="cursor-pointer hover:bg-accent transition-colors h-full">
              <CardHeader>
                <Banknote className="h-8 w-8 text-emerald-400 mb-2" />
                <CardTitle className="text-lg">Cash Out</CardTitle>
                <CardDescription>Withdraw to UPI/Bank</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {contacts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Send to Contacts</CardTitle>
              <CardDescription>Recently used recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {contacts.slice(0, 3).map((contact) => (
                  <Link key={contact.id} href={`/app/send?contact=${contact.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.type}</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Remittances</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </div>
              {transactions.length > 0 && (
                <Link href="/app/transactions">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {walletAddress ? 'No transactions yet' : 'Connect wallet to see transactions'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Start sending to see your transaction history
                    </div>
                  </div>
                </div>
                {walletAddress && (
                  <Link href="/app/send">
                    <Button>Send Money</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate">{tx.receiverAddress}</div>
                          {tx.hasFraud && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Flagged
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-mono">{tx.amountUSDC} USDC</span> → <span className="text-emerald-400 font-mono">{tx.amountINR} INR</span>
                          <span className="mx-2">•</span>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {tx.receiptId && (
                      <Link href={`/app/receipt/${tx.receiptId}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {transactions.length === 0 && (
          <Card className="mt-8 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✅ 1. You're signed in as {user?.email}</p>
              <p>{walletAddress ? '✅' : '⭕'} 2. Connect your wallet (real MetaMask or simulated)</p>
              <p>3. Click "Send Money" to create your first remittance</p>
              <p>4. Add contacts for quick sending</p>
              <p>5. Download receipts for your records</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
