import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CONTRACTS, XP_MANAGER_ABI } from '@/lib/wagmi-config';
import { Trophy, Star, TrendingUp } from 'lucide-react';

export function ProgressPanel() {
  const { address, isConnected } = useAccount();

  // Read user XP
  const { data: userXP } = useReadContract({
    address: CONTRACTS.XP_MANAGER,
    abi: XP_MANAGER_ABI,
    functionName: 'getXP',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read user level
  const { data: userLevel } = useReadContract({
    address: CONTRACTS.XP_MANAGER,
    abi: XP_MANAGER_ABI,
    functionName: 'getLevel',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read XP required for current level
  const { data: currentLevelXP } = useReadContract({
    address: CONTRACTS.XP_MANAGER,
    abi: XP_MANAGER_ABI,
    functionName: 'xpRequiredForLevel',
    args: userLevel ? [userLevel] : undefined,
    query: { enabled: !!userLevel },
  });

  // Read XP required for next level
  const { data: nextLevelXP } = useReadContract({
    address: CONTRACTS.XP_MANAGER,
    abi: XP_MANAGER_ABI,
    functionName: 'xpRequiredForLevel',
    args: userLevel ? [userLevel + 1n] : undefined,
    query: { enabled: !!userLevel },
  });

  const calculateProgress = () => {
    if (!userXP || !currentLevelXP || !nextLevelXP) return 0;
    const xp = Number(formatUnits(userXP, 18));
    const current = Number(formatUnits(currentLevelXP, 18));
    const next = Number(formatUnits(nextLevelXP, 18));
    
    if (next <= current) return 100;
    const progress = ((xp - current) / (next - current)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getLevelTitle = (level: number) => {
    if (level < 5) return 'Novice';
    if (level < 10) return 'Apprentice';
    if (level < 20) return 'Journeyman';
    if (level < 35) return 'Expert';
    if (level < 50) return 'Master';
    return 'Grandmaster';
  };

  if (!isConnected) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Progress
          </CardTitle>
          <CardDescription>Connect wallet to view progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Connect wallet to view progress
          </div>
        </CardContent>
      </Card>
    );
  }

  const level = userLevel ? Number(userLevel) : 0;
  const xpValue = userXP ? parseFloat(formatUnits(userXP, 18)) : 0;
  const nextXP = nextLevelXP ? parseFloat(formatUnits(nextLevelXP, 18)) : 0;

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Your Progress
        </CardTitle>
        <CardDescription>Level up by earning XP from yield</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Level Display */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card">
                <span className="text-4xl font-bold text-primary">{level}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Level
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {getLevelTitle(level)}
              </span>
            </div>
          </div>
        </div>

        {/* XP Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <Star className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">
              {xpValue.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">Total XP</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <TrendingUp className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">
              {nextXP.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">Next Level</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <span className="font-medium text-primary">{calculateProgress().toFixed(1)}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
