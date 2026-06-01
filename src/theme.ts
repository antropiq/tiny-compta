import { createTheme, type Theme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark'): Theme => createTheme({
  palette: {
    mode,
  },
});

export type ThemeMode = 'light' | 'dark';
