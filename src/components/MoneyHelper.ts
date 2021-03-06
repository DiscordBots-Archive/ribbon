import { currencySymbolMap } from './Constants';
import { CurrencyUnits } from 'RibbonTypes';

export const currencyMap = (code: string): string | null => {
  code = code.toUpperCase();
  if (!(code in currencySymbolMap)) return null;

  return currencySymbolMap[code];
};

export const convertCurrency = (rates: CurrencyUnits, fromCurrency: string, toCurrency: string, value: number): number => value * (rates[toCurrency] * (1 / rates[fromCurrency]));