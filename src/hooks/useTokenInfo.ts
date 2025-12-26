import { useReadContract } from 'wagmi';
import { CONTRACTS, QUEST_VAULT_ABI, ERC20_ABI } from '@/lib/wagmi-config';

/**
 * Hook to dynamically fetch the underlying token address and decimals from QuestVault
 * Uses QuestVault.asset() as the single source of truth for the underlying token
 */
export function useTokenInfo() {
  // Read underlying token address from QuestVault.asset()
  const { data: assetAddress, isLoading: isLoadingAsset } = useReadContract({
    address: CONTRACTS.QUEST_VAULT,
    abi: QUEST_VAULT_ABI,
    functionName: 'asset',
  });

  // Use the dynamically fetched asset address, fallback to config for type safety
  const tokenAddress = assetAddress || CONTRACTS.UNDERLYING_TOKEN;

  // Read decimals from the underlying token
  const { data: decimals, isLoading: isLoadingDecimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress },
  });

  // Read token symbol
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress },
  });

  // Default to 6 decimals (USDC-style) if not yet loaded, with dev warning
  const tokenDecimals = decimals ?? 6;
  
  // Dev warning for unexpected decimals
  if (decimals !== undefined && decimals !== 6 && decimals !== 18) {
    console.warn('Unexpected token decimals:', decimals);
  }

  return {
    assetAddress: tokenAddress,
    decimals: tokenDecimals,
    symbol: symbol ?? 'TOKEN',
    isLoading: isLoadingAsset || isLoadingDecimals,
  };
}
