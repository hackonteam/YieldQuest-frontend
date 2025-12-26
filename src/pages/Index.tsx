import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { VaultPanel } from '@/components/VaultPanel';
import { ProgressPanel } from '@/components/ProgressPanel';
import { BadgePanel } from '@/components/BadgePanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <HeroSection />
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Vault Panel - Main action area */}
          <div className="lg:col-span-2">
            <VaultPanel />
          </div>
          
          {/* Progress Panel - Game stats */}
          <div className="lg:col-span-1">
            <ProgressPanel />
          </div>
        </div>
        
        {/* Badge Panel - Full width */}
        <div className="mt-6">
          <BadgePanel />
        </div>
        
        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>YieldQuest — GameFi × DeFi on Mantle Sepolia</p>
          <p className="mt-1">Real yield. Real progression. No fake rewards.</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
