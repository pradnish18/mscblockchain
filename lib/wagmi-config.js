import { http, createConfig } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = 'demo-remitchain-project-id';

export const config = createConfig({
  chains: [polygonAmoy],
  connectors: [
    injected(),
    walletConnect({ projectId })
  ],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_CHAIN_RPC || 'https://rpc-amoy.polygon.technology')
  }
});

export { polygonAmoy };