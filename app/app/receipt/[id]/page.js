'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Download, Share2, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchReceipt();
    }
  }, [params.id]);

  const fetchReceipt = async () => {
    try {
      const res = await fetch(`/api/remit/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setReceipt(data);
      } else {
        toast.error('Receipt not found');
        router.push('/app');
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    window.open(`/api/remit/${params.id}/pdf`, '_blank');
    toast.success('Opening receipt PDF');
  };

  const copyShareLink = () => {
    if (receipt?.shareToken) {
      const shareUrl = `${window.location.origin}/app/receipt/${params.id}?shareToken=${receipt.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">⚡</div>
          <p className="text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Receipt not found</p>
            <Link href="/app">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventData = JSON.parse(receipt.rawEventJson);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              🧪 Sandbox Mode
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              💾 Available Offline
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Remittance Receipt</h1>
          <p className="text-muted-foreground">Transaction completed successfully</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt ID</p>
                <p className="font-mono text-sm">{receipt.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On-Chain ID</p>
                <p className="font-mono text-sm">{receipt.remitId.slice(0, 16)}...</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaction Hash</p>
                <p className="font-mono text-sm">{receipt.txHash.slice(0, 16)}...</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="text-sm">{new Date(receipt.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Amount Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount Sent</span>
              <span className="font-mono font-bold text-lg">{receipt.amountUSDC} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transaction Fee</span>
              <span className="font-mono">{receipt.feeUSDC} USDC</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-mono">1 USDC = {receipt.fxAtSettlement} INR</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">Recipient Receives (Est.)</span>
                <span className="font-mono text-emerald-400 font-bold text-xl">{receipt.amountINREstimate} INR</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sender</p>
              <p className="font-mono text-sm bg-muted/50 p-2 rounded">{receipt.senderId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Receiver</p>
              <p className="font-mono text-sm bg-muted/50 p-2 rounded">{receipt.receiverAddress}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Corridor</p>
              <Badge>{receipt.corridor}</Badge>
            </div>
          </CardContent>
        </Card>

        {receipt.flags && receipt.flags.length > 0 && (
          <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Security Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {receipt.flags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded bg-background">
                  <Badge variant={flag.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                    {flag.severity}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{flag.rule.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{flag.note}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" onClick={downloadReceipt}>
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
          <Button className="flex-1" variant="outline" onClick={copyShareLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Receipt
          </Button>
          <Button variant="outline" asChild>
            <a href={`https://amoy.polygonscan.com/tx/${receipt.txHash}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </a>
          </Button>
        </div>

        <Card className="mt-6 bg-muted/30">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <p>This receipt is cryptographically signed and can be verified for authenticity.</p>
            <p className="mt-1">Share link expires on: {new Date(receipt.shareExpiresAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
