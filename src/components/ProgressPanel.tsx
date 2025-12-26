import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CONTRACTS, XP_MANAGER_ABI } from '@/lib/wagmi-config';
import { Trophy, Star, Zap, Target } from 'lucide-react';

export function ProgressPanel() {
  const { address, isConnected } = useAccount();

  const { data: userXP } = useReadContract({
    address: CONTRACTS.XP_MANAGER,
    abi: XP_MANAGER_ABI,
    functionName: 'getXP',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: userLevel } = useReadContract({
    address: CONTRACTS.XP_MANAGER,
    abi: XP_MANAGER_ABI,
    functionName: 'getLevel',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: currentLevelXP } = useReadContract({
    address: CONTRACTS.XP_MANAGER,
    abi: XP_MANAGER_ABI,
    functionName: 'xpRequiredForLevel',
    args: userLevel ? [userLevel] : undefined,
    query: { enabled: !!userLevel },
  });

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
    if (level === 0) return 'Initiate';
    if (level < 5) return 'Novice';
    if (level < 10) return 'Apprentice';
    if (level < 20) return 'Journeyman';
    if (level < 35) return 'Expert';
    if (level < 50) return 'Master';
    return 'Grandmaster';
  };

  const level = userLevel ? Number(userLevel) : 0;
  const xpValue = userXP ? parseFloat(formatUnits(userXP, 18)) : 0;
  const nextXP = nextLevelXP ? parseFloat(formatUnits(nextLevelXP, 18)) : 100;
  const currentXP = currentLevelXP ? parseFloat(formatUnits(currentLevelXP, 18)) : 0;
  const xpToNext = nextXP - xpValue;
  const progressPercent = calculateProgress();

  if (!isConnected) {
    return (
      <Card className="border-border/50 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted border-4 border-border">
              <span className="text-3xl font-bold text-muted-foreground">?</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Connect wallet to track progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 h-full relative overflow-hidden">
      {/* Subtle background glow for leveled players */}
      {level > 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      )}
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Your Progress
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Level Badge - THE HERO */}
        <div className="flex flex-col items-center">
          <div className="relative animate-scale-in">
            {/* Outer ring with glow */}
            <div className={`flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 shadow-xl ${
              level > 0 ? 'animate-pulse-glow' : ''
            }`}>
              {/* Inner circle */}
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-card border-4 border-background">
                <span className="text-5xl font-bold text-primary animate-number-pop">{level}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Level
                </span>
              </div>
            </div>
            
            {/* Title badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-md whitespace-nowrap">
                {getLevelTitle(level)}
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar - THICK & PROMINENT */}
        <div className="space-y-3 pt-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">XP Progress</span>
            </div>
            <span className="font-bold text-primary">{progressPercent.toFixed(1)}%</span>
          </div>
          
          <div className="relative">
            <Progress value={progressPercent} className="h-4 bg-muted" />
            {/* Progress indicator dot */}
            {progressPercent > 0 && progressPercent < 100 && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary border-2 border-background shadow-md transition-all duration-500"
                style={{ left: `calc(${progressPercent}% - 12px)` }}
              />
            )}
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
        </div>

        {/* XP Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground">{xpValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground">{xpToNext.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">XP to Next</p>
          </div>
        </div>

        {/* Motivational Quote */}
        <p className="text-xs text-muted-foreground text-center italic pt-2">
          "Consistency beats speed. Keep questing."
        </p>
      </CardContent>
    </Card>
  );
}
