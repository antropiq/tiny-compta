import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useAppTheme } from '../providers/ThemeContext';
import { useTranslation } from 'react-i18next';
import { dbService } from '../services/db';
import AccountList from './AccountList';
import './ApplicationHeaderBar.css';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ApplicationHeaderBarProps {
  // We can add props here later if needed
}

const ApplicationHeaderBar: React.FC<ApplicationHeaderBarProps> = () => {
  const { mode, toggleTheme } = useAppTheme();
  const { i18n, t } = useTranslation();

  const handleLanguageChange = async (event: SelectChangeEvent) => {
    const newLang = event.target.value;
    await dbService.setSetting('selected_language', newLang);
    window.location.reload();
  };

  return (
    <AppBar position="sticky" className="app-header-bar">
      <Toolbar>
        <Typography variant="h6" component="div" className="brand-text">
          {t('header.brand')}
        </Typography>

        <Box className="header-center-container">
          <AccountList />
        </Box>

        <Box className="header-actions">
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            size="small"
            className="language-selector"
          >
            <MenuItem value="fr">{t('header.languages.fr')}</MenuItem>
            <MenuItem value="en">{t('header.languages.en')}</MenuItem>
          </Select>

          <IconButton onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ApplicationHeaderBar;
