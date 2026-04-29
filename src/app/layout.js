import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Web3Provider } from '@/components/providers/Web3Provider';
import { SupabaseAuthProvider } from '@/components/providers/SupabaseAuthProvider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'RemitChain - Decentralized Remittance Platform',
  description: 'Send money across borders using stablecoins with low fees and instant settlement',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RemitChain'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseAuthProvider>
            <Web3Provider>
              {children}
              <Toaster richColors position="top-right" />
            </Web3Provider>
          </SupabaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}