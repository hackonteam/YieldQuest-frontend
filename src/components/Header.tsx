import { WalletConnect } from '@/components/WalletConnect';
import { Swords } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Swords className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">YieldQuest</span>
            <span className="text-xs text-muted-foreground">Mantle Sepolia</span>
          </div>
        </div>
        <WalletConnect />
      </div>
    </header>
  );
}
