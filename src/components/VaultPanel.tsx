import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTRACTS, QUEST_VAULT_ABI, ERC20_ABI } from '@/lib/wagmi-config';
import { Swords, Play, Sparkles, Loader2, CheckCircle2, Circle, ArrowDownToLine, ArrowUpFromLine, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

type QuestStatus = 'idle' | 'active' | 'completed';

export function VaultPanel() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Read user's token balance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: CONTRACTS.UNDERLYING_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read user's vault shares
  const { data: vaultShares, refetch: refetchShares } = useReadContract({
    address: CONTRACTS.QUEST_VAULT,
    abi: QUEST_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read total vault assets
  const { data: totalAssets } = useReadContract({
    address: CONTRACTS.QUEST_VAULT,
    abi: QUEST_VAULT_ABI,
    functionName: 'totalAssets',
  });

  // Read claimable XP
  const { data: claimableXP, refetch: refetchClaimable } = useReadContract({
    address: CONTRACTS.QUEST_VAULT,
    abi: QUEST_VAULT_ABI,
    functionName: 'claimableXP',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.UNDERLYING_TOKEN,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.QUEST_VAULT] : undefined,
    query: { enabled: !!address },
  });

  // Convert shares to assets
  const { data: depositedAssets } = useReadContract({
    address: CONTRACTS.QUEST_VAULT,
    abi: QUEST_VAULT_ABI,
    functionName: 'convertToAssets',
    args: vaultShares ? [vaultShares] : undefined,
    query: { enabled: !!vaultShares && vaultShares > 0n },
  });

  const { writeContractAsync } = useWriteContract();

  // Calculate raw values
  const depositedValue = depositedAssets ? parseFloat(formatUnits(depositedAssets, 18)) : 0;
  const claimableXPValue = claimableXP ? parseFloat(formatUnits(claimableXP, 18)) : 0;
  const tvlValue = totalAssets ? parseFloat(formatUnits(totalAssets, 18)) : 0;

  // Animated numbers
  const animatedDeposit = useAnimatedNumber(depositedValue, { duration: 600, decimals: 4 });
  const animatedXP = useAnimatedNumber(claimableXPValue, { duration: 600, decimals: 4 });
  const animatedTVL = useAnimatedNumber(tvlValue, { duration: 600, decimals: 2 });

  const getQuestStatus = (): QuestStatus => {
    if (justCompleted) return 'completed';
    if (!vaultShares || vaultShares === 0n) return 'idle';
    return 'active';
  };

  const questStatus = getQuestStatus();

  // Clear completed state after animation
  useEffect(() => {
    if (justCompleted) {
      const timer = setTimeout(() => setJustCompleted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justCompleted]);

  const refetchAll = () => {
    refetchTokenBalance();
    refetchShares();
    refetchClaimable();
    refetchAllowance();
  };

  const handleDeposit = async () => {
    if (!address || !depositAmount) return;
    setIsLoading(true);
    
    try {
      const amount = parseUnits(depositAmount, 18);

      if (!allowance || allowance < amount) {
        toast.info('Approving tokens...');
        await writeContractAsync({
          address: CONTRACTS.UNDERLYING_TOKEN,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.QUEST_VAULT, amount],
        } as any);
        toast.success('Approval successful!');
        await refetchAllowance();
      }

      toast.info('Starting Quest...');
      await writeContractAsync({
        address: CONTRACTS.QUEST_VAULT,
        abi: QUEST_VAULT_ABI,
        functionName: 'deposit',
        args: [amount, address],
      } as any);
      
      toast.success('Quest Started! Yield is now accruing.');
      setDepositAmount('');
      refetchAll();
    } catch (e: any) {
      toast.error(`Transaction failed: ${e.message?.slice(0, 100) || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount) return;
    setIsLoading(true);
    
    try {
      const amount = parseUnits(withdrawAmount, 18);
      
      toast.info('Completing Quest...');
      await writeContractAsync({
        address: CONTRACTS.QUEST_VAULT,
        abi: QUEST_VAULT_ABI,
        functionName: 'withdraw',
        args: [amount, address, address],
      } as any);
      
      setJustCompleted(true);
      toast.success('Quest Completed! XP secured.');
      setWithdrawAmount('');
      refetchAll();
    } catch (e: any) {
      toast.error(`Withdrawal failed: ${e.message?.slice(0, 100) || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimXP = async () => {
    if (!address) return;
    setIsLoading(true);
    
    try {
      toast.info('Claiming XP...');
      await writeContractAsync({
        address: CONTRACTS.QUEST_VAULT,
        abi: QUEST_VAULT_ABI,
        functionName: 'claimXP',
      } as any);
      
      toast.success('XP Claimed! Check your progress.');
      refetchAll();
    } catch (e: any) {
      toast.error(`Claim failed: ${e.message?.slice(0, 100) || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: QuestStatus }) => {
    const config = {
      idle: { 
        icon: Circle, 
        text: 'Idle', 
        className: 'bg-muted text-muted-foreground border-border',
        pulse: false 
      },
      active: { 
        icon: Play, 
        text: 'Active · Yield Accruing', 
        className: 'bg-primary/20 text-primary border-primary/30',
        pulse: true 
      },
      completed: { 
        icon: CheckCircle2, 
        text: 'Completed', 
        className: 'bg-accent text-accent-foreground border-accent/30',
        pulse: false 
      },
    };
    const { icon: Icon, text, className, pulse } = config[status];
    
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-500 ${className}`}>
        <span className={`h-2 w-2 rounded-full ${
          status === 'active' ? 'bg-primary' : 
          status === 'completed' ? 'bg-accent-foreground' : 'bg-muted-foreground'
        } ${pulse ? 'animate-pulse' : ''}`} />
        <Icon className="h-3 w-3" />
        {text}
      </div>
    );
  };

  // Animated Number Display Component
  const AnimatedStat = ({ 
    label, 
    value, 
    suffix = '', 
    isAnimating,
    highlight = false 
  }: { 
    label: string; 
    value: string; 
    suffix?: string;
    isAnimating: boolean;
    highlight?: boolean;
  }) => (
    <div className={`rounded-xl p-4 text-center transition-all duration-300 ${
      highlight 
        ? 'bg-primary/10 border-2 border-primary/30' 
        : 'bg-card border border-border'
    }`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono tabular-nums transition-transform duration-300 ${
        highlight ? 'text-primary' : 'text-foreground'
      } ${isAnimating ? 'scale-105' : 'scale-100'}`}>
        {value}
      </p>
      {suffix && <p className="text-xs text-muted-foreground">{suffix}</p>}
    </div>
  );

  if (!isConnected) {
    return (
      <Card id="quest-vault" className="border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Yield Quest · Vault Mission
            </CardTitle>
            <StatusBadge status="idle" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Swords className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Quest Awaits</p>
            <p className="text-sm text-muted-foreground">Connect wallet to begin your journey</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="quest-vault" className={`relative overflow-hidden transition-all duration-500 ${
      questStatus === 'active' 
        ? 'border-primary/40 shadow-lg shadow-primary/10' 
        : questStatus === 'completed'
        ? 'border-accent/40 shadow-lg shadow-accent/10'
        : 'border-border/50'
    }`}>
      {/* Background gradient based on state */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
        questStatus === 'active' 
          ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-100' 
          : questStatus === 'completed'
          ? 'bg-gradient-to-br from-accent/10 via-accent/5 to-transparent opacity-100'
          : 'opacity-0'
      }`} />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Swords className={`h-5 w-5 text-primary transition-all duration-300 ${
              questStatus === 'active' ? 'animate-pulse' : ''
            }`} />
            Yield Quest · Vault Mission
          </CardTitle>
          <StatusBadge status={questStatus} />
        </div>
        
        {/* Quest completion message */}
        {questStatus === 'completed' && (
          <p className="text-sm text-accent-foreground font-medium mt-2 animate-fade-in">
            Quest completed · XP secured
          </p>
        )}
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Quest Stats - Large & Animated */}
        <div className="grid grid-cols-3 gap-3">
          <AnimatedStat 
            label="Deposited" 
            value={animatedDeposit.formattedValue} 
            suffix="tokens"
            isAnimating={animatedDeposit.isAnimating}
          />
          <AnimatedStat 
            label="Vault TVL" 
            value={animatedTVL.formattedValue} 
            suffix="total locked"
            isAnimating={animatedTVL.isAnimating}
          />
          <AnimatedStat 
            label="XP Available" 
            value={animatedXP.formattedValue} 
            suffix="claimable"
            isAnimating={animatedXP.isAnimating}
            highlight={claimableXPValue > 0}
          />
        </div>

        {/* Active Quest Stats */}
        {questStatus === 'active' && (
          <div className="flex flex-wrap gap-3 animate-fade-in">
            <div className="flex items-center gap-2 rounded-lg bg-card/80 px-3 py-2 border border-border">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium text-foreground">Yield Accruing</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-card/80 px-3 py-2 border border-border">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-medium text-foreground">Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Claim XP Button - Prominent when available */}
        {claimableXPValue > 0 && (
          <div className="animate-fade-in">
            <Button
              onClick={handleClaimXP}
              disabled={isLoading}
              className="w-full gap-2 h-12 text-base relative overflow-hidden group"
              size="lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              Claim {animatedXP.formattedValue} XP
            </Button>
          </div>
        )}

        {/* Quest Actions */}
        <Tabs defaultValue={questStatus === 'idle' ? 'start' : 'manage'} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="start" className="flex-1 gap-2">
              <Play className="h-4 w-4" /> Start Quest
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex-1 gap-2">
              <ArrowUpFromLine className="h-4 w-4" /> Complete Quest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quest Resources</span>
                <span className="text-muted-foreground font-mono">
                  Available: {tokenBalance ? parseFloat(formatUnits(tokenBalance, 18)).toFixed(4) : '0'}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={() => tokenBalance && setDepositAmount(formatUnits(tokenBalance, 18))}
                >
                  Max
                </Button>
              </div>
            </div>
            <Button onClick={handleDeposit} disabled={!depositAmount || isLoading} className="w-full gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4" />
                  {questStatus === 'idle' ? 'Start Quest' : 'Add to Quest'}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Withdraw Amount</span>
                <span className="text-muted-foreground font-mono">
                  Deposited: {depositedValue.toFixed(4)}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={() => depositedAssets && setWithdrawAmount(formatUnits(depositedAssets, 18))}
                >
                  Max
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleWithdraw} 
              disabled={!withdrawAmount || isLoading} 
              variant="secondary"
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="h-4 w-4" />
                  Complete Quest
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Microcopy */}
        <p className="text-xs text-muted-foreground text-center italic">
          Time is your most valuable resource. Keep questing.
        </p>
      </CardContent>
    </Card>
  );
}
