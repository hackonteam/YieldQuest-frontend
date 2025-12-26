import { useAccount, useReadContract } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CONTRACTS, BADGE_NFT_ABI } from '@/lib/wagmi-config';
import { Award, Lock, Shield, Zap, Crown, Gem } from 'lucide-react';

// Badge definitions (locked badges shown for motivation)
const BADGE_TYPES = [
  { id: 1, name: 'First Deposit', icon: Shield, description: 'Made your first deposit' },
  { id: 2, name: 'Yield Hunter', icon: Zap, description: 'Earned 100 XP from yield' },
  { id: 3, name: 'Diamond Hands', icon: Gem, description: 'Held for 30 days' },
  { id: 4, name: 'Whale', icon: Crown, description: 'Deposited 1000+ tokens' },
  { id: 5, name: 'Early Adopter', icon: Award, description: 'Joined during launch' },
];

export function BadgePanel() {
  const { address, isConnected } = useAccount();

  // Read badge balance
  const { data: badgeBalance } = useReadContract({
    address: CONTRACTS.BADGE_NFT,
    abi: BADGE_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // For demo purposes, we'll show which badges are unlocked based on balance
  // In production, you'd query each tokenId owned
  const unlockedCount = badgeBalance ? Number(badgeBalance) : 0;

  if (!isConnected) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <CardDescription>Connect wallet to view badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Connect wallet to view badges
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Achievements
        </CardTitle>
        <CardDescription>
          {unlockedCount} / {BADGE_TYPES.length} badges earned (Soulbound NFTs)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGE_TYPES.map((badge, index) => {
            const isUnlocked = index < unlockedCount;
            const IconComponent = badge.icon;

            return (
              <div
                key={badge.id}
                className={`relative flex flex-col items-center rounded-lg border p-4 transition-all ${
                  isUnlocked
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30 opacity-60'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    isUnlocked
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isUnlocked ? (
                    <IconComponent className="h-6 w-6" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium text-center ${
                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {badge.name}
                </span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {badge.description}
                </span>
                {isUnlocked && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
