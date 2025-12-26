import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, ExternalLink } from 'lucide-react';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import { formatUnits } from 'viem';

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const isWrongNetwork = isConnected && chain?.id !== mantleSepoliaTestnet.id;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isPending}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm font-medium">
          Wrong Network - Switch to Mantle Sepolia
        </div>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const formattedBalance = balance 
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : '...';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 rounded-lg bg-card px-4 py-2 border border-border">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-foreground">
            {formatAddress(address!)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formattedBalance} {balance?.symbol || 'MNT'}
          </span>
        </div>
        <a
          href={`https://sepolia.mantlescan.xyz/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <Button variant="outline" size="icon" onClick={() => disconnect()}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
