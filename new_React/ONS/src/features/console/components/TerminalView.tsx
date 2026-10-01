import React from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useProjectStore } from '@/core/store/projectStore';

export const TerminalView: React.FC = () => {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const { ref } = useTerminal(activeProjectId);

  return (
    <div className="w-full h-full bg-[var(--ide-surface-bg)] p-2 flex flex-col">
      <div className="flex items-center justify-between text-xs text-[var(--ide-text-inactive)] border-b border-[var(--border)] pb-1 mb-2 font-mono select-none">
        <span>TERMINAL</span>
        <span className={activeProjectId ? "text-emerald-500 font-bold" : "text-[var(--ide-text-inactive)] font-bold"}>
          {activeProjectId ? "● CONNECTED" : "○ NO PROJECT OPEN"}
        </span>
      </div>
      <div ref={ref} className="w-full flex-1 overflow-hidden" />
    </div>
  );
};

