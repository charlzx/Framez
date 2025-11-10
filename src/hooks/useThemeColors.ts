import { useMemo } from 'react';
import { theme } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

export const useThemeColors = () => {
  const mode = useSettingsStore((state) => state.themeMode);

  return useMemo(() => theme[mode], [mode]);
};
