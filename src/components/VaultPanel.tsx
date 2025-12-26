import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTRACTS, QUEST_VAULT_ABI, ERC20_ABI } from '@/lib/wagmi-config';
import { Swords, Play, Sparkles, Loader2, CheckCircle2, Circle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { toast } from 'sonner';

type QuestStatus = 'idle' | 'active' | 'completed';

export function VaultPanel() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const getQuestStatus = (): QuestStatus => {
    if (!vaultShares || vaultShares === 0n) return 'idle';
    return 'active';
  };

  const questStatus = getQuestStatus();
  const depositedValue = depositedAssets ? parseFloat(formatUnits(depositedAssets, 18)) : 0;
  const claimableXPValue = claimableXP ? parseFloat(formatUnits(claimableXP, 18)) : 0;
  const tvlValue = totalAssets ? parseFloat(formatUnits(totalAssets, 18)) : 0;

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
      
      toast.success('Quest Completed! Assets withdrawn.');
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
      idle: { icon: Circle, text: 'Idle', className: 'bg-muted text-muted-foreground' },
      active: { icon: Play, text: 'Active', className: 'bg-primary/20 text-primary' },
      completed: { icon: CheckCircle2, text: 'Completed', className: 'bg-accent text-accent-foreground' },
    };
    const { icon: Icon, text, className } = config[status];
    
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}>
        <Icon className="h-3 w-3" />
        {text}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <Card id="quest-vault" className="border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
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
        ? 'border-primary/30 shadow-lg' 
        : 'border-border/50'
    }`}>
      {/* Active quest glow effect */}
      {questStatus === 'active' && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
      )}
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Yield Quest · Vault Mission
          </CardTitle>
          <StatusBadge status={questStatus} />
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Quest Stats - Large & Prominent */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deposited</p>
            <p className={`text-2xl font-bold text-foreground ${depositedValue > 0 ? 'animate-number-pop' : ''}`}>
              {depositedValue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">tokens</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Vault TVL</p>
            <p className="text-2xl font-bold text-foreground">{tvlValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">total locked</p>
          </div>
          <div className={`rounded-xl p-4 text-center transition-all duration-300 ${
            claimableXPValue > 0 
              ? 'bg-primary/10 border-2 border-primary/30' 
              : 'bg-card border border-border'
          }`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">XP Available</p>
            <p className={`text-2xl font-bold ${claimableXPValue > 0 ? 'text-primary' : 'text-foreground'}`}>
              {claimableXPValue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">claimable</p>
          </div>
        </div>

        {/* Claim XP Button - Prominent when available */}
        {claimableXPValue > 0 && (
          <div className="animate-fade-in">
            <Button
              onClick={handleClaimXP}
              disabled={isLoading}
              className="w-full gap-2 h-12 text-base animate-pulse-glow"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              Claim {claimableXPValue.toFixed(2)} XP
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
                <span className="text-muted-foreground">
                  Available: {tokenBalance ? parseFloat(formatUnits(tokenBalance, 18)).toFixed(4) : '0'}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
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
                <span className="text-muted-foreground">
                  Deposited: {depositedValue.toFixed(4)}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
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

        {/* Quest Tip */}
        <p className="text-xs text-muted-foreground text-center italic">
          Tip: Patience earns more XP. The longer you quest, the more you progress.
        </p>
      </CardContent>
    </Card>
  );
}
