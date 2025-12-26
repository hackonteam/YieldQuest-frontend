import { Sparkles, TrendingUp, Shield } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8 mb-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="relative">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Your DeFi Adventure Awaits
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-6">
          Deposit tokens, earn real yield, and level up your on-chain reputation.
          No fake rewards — just real progression from genuine DeFi earnings.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-2 border border-border/50">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Real Yield</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-2 border border-border/50">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">XP from Earnings</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-2 border border-border/50">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Soulbound Badges</span>
          </div>
        </div>
      </div>
    </div>
  );
}
