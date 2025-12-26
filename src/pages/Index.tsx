import { useConnect } from 'wagmi';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { VaultPanel } from '@/components/VaultPanel';
import { ProgressPanel } from '@/components/ProgressPanel';
import { BadgePanel } from '@/components/BadgePanel';

const Index = () => {
  const { connect, connectors } = useConnect();

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <HeroSection onConnectClick={handleConnect} />
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quest Vault - Main action area */}
          <div className="lg:col-span-2">
            <VaultPanel />
          </div>
          
          {/* Progress Panel - Level is the hero */}
          <div className="lg:col-span-1">
            <ProgressPanel />
          </div>
        </div>
        
        {/* Achievement Panel */}
        <div className="mt-6">
          <BadgePanel />
        </div>
        
        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            YieldQuest — An on-chain progression game powered by real DeFi yield
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mantle Sepolia · Real yield. Real progression. No fake rewards.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
