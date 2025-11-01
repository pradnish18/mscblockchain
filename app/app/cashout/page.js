'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CashoutPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState('form'); // form, processing, complete
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAcct, setBankAcct] = useState('');
  const [cashoutRef, setCashoutRef] = useState(null);
  const [cashoutData, setCashoutData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (cashoutRef && step === 'processing') {
      const interval = setInterval(() => {
        fetchCashoutStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [cashoutRef, step]);

  const fetchCashoutStatus = async () => {
    if (!cashoutRef) return;

    try {
      const res = await fetch(`/api/cashout/${cashoutRef}/status`);
      if (res.ok) {
        const data = await res.json();
        setCashoutData(data);
        
        if (data.status === 'PAID' || data.status === 'FAILED') {
          setStep('complete');
        }
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // For demo, we'll create a fake remit intent first
    try {
      // In real app, user would select an existing remittance
      // For demo, just simulate
      const demoRemitId = '00000000-0000-0000-0000-000000000000';
      
      const res = await fetch('/api/cashout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remitId: demoRemitId,
          method,
          upiId: method === 'upi' ? upiId : undefined,
          bankAcct: method === 'bank' ? bankAcct : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCashoutRef(data.ref);
        setStep('processing');
        toast.success('Cash-out initiated!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to initiate cash-out');
      }
    } catch (error) {
      console.error('Cash-out error:', error);
      toast.error('Failed to initiate cash-out');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
          <h1 className="text-3xl font-bold mb-2">Cash Out</h1>
          <p className="text-muted-foreground">Withdraw funds to UPI or Bank Account</p>
        </div>

        {step === 'form' && (
          <Card>
            <CardHeader>
              <CardTitle>Cash-Out Method</CardTitle>
              <CardDescription>Choose how you want to receive funds</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <RadioGroup value={method} onValueChange={setMethod}>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer">
                      <div className="font-medium">UPI</div>
                      <div className="text-sm text-muted-foreground">Instant transfer to UPI ID</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">Transfer to bank account</div>
                    </Label>
                  </div>
                </RadioGroup>

                {method === 'upi' && (
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Enter your UPI ID for instant transfer</p>
                  </div>
                )}

                {method === 'bank' && (
                  <div className="space-y-2">
                    <Label>Bank Account Number</Label>
                    <Input
                      placeholder="1234567890"
                      value={bankAcct}
                      onChange={(e) => setBankAcct(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Enter your bank account number</p>
                  </div>
                )}

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400">
                    💡 Demo Mode: This simulates the cash-out process. In production, funds would be transferred to your account.
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Initiating...' : 'Initiate Cash-Out'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'processing' && cashoutData && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Cash-Out</CardTitle>
              <CardDescription>Reference: {cashoutRef}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin text-6xl">⚡</div>
                </div>

                <div className="space-y-3">
                  {cashoutData.events.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1">
                        {event.status === 'QUEUED' && <Clock className="h-5 w-5 text-amber-400" />}
                        {event.status === 'PROCESSING' && <div className="animate-spin">⚡</div>}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.status.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">{event.note}</div>
                        <div className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  Please wait while we process your cash-out...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && cashoutData && (
          <Card className={cashoutData.status === 'PAID' ? 'border-emerald-500/20' : 'border-red-500/20'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {cashoutData.status === 'PAID' ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                    Cash-Out Successful!
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-400" />
                    Cash-Out Failed
                  </>
                )}
              </CardTitle>
              <CardDescription>Reference: {cashoutRef}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium uppercase">{cashoutData.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono font-bold">{cashoutData.remittance.amountINR} INR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={cashoutData.status === 'PAID' ? 'default' : 'destructive'}>
                      {cashoutData.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">Timeline:</div>
                  {cashoutData.events.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5"></div>
                      <div className="flex-1">
                        <div>{event.status.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setStep('form');
                    setCashoutRef(null);
                    setCashoutData(null);
                    setUpiId('');
                    setBankAcct('');
                  }}>
                    New Cash-Out
                  </Button>
                  <Link href="/app" className="flex-1">
                    <Button className="w-full">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}