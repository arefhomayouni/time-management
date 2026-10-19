import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import type { RateCurrency } from '../../store/slices/authSlice';

interface CurrencyToggleProps {
  value: RateCurrency;
  onChange: (currency: RateCurrency) => void;
  className?: string;
}

/**
 * Two-state segmented control for the unit a rate was typed in.
 * Kept as buttons (not radios) so the active unit is obvious and the
 * control works inside Formik without hidden-input styling tricks.
 */
const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { t, language } = useLanguage();

  const options: { value: RateCurrency; label: string }[] = [
    { value: 'usd', label: language === 'fa' ? 'دلار' : 'USD' },
    { value: 'irr', label: language === 'fa' ? 'ریال' : 'IRR' },
  ];

  return (
    <div
      role="group"
      aria-label={t('groups.rate_currency')}
      className={`inline-flex shrink-0 rounded-xl border border-line bg-inset p-0.5 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === option.value
              ? 'bg-surface text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
              : 'text-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default CurrencyToggle;
