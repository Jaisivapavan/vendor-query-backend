import React from 'react';
import { Sparkles } from 'lucide-react';

interface TopBarProps {
  title: string;
  onRefresh?: () => void;
  onOpenAi?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onOpenAi }) => {
  return (
    <header className="top-bar">
      <h1 className="page-title">{title}</h1>
      <div className="top-bar-actions">
        {onOpenAi && (
          <button className="btn btn-sm" onClick={onOpenAi}>
            <Sparkles size={14} />
            <span>Ask AI Assistant</span>
          </button>
        )}
      </div>
    </header>
  );
};
