'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Wallet, Phone, Globe, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SendPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState('amount'); // amount, quote, send, processing, success
  const [receiverType, setReceiverType] = useState('ADDRESS');
  const [amount, setAmount] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [ensName, setEnsName] = useState('');
  const [quote, setQuote] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [intentId, setIntentId] = useState(null);
  const [receiptId, setReceiptId] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (quote && step === 'quote') {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            toast.error('Quote expired! Please get a new quote.');
            setStep('amount');
            setQuote(null);
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quote, step]);

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/remit/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSDC: amount, corridor: 'USDC-INR' })
      });

      if (res.ok) {
        const data = await res.json();
        setQuote(data);
        setTimeRemaining(90);
        setStep('quote');
        toast.success('Quote received! Valid for 90 seconds');
      } else {
        toast.error('Failed to get quote');
      }
    } catch (error) {
      console.error('Quote error:', error);
      toast.error('Error getting quote');
    } finally {
      setLoading(false);
    }
  };

  const createIntent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/remit/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverType,
          receiverAddress: receiverType === 'ADDRESS' ? receiverAddress : undefined,
          receiverPhone: receiverType === 'PHONE' ? receiverPhone : undefined,
          ensName: receiverType === 'ENS' ? ensName : undefined,
          corridor: 'USDC-INR',
          amountUSDC: amount,
          feeUSDC: quote.feeUSDC
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIntentId(data.intentId);
        setStep('send');
        toast.success('Intent created! Proceed to send');
      } else {
        toast.error('Failed to create intent');
      }
    } catch (error) {
      console.error('Intent error:', error);
      toast.error('Error creating intent');
    } finally {
      setLoading(false);
    }
  };

  const simulateTransaction = async () => {
    if (!intentId) return;

    setStep('processing');
    setLoading(true);

    // Simulate wallet transaction
    const fakeTxHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

    try {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await fetch('/api/remit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId,
          txHash: fakeTxHash,
          senderAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReceiptId(data.receiptId);
        setStep('success');
        toast.success('Remittance successful!');
      } else {
        toast.error('Transaction confirmation failed');
        setStep('quote');
      }
    } catch (error) {
      console.error('Confirm error:', error);
      toast.error('Error confirming transaction');
      setStep('quote');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Send Money</h1>
          <p className="text-muted-foreground">Send USDC across borders with low fees</p>
        </div>

        {step === 'amount' && (
          <Card>
            <CardHeader>
              <CardTitle>Recipient & Amount</CardTitle>
              <CardDescription>Choose how to send and enter amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={receiverType} onValueChange={setReceiverType}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ADDRESS">
                    <Wallet className="h-4 w-4 mr-2" />
                    Wallet
                  </TabsTrigger>
                  <TabsTrigger value="PHONE">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </TabsTrigger>
                  <TabsTrigger value="ENS">
                    <Globe className="h-4 w-4 mr-2" />
                    ENS
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="ADDRESS" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Receiver Wallet Address</Label>
                    <Input
                      placeholder="0x..."
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="PHONE" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Receiver Phone Number</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Linked wallet will receive USDC</p>
                  </div>
                </TabsContent>
                <TabsContent value="ENS" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>ENS Name</Label>
                    <Input
                      placeholder="vitalik.eth"
                      value={ensName}
                      onChange={(e) => setEnsName(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Amount (USDC)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={getQuote} disabled={loading}>
                {loading ? 'Getting Quote...' : 'Get Quote'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'quote' && quote && (
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
              <CardDescription>
                Rate locked for {timeRemaining} seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Clock className="h-16 w-16 text-indigo-400" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{timeRemaining}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-bold">{quote.amountUSDC} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee (0.25%)</span>
                  <span className="font-mono">{quote.feeUSDC} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono font-bold">{quote.totalUSDC} USDC</span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="font-mono">1 USDC = {quote.fx} INR</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Recipient gets</span>
                    <span className="font-mono text-emerald-400 font-bold">{quote.netINR} INR</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('amount')}>
                  Back
                </Button>
                <Button className="flex-1" onClick={createIntent} disabled={loading}>
                  {loading ? 'Creating...' : 'Continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'send' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm & Send</CardTitle>
              <CardDescription>Simulated transaction in sandbox mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-400">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  In sandbox mode, this simulates a blockchain transaction
                </p>
              </div>

              <Button className="w-full" size="lg" onClick={simulateTransaction} disabled={loading}>
                {loading ? 'Sending...' : 'Send Remittance'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'processing' && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="animate-spin text-6xl">⚡</div>
              <h3 className="text-xl font-bold">Processing Transaction...</h3>
              <p className="text-muted-foreground">Please wait while we confirm on-chain</p>
            </CardContent>
          </Card>
        )}

        {step === 'success' && receiptId && (
          <Card className="border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-emerald-400">✓ Remittance Successful!</CardTitle>
              <CardDescription>Your money is on its way</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-emerald-500/10 rounded-lg">
                <p className="text-sm">
                  <strong>Receipt ID:</strong> {receiptId}
                </p>
                <p className="text-sm mt-2">
                  <strong>Amount:</strong> {amount} USDC → {quote?.netINR} INR
                </p>
              </div>

              <div className="flex gap-2">
                <Link href={`/app/receipt/${receiptId}`} className="flex-1">
                  <Button className="w-full">View Receipt</Button>
                </Link>
                <Button variant="outline" onClick={() => {
                  setStep('amount');
                  setAmount('');
                  setQuote(null);
                  setIntentId(null);
                  setReceiptId(null);
                }}>
                  Send Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
