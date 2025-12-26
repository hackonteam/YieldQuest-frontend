import { useEffect, useState, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CONTRACTS, XP_MANAGER_ABI } from '@/lib/wagmi-config';
import { Trophy, Star, Zap, Target } from 'lucide-react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

export function ProgressPanel() {
  const { address, isConnected } = useAccount();
  const [levelJustChanged, setLevelJustChanged] = useState(false);
  const previousLevel = useRef<number>(0);

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

  const level = userLevel ? Number(userLevel) : 0;
  const xpValue = userXP ? parseFloat(formatUnits(userXP, 18)) : 0;
  const nextXP = nextLevelXP ? parseFloat(formatUnits(nextLevelXP, 18)) : 100;
  const currentXP = currentLevelXP ? parseFloat(formatUnits(currentLevelXP, 18)) : 0;
  const xpToNext = Math.max(nextXP - xpValue, 0);

  // Animated values
  const animatedXP = useAnimatedNumber(xpValue, { duration: 600, decimals: 2 });
  const animatedXPToNext = useAnimatedNumber(xpToNext, { duration: 600, decimals: 2 });

  const calculateProgress = () => {
    if (!userXP || !currentLevelXP || !nextLevelXP) return 0;
    const xp = Number(formatUnits(userXP, 18));
    const current = Number(formatUnits(currentLevelXP, 18));
    const next = Number(formatUnits(nextLevelXP, 18));
    
    if (next <= current) return 100;
    const progress = ((xp - current) / (next - current)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const progressPercent = calculateProgress();
  const animatedProgress = useAnimatedNumber(progressPercent, { duration: 800, decimals: 1 });

  // Detect level change
  useEffect(() => {
    if (level !== previousLevel.current && previousLevel.current !== 0) {
      setLevelJustChanged(true);
      const timer = setTimeout(() => setLevelJustChanged(false), 600);
      return () => clearTimeout(timer);
    }
    previousLevel.current = level;
  }, [level]);

  const getLevelTitle = (level: number) => {
    if (level === 0) return 'Initiate';
    if (level < 5) return 'Novice';
    if (level < 10) return 'Apprentice';
    if (level < 20) return 'Journeyman';
    if (level < 35) return 'Expert';
    if (level < 50) return 'Master';
    return 'Grandmaster';
  };

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
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted border-4 border-border">
              <span className="text-4xl font-bold text-muted-foreground">?</span>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Connect wallet to track progress</p>
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
        {/* Level Badge - THE HERO - LARGEST ELEMENT */}
        <div className="flex flex-col items-center">
          <div className={`relative transition-transform duration-300 ${
            levelJustChanged ? 'scale-110' : 'scale-100'
          }`}>
            {/* Outer glow ring */}
            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
              level > 0 ? 'bg-primary/20 blur-xl' : ''
            } ${levelJustChanged ? 'bg-primary/40 blur-2xl scale-125' : ''}`} />
            
            {/* Main level badge */}
            <div className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 shadow-xl transition-all duration-300 ${
              levelJustChanged ? 'shadow-2xl shadow-primary/50' : ''
            }`}>
              {/* Inner circle */}
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-card border-4 border-background">
                <span className={`text-6xl font-bold text-primary font-mono tabular-nums transition-transform duration-300 ${
                  levelJustChanged ? 'scale-110' : 'scale-100'
                }`}>
                  {level}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                  Level
                </span>
              </div>
            </div>
            
            {/* Title badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <span className={`rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg whitespace-nowrap transition-all duration-300 ${
                levelJustChanged ? 'scale-105 shadow-xl' : ''
              }`}>
                {getLevelTitle(level)}
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar - THICK & HIGH CONTRAST */}
        <div className="space-y-3 pt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">XP Progress</span>
            </div>
            <span className={`text-sm font-bold text-primary font-mono tabular-nums transition-transform duration-300 ${
              animatedProgress.isAnimating ? 'scale-105' : 'scale-100'
            }`}>
              {animatedProgress.formattedValue}%
            </span>
          </div>
          
          {/* Thick progress bar */}
          <div className="relative h-5 bg-muted rounded-full overflow-hidden border border-border">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${animatedProgress.value}%` }}
            />
            {/* Shimmer effect */}
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent rounded-full animate-pulse"
              style={{ width: `${animatedProgress.value}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
        </div>

        {/* XP to Next Level - DYNAMIC TEXT */}
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">XP to Next Level</span>
          </div>
          <p className={`text-3xl font-bold text-primary font-mono tabular-nums transition-transform duration-300 ${
            animatedXPToNext.isAnimating ? 'scale-105' : 'scale-100'
          }`}>
            {animatedXPToNext.formattedValue}
          </p>
        </div>

        {/* XP Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <p className={`text-xl font-bold text-foreground font-mono tabular-nums transition-transform duration-300 ${
              animatedXP.isAnimating ? 'scale-105' : 'scale-100'
            }`}>
              {animatedXP.formattedValue}
            </p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground font-mono tabular-nums">
              {nextXP.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Next Level At</p>
          </div>
        </div>

        {/* Microcopy */}
        <p className="text-xs text-muted-foreground text-center italic pt-2">
          Consistency beats speed.
        </p>
      </CardContent>
    </Card>
  );
}
