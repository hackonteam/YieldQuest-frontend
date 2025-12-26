import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CONTRACTS, BADGE_NFT_ABI } from '@/lib/wagmi-config';
import { Award, Lock, Shield, Zap, Crown, Gem, Star } from 'lucide-react';

// Badge definitions with unlock conditions
const BADGE_TYPES = [
  { 
    id: 1, 
    name: 'First Deposit', 
    icon: Shield, 
    description: 'Journey begun',
    unlockCondition: 'Complete first deposit'
  },
  { 
    id: 2, 
    name: 'Yield Hunter', 
    icon: Zap, 
    description: 'Yield mastery',
    unlockCondition: 'Earn 100 XP from yield'
  },
  { 
    id: 3, 
    name: 'Diamond Hands', 
    icon: Gem, 
    description: 'Patience proven',
    unlockCondition: 'Hold for 30 days'
  },
  { 
    id: 4, 
    name: 'Whale', 
    icon: Crown, 
    description: 'Major player',
    unlockCondition: 'Deposit 1000+ tokens'
  },
  { 
    id: 5, 
    name: 'Level Master', 
    icon: Star, 
    description: 'Heights reached',
    unlockCondition: 'Reach Level 5'
  },
];

export function BadgePanel() {
  const { address, isConnected } = useAccount();
  const [newlyUnlocked, setNewlyUnlocked] = useState<number[]>([]);
  const previousBalance = useRef<number>(0);

  const { data: badgeBalance } = useReadContract({
    address: CONTRACTS.BADGE_NFT,
    abi: BADGE_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const unlockedCount = badgeBalance ? Number(badgeBalance) : 0;

  // Detect newly unlocked badges
  useEffect(() => {
    if (unlockedCount > previousBalance.current) {
      const newBadges: number[] = [];
      for (let i = previousBalance.current; i < unlockedCount; i++) {
        newBadges.push(i);
      }
      setNewlyUnlocked(newBadges);
      
      // Clear animation after delay
      const timer = setTimeout(() => setNewlyUnlocked([]), 800);
      return () => clearTimeout(timer);
    }
    previousBalance.current = unlockedCount;
  }, [unlockedCount]);

  if (!isConnected) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <CardDescription>Connect wallet to unlock badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {BADGE_TYPES.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center rounded-xl border border-border bg-muted/30 p-4 opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="mt-2 text-sm font-medium text-muted-foreground text-center">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Achievements
            </CardTitle>
            <CardDescription>Soulbound badges — permanent on-chain proof</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary font-mono">
              {unlockedCount} / {BADGE_TYPES.length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {BADGE_TYPES.map((badge, index) => {
            const isUnlocked = index < unlockedCount;
            const isNewlyUnlocked = newlyUnlocked.includes(index);
            const IconComponent = badge.icon;

            return (
              <div
                key={badge.id}
                className={`group relative flex flex-col items-center rounded-xl border p-4 transition-all duration-400 ${
                  isUnlocked
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-muted/20'
                } ${isNewlyUnlocked ? 'animate-scale-in' : ''}`}
              >
                {/* Unlocked glow effect */}
                {isUnlocked && (
                  <div className={`absolute inset-0 rounded-xl bg-primary/10 transition-opacity duration-300 ${
                    isNewlyUnlocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                  } pointer-events-none`} />
                )}

                {/* Unlocked checkmark */}
                {isUnlocked && (
                  <div className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md transition-transform duration-300 ${
                    isNewlyUnlocked ? 'scale-110' : 'scale-100'
                  }`}>
                    ✓
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-400 ${
                    isUnlocked
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground'
                  } ${isNewlyUnlocked ? 'scale-110 shadow-xl' : 'scale-100'}`}
                >
                  {isUnlocked ? (
                    <IconComponent className="h-7 w-7" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>

                {/* Badge Name */}
                <span
                  className={`relative mt-3 text-sm font-semibold text-center transition-colors duration-300 ${
                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {badge.name}
                </span>

                {/* Description / Unlock Condition */}
                <span className={`text-xs text-center mt-1 transition-colors duration-300 ${
                  isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/60'
                }`}>
                  {isUnlocked ? badge.description : badge.unlockCondition}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress hint */}
        {unlockedCount < BADGE_TYPES.length && (
          <p className="text-xs text-muted-foreground text-center mt-6 italic">
            Each badge is permanent proof of your on-chain journey.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
