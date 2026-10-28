import { useWindowDimensions } from 'react-native';

export type ResponsiveSize = 'compact' | 'regular' | 'wide';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const size: ResponsiveSize = width < 560 ? 'compact' : width < 960 ? 'regular' : 'wide';

  return {
    width,
    height,
    size,
    isCompact: size === 'compact',
    isWide: size === 'wide',
    isShort: height < 640,
  };
}
