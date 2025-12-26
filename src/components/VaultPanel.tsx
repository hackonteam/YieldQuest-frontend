import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTRACTS, QUEST_VAULT_ABI, ERC20_ABI } from '@/lib/wagmi-config';
import { Coins, ArrowDownToLine, ArrowUpFromLine, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

  // Write functions
  const { writeContractAsync } = useWriteContract();

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

      // Check if approval is needed
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

      toast.info('Depositing...');
      await writeContractAsync({
        address: CONTRACTS.QUEST_VAULT,
        abi: QUEST_VAULT_ABI,
        functionName: 'deposit',
        args: [amount, address],
      } as any);
      
      toast.success('Deposit successful!');
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
      
      toast.info('Withdrawing...');
      await writeContractAsync({
        address: CONTRACTS.QUEST_VAULT,
        abi: QUEST_VAULT_ABI,
        functionName: 'withdraw',
        args: [amount, address, address],
      } as any);
      
      toast.success('Withdrawal successful!');
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
      
      toast.success('XP claimed successfully!');
      refetchAll();
    } catch (e: any) {
      toast.error(`Claim failed: ${e.message?.slice(0, 100) || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Quest Vault
          </CardTitle>
          <CardDescription>Connect your wallet to start your quest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Connect wallet to view vault
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Quest Vault
        </CardTitle>
        <CardDescription>Deposit to earn yield and XP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vault Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Your Deposit</p>
            <p className="text-2xl font-bold text-foreground">
              {depositedAssets ? parseFloat(formatUnits(depositedAssets, 18)).toFixed(4) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">tokens</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Vault TVL</p>
            <p className="text-2xl font-bold text-foreground">
              {totalAssets ? parseFloat(formatUnits(totalAssets, 18)).toFixed(4) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">total locked</p>
          </div>
        </div>

        {/* Claimable XP */}
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Claimable XP</p>
              <p className="text-3xl font-bold text-primary">
                {claimableXP ? parseFloat(formatUnits(claimableXP, 18)).toFixed(4) : '0'}
              </p>
            </div>
            <Button
              onClick={handleClaimXP}
              disabled={!claimableXP || claimableXP === 0n || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Claim XP
            </Button>
          </div>
        </div>

        {/* Deposit/Withdraw Tabs */}
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="deposit" className="flex-1 gap-2">
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1 gap-2">
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-muted-foreground">
                  Balance: {tokenBalance ? parseFloat(formatUnits(tokenBalance, 18)).toFixed(4) : '0'}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
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
            <Button onClick={handleDeposit} disabled={!depositAmount || isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Deposit'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-muted-foreground">
                  Deposited: {depositedAssets ? parseFloat(formatUnits(depositedAssets, 18)).toFixed(4) : '0'}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
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
            <Button onClick={handleWithdraw} disabled={!withdrawAmount || isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
