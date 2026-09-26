import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: string;
  variant?: 'emerald' | 'indigo' | 'amber' | 'blue';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'indigo',
}) => {
  return (
    <div className={`kpi-card kpi-${variant}`}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon-wrap">{icon}</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">{subtext}</div>
    </div>
  );
};
