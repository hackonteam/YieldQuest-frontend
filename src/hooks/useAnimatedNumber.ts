import { useState, useEffect, useRef } from 'react';

interface UseAnimatedNumberOptions {
  duration?: number;
  decimals?: number;
}

export function useAnimatedNumber(
  targetValue: number,
  options: UseAnimatedNumberOptions = {}
) {
  const { duration = 500, decimals = 2 } = options;
  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(targetValue);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (targetValue === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = targetValue;
    const startTime = performance.now();
    
    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  // Initialize on first render
  useEffect(() => {
    previousValue.current = targetValue;
    setDisplayValue(targetValue);
  }, []);

  return {
    value: displayValue,
    formattedValue: displayValue.toFixed(decimals),
    isAnimating,
    hasIncreased: targetValue > previousValue.current,
  };
}
