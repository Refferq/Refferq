import { prisma } from './prisma';

const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'INR': '₹',
    'RUB': '₽',
    'GBP': '£',
    'BGN': 'лв.',
    'CAD': 'CA$',
    'AUD': 'A$',
};

export async function getCurrencySymbol(): Promise<string> {
    try {
        const settings = await prisma.programSettings.findFirst();
        const currency = settings?.currency || 'USD';
        return CURRENCY_SYMBOLS[currency] || currency;
    } catch (error) {
        console.error('Failed to fetch currency symbol:', error);
        return '$';
    }
}

export function formatCurrency(cents: number, symbol: string): string {
    const amount = cents / 100;
    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export async function formatAmount(cents: number): Promise<string> {
    const symbol = await getCurrencySymbol();
    return formatCurrency(cents, symbol);
}
