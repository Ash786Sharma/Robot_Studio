import React from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useProjectStore } from '@/core/store/projectStore';

export const TerminalView: React.FC = () => {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const { ref } = useTerminal(activeProjectId);

  return (
    <div className="w-full h-full bg-zinc-950 p-2 flex flex-col">
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-1 mb-2 font-mono select-none">
        <span>TERMINAL</span>
        <span className={activeProjectId ? "text-emerald-500 font-bold" : "text-zinc-600 font-bold"}>
          {activeProjectId ? "● CONNECTED" : "○ NO PROJECT OPEN"}
        </span>
      </div>
      <div ref={ref} className="w-full flex-1 overflow-hidden" />
    </div>
  );
};

