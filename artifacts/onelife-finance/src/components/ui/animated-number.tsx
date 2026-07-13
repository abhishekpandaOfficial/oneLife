import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ 
  value, 
  format = (v) => v.toString(), 
  className,
  duration = 1000 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const startValue = displayValue;
    const endValue = value;
    const change = endValue - startValue;

    if (change === 0) return;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(startValue + change * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{format(displayValue)}</span>;
}

// Define global currency state
let currentCurrency = (typeof localStorage !== 'undefined' && localStorage.getItem('onelife_currency')) || 'INR';
export const globalRates = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  QAR: 0.043,
  SAR: 0.045,
  AED: 0.044,
};

// Fetch rates once when module is loaded
if (typeof fetch !== 'undefined') {
  fetch("https://open.er-api.com/v6/latest/INR")
    .then(r => r.json())
    .then(data => {
      if (data && data.rates) {
        globalRates.USD = data.rates.USD || globalRates.USD;
        globalRates.EUR = data.rates.EUR || globalRates.EUR;
        globalRates.QAR = data.rates.QAR || globalRates.QAR;
        globalRates.SAR = data.rates.SAR || globalRates.SAR;
        globalRates.AED = data.rates.AED || globalRates.AED;
        // Dispatch refresh so any loaded UI picks up the latest fetched rates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('onelife_currency_change'));
        }
      }
    })
    .catch(err => console.error("Error fetching live rates, using defaults:", err));
}

export function setGlobalCurrency(currency: string) {
  currentCurrency = currency;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('onelife_currency', currency);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('onelife_currency_change'));
  }
}

export function getGlobalCurrency() {
  return currentCurrency;
}

export function getGlobalRates() {
  return globalRates;
}

export function useCurrencyRefresh() {
  const [currency, setCurrency] = useState(getGlobalCurrency());
  useEffect(() => {
    const handle = () => setCurrency(getGlobalCurrency());
    window.addEventListener('onelife_currency_change', handle);
    return () => window.removeEventListener('onelife_currency_change', handle);
  }, []);
  return currency;
}

const LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  QAR: "en-QA",
  SAR: "en-SA",
  AED: "en-AE",
};

export function formatCurrency(amount: number): string {
  const rate = globalRates[currentCurrency as keyof typeof globalRates] || 1.0;
  const converted = amount * rate;
  return new Intl.NumberFormat(LOCALES[currentCurrency] || "en-IN", {
    style: 'currency',
    currency: currentCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted);
}

export function formatCurrencyDecimals(amount: number): string {
  const rate = globalRates[currentCurrency as keyof typeof globalRates] || 1.0;
  const converted = amount * rate;
  return new Intl.NumberFormat(LOCALES[currentCurrency] || "en-IN", {
    style: 'currency',
    currency: currentCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}
