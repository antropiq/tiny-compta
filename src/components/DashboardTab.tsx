import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme
} from '@mui/material';
import {
  ChartsContainer,
  BarPlot,
  LinePlot,
  MarkPlot,
  ChartsXAxis,
  ChartsYAxis,
  ChartsTooltip,
  ChartsAxisHighlight
} from '@mui/x-charts';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import { FormatUtils } from '../utils/formatUtils';
import type { Transaction } from '../types/transaction';

const DashboardTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { selectedAccount, selectedDate, transactionsVersion } = useAccount();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);
  const [highlightedAxis, setHighlightedAxis] = useState<Array<{ axisId: string; dataIndex: number }> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      if (selectedAccount) {
        try {
          const txs = await dbService.getTransactionsByAccountId(selectedAccount.id);
          if (isMounted) {
            setTransactions(txs);
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        if (isMounted) {
          setTransactions([]);
        }
      }
    };
    fetchTransactions();
    return () => {
      isMounted = false;
    };
  }, [selectedAccount, transactionsVersion]);

  const D = useMemo(() => selectedDate || dayjs(), [selectedDate]);
  const daysInMonth = useMemo(() => D.daysInMonth(), [D]);

  const chartDates = useMemo(() => {
    const prevMonth = D.subtract(1, 'month');
    let current = prevMonth.endOf('month');
    const prevBusinessDays: dayjs.Dayjs[] = [];
    while (prevBusinessDays.length < 5) {
      const dayOfWeek = current.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        prevBusinessDays.push(current);
      }
      current = current.subtract(1, 'day');
    }
    prevBusinessDays.reverse();

    const currentMonthDays: dayjs.Dayjs[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push(D.date(i));
    }

    return [...prevBusinessDays, ...currentMonthDays];
  }, [D, daysInMonth]);

  const nonRecurringIncomes = useMemo(() => {
    const dateStrings = new Set(chartDates.map(d => d.format('YYYY-MM-DD')));
    return transactions
      .filter((tx) => {
        const txDateStr = dayjs(tx.dueDate).format('YYYY-MM-DD');
        return dateStrings.has(txDateStr) && tx.amount > 0 && !tx.recurringId;
      })
      .sort((a, b) => dayjs(a.dueDate).diff(dayjs(b.dueDate)));
  }, [transactions, chartDates]);

  const totalIncomes = useMemo(() => {
    return nonRecurringIncomes.reduce((sum, tx) => sum + tx.amount, 0);
  }, [nonRecurringIncomes]);

  const balanceToday = useMemo(() => {
    const today = dayjs().endOf('day');
    return transactions.reduce((sum, tx) => {
      const txDate = dayjs(tx.dueDate);
      return txDate.isBefore(today) || txDate.isSame(today, 'day') ? sum + tx.amount : sum;
    }, 0);
  }, [transactions]);

  const balanceForecast = useMemo(() => {
    const endOfMonth = D.endOf('month').endOf('day');
    return transactions.reduce((sum, tx) => {
      const txDate = dayjs(tx.dueDate);
      return txDate.isBefore(endOfMonth) || txDate.isSame(endOfMonth, 'day') ? sum + tx.amount : sum;
    }, 0);
  }, [transactions, D]);

  const chartData = useMemo(() => {
    const dailyInNonRecurring = chartDates.map((date) => {
      return transactions
        .filter((tx) => {
          const txDate = dayjs(tx.dueDate);
          return txDate.isSame(date, 'day') && tx.amount > 0 && !tx.recurringId;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
    });

    const dailyInRecurring = chartDates.map((date) => {
      return transactions
        .filter((tx) => {
          const txDate = dayjs(tx.dueDate);
          return txDate.isSame(date, 'day') && tx.amount > 0 && tx.recurringId;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
    });

    const dailyBalances = chartDates.map((date) => {
      const limit = date.endOf('day');
      return transactions.reduce((sum, tx) => {
        const txDate = dayjs(tx.dueDate);
        return txDate.isBefore(limit) || txDate.isSame(limit, 'day') ? sum + tx.amount : sum;
      }, 0);
    });

    return {
      dailyInNonRecurring,
      dailyInRecurring,
      dailyBalances,
    };
  }, [transactions, chartDates]);

  const xAxisData = useMemo(() => {
    return Array.from({ length: chartDates.length }, (_, i) => i);
  }, [chartDates]);

  const handleHighlightedAxisChange = (
    params: Array<{ axisId: string; dataIndex: number }> | null
  ) => {
    setHighlightedAxis(params);
    if (params && params.length > 0) {
      const xParam = params.find((p) => p.axisId === 'x');
      if (xParam) {
        const idx = xParam.dataIndex;
        if (idx >= 0 && idx < chartDates.length) {
          const nonRecIn = chartData.dailyInNonRecurring[idx];
          if (nonRecIn > 0) {
            setHoveredDateStr(chartDates[idx].format('YYYY-MM-DD'));
            return;
          }
        }
      }
    }
    setHoveredDateStr(null);
  };

  if (!selectedAccount) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          {t('dashboard.no_account_selected')}
        </Typography>
      </Box>
    );
  }

  const successColor = theme.palette.success.main || '#2e7d32';
  const successDarkColor = theme.palette.success.dark || '#1b5e20';
  const primaryColor = theme.palette.primary.main || '#1976d2';

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
        <Grid size={{ xs: 12, md: 4 }} sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                {t('dashboard.non_recurring_incomes_title')}
              </Typography>
              {nonRecurringIncomes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 0.5, fontSize: '0.8rem' }}>
                  {t('dashboard.no_incomes')}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 0.5, px: 1 }}>{t('transaction.label')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 0.5, px: 1 }}>{t('transaction.amount')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', py: 0.5, px: 1 }}>{t('transaction.dueDate')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {nonRecurringIncomes.map((tx) => {
                        const isHovered = hoveredDateStr === dayjs(tx.dueDate).format('YYYY-MM-DD');
                        return (
                          <TableRow
                            key={tx.id}
                            sx={{
                              backgroundColor: isHovered
                                ? 'rgba(46, 125, 50, 0.15)'
                                : 'transparent',
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{tx.label}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'medium', fontSize: '0.8rem', py: 0.5, px: 1 }}>
                              {FormatUtils.currency(tx.amount, i18n.language)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>
                              {FormatUtils.date(tx.dueDate, i18n.language)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 'bold', pt: 1, pb: 0.5, px: 1, fontSize: '0.85rem' }}>
                          Total
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', pt: 1, pb: 0.5, px: 1, color: 'success.main', fontSize: '0.85rem' }}>
                          {FormatUtils.currency(totalIncomes, i18n.language)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                {t('dashboard.balance_table_title')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow sx={{ color: balanceToday < 0 ? 'error.main' : 'inherit' }}>
                      <TableCell sx={{ fontWeight: 'medium', borderBottom: 'none', fontSize: '0.85rem', py: 0.5, px: 1, color: balanceToday < 0 ? 'error.main' : 'inherit' }}>
                        {t('dashboard.balance_today')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: 'none', fontSize: '0.85rem', py: 0.5, px: 1, color: balanceToday < 0 ? 'error.main' : 'inherit' }}>
                        {FormatUtils.currency(balanceToday, i18n.language)}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ color: balanceForecast < 0 ? 'error.main' : 'inherit' }}>
                      <TableCell sx={{ fontWeight: 'medium', borderBottom: 'none', fontSize: '0.85rem', py: 0.5, px: 1, color: balanceForecast < 0 ? 'error.main' : 'inherit' }}>
                        {t('dashboard.balance_forecast')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: 'none', fontSize: '0.85rem', py: 0.5, px: 1, color: balanceForecast < 0 ? 'error.main' : 'inherit' }}>
                        {FormatUtils.currency(balanceForecast, i18n.language)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }} sx={{ p: 0 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {t('dashboard.chart_title')}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 350, flexGrow: 1 }}>
              <ChartsContainer
                xAxis={[
                  {
                    id: 'x',
                    data: xAxisData,
                    scaleType: 'band',
                    valueFormatter: (idx: number) => {
                      const date = chartDates[idx];
                      return date ? date.format('DD/MM') : '';
                    },
                  },
                ]}
                series={[
                  {
                    id: 'non-recurring-incomes',
                    type: 'bar',
                    stack: 'incomes',
                    data: chartData.dailyInNonRecurring,
                    label: t('dashboard.chart_incomes'),
                    color: successColor,
                    valueFormatter: (val: number | null) => (val !== null ? FormatUtils.currency(val, i18n.language) : ''),
                  },
                  {
                    id: 'recurring-incomes',
                    type: 'bar',
                    stack: 'incomes',
                    data: chartData.dailyInRecurring,
                    label: t('dashboard.chart_incomes_recurring'),
                    color: successDarkColor,
                    valueFormatter: (val: number | null) => (val !== null ? FormatUtils.currency(val, i18n.language) : ''),
                  },
                  {
                    id: 'balances',
                    type: 'line',
                    data: chartData.dailyBalances,
                    label: t('dashboard.chart_expenses'),
                    color: primaryColor,
                    valueFormatter: (val: number | null) => (val !== null ? FormatUtils.currency(val, i18n.language) : ''),
                  },
                ]}
                highlightedAxis={highlightedAxis || undefined}
                onHighlightedAxisChange={handleHighlightedAxisChange}
                height={350}
                margin={{ left: 80, right: 20, top: 40, bottom: 40 }}
              >
                <BarPlot />
                <LinePlot />
                <MarkPlot />
                <ChartsXAxis />
                <ChartsYAxis />
                <ChartsAxisHighlight x="band" />
                <ChartsTooltip />
              </ChartsContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardTab;
