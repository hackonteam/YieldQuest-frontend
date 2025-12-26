import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Sparkles, Zap, Clock, TrendingUp, Play, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONTRACTS, QUEST_VAULT_ABI } from '@/lib/wagmi-config';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface HeroSectionProps {
  onConnectClick?: () => void;
}

type QuestStatus = 'not_connected' | 'idle' | 'active';

export function HeroSection({ onConnectClick }: HeroSectionProps) {
  const { address, isConnected } = useAccount();

  // Read user's vault shares to determine quest status
  const { data: vaultShares } = useReadContract({
    address: CONTRACTS.QUEST_VAULT,
    abi: QUEST_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read claimable XP
  const { data: claimableXP } = useReadContract({
    address: CONTRACTS.QUEST_VAULT,
    abi: QUEST_VAULT_ABI,
    functionName: 'claimableXP',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const getQuestStatus = (): QuestStatus => {
    if (!isConnected) return 'not_connected';
    if (!vaultShares || vaultShares === 0n) return 'idle';
    return 'active';
  };

  const status = getQuestStatus();
  const claimableXPValue = claimableXP ? parseFloat(formatUnits(claimableXP, 18)) : 0;
  const animatedXP = useAnimatedNumber(claimableXPValue, { duration: 600, decimals: 4 });

  const statusConfig = {
    not_connected: {
      title: 'Begin Your First Quest',
      subtitle: 'Deposit tokens, earn real yield, and turn patience into on-chain reputation.',
      badge: null,
      cta: 'Connect Wallet',
      ctaIcon: Wallet,
    },
    idle: {
      title: 'Your Quest Awaits',
      subtitle: 'Start your quest by depositing assets into the vault.',
      badge: { text: 'Quest Status: Idle', variant: 'idle' as const },
      cta: 'Start Quest',
      ctaIcon: Play,
    },
    active: {
      title: 'Quest Active · Yield Accruing',
      subtitle: 'Time and yield are being converted into XP. Patience is power.',
      badge: { text: 'Quest Status: Active', variant: 'active' as const },
      cta: null,
      ctaIcon: null,
    },
  };

  const config = statusConfig[status];

  const scrollToVault = () => {
    document.getElementById('quest-vault')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 mb-8 transition-all duration-500 ${
      status === 'active' 
        ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-accent/5 border-primary/40 shadow-lg shadow-primary/10' 
        : 'bg-gradient-to-br from-primary/10 via-transparent to-transparent border-border/50'
    }`}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Animated glow for active state */}
      {status === 'active' && (
        <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
      )}
      
      <div className="relative animate-fade-in">
        {/* Status Badge */}
        {config.badge && (
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border transition-all duration-500 ${
            config.badge.variant === 'active'
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            <span className={`h-2 w-2 rounded-full transition-all duration-300 ${
              config.badge.variant === 'active' ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
            }`} />
            {config.badge.text}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          {config.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-6">
          {config.subtitle}
        </p>
        
        {/* Active Quest Stats - Animated Numbers */}
        {status === 'active' && (
          <div className="flex flex-wrap gap-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3 rounded-lg bg-card/80 px-4 py-3 border border-border/50 backdrop-blur-sm">
              <Clock className="h-5 w-5 text-primary animate-pulse" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-foreground">Yield Accruing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-card/80 px-4 py-3 border border-border/50 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-semibold text-foreground">Active</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border backdrop-blur-sm transition-all duration-300 ${
              claimableXPValue > 0 
                ? 'bg-primary/15 border-primary/30' 
                : 'bg-card/80 border-border/50'
            }`}>
              <Sparkles className={`h-5 w-5 ${claimableXPValue > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">XP Available</p>
                <p className={`text-sm font-bold font-mono tabular-nums transition-transform duration-300 ${
                  claimableXPValue > 0 ? 'text-primary' : 'text-foreground'
                } ${animatedXP.isAnimating ? 'scale-105' : 'scale-100'}`}>
                  {animatedXP.formattedValue}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Pills (for not connected / idle) */}
        {status !== 'active' && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-2 border border-border/50">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Real Yield</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-2 border border-border/50">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">XP from Earnings</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-2 border border-border/50">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Level Up</span>
            </div>
          </div>
        )}

        {/* CTA Button */}
        {config.cta && (
          <Button 
            onClick={status === 'not_connected' ? onConnectClick : scrollToVault}
            size="lg"
            className="gap-2 text-base"
          >
            {config.ctaIcon && <config.ctaIcon className="h-5 w-5" />}
            {config.cta}
          </Button>
        )}
      </div>
    </div>
  );
}
