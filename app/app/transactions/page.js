'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status, router]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions?limit=20');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTotal(data.total);
      } else {
        toast.error('Failed to load transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">⚡</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            🧪 Sandbox Mode
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-muted-foreground">
            {total} total {total === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No transactions yet</p>
              <Link href="/app/send">
                <Button>Send Your First Remittance</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card key={tx.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {tx.receiverAddress}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {tx.receiverType}
                          </Badge>
                          {tx.hasFraud && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {tx.fraudFlags} flags
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-mono">{tx.amountUSDC} USDC</span>
                          <span>→</span>
                          <span className="font-mono text-emerald-400">{tx.amountINR} INR</span>
                          <span>•</span>
                          <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                          {tx.corridor && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">{tx.corridor}</Badge>
                            </>
                          )}
                        </div>
                        {tx.txHash && (
                          <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
                            {tx.txHash}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {tx.receiptId && (
                        <Link href={`/app/receipt/${tx.receiptId}`}>
                          <Button size="sm" variant="outline">
                            View Receipt
                          </Button>
                        </Link>
                      )}
                      {tx.txHash && (
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}