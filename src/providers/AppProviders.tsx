import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { CssBaseline } from '@mui/material';
import './../i18n'; // Initialize i18n
import { useTranslation } from 'react-i18next';
import { dbService } from '../services/db';
import 'dayjs/locale/fr';
import { ThemeContext, type ThemeMode } from './ThemeContext';
import { AccountProvider } from './AccountContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    let isMounted = true;
    const initLanguage = async () => {
      const setting = await dbService.getSettingByKey('selected_language');
      if (isMounted && setting && setting.value && setting.value !== i18n.language) {
        await i18n.changeLanguage(setting.value);
      }
    };
    initLanguage();
    return () => {
      isMounted = false;
    };
  }, [i18n]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
          <AccountProvider>
            <CssBaseline />
            {children}
          </AccountProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
