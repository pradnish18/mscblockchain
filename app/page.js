import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-background to-background">
      <nav className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">⛓️</div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              RemitChain
            </span>
          </div>
          <Link href="/app">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-cyan-600">
              Open App <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <span className="px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm border border-indigo-500/20 inline-block">
            🎉 Batch Remittance & Offline Receipts
          </span>
          
          <h1 className="text-5xl md:text-7xl font-bold">
            Send Money{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Instantly
            </span>
            {' '}Across Borders
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Decentralized remittance with stablecoins. Low fees, instant settlement.
          </p>
          
          <Link href="/app">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-lg px-8">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <div className="grid grid-cols-3 gap-8 pt-12">
            <div>
              <div className="text-3xl font-bold text-indigo-400">0.25%</div>
              <div className="text-sm text-muted-foreground">Fee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">2min</div>
              <div className="text-sm text-muted-foreground">Settlement</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 RemitChain. Polygon + USDC. Decentralized.</p>
        </div>
      </footer>
    </div>
  );
}