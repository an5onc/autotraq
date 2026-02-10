import { PartCondition, PART_CONDITIONS } from '../api/client';

interface ConditionBadgeProps {
  condition: PartCondition;
  size?: 'sm' | 'md';
}

export function ConditionBadge({ condition, size = 'sm' }: ConditionBadgeProps) {
  const config = PART_CONDITIONS.find(c => c.value === condition) || PART_CONDITIONS[7]; // fallback to UNKNOWN
  
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span 
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full border ${colorClasses[config.color]} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}

interface ConditionSelectProps {
  value: PartCondition;
  onChange: (value: PartCondition) => void;
  disabled?: boolean;
}

export function ConditionSelect({ value, onChange, disabled }: ConditionSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PartCondition)}
      disabled={disabled}
      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors disabled:opacity-50"
    >
      {PART_CONDITIONS.map((cond) => (
        <option key={cond.value} value={cond.value}>
          {cond.label}
        </option>
      ))}
    </select>
  );
}

export default ConditionBadge;
