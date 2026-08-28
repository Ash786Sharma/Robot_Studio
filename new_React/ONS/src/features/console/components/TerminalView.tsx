import React from 'react';
import { useTerminal } from '../hooks/useTerminal';

export const TerminalView: React.FC = () => {
  // Replace with target runtime backend environment configuration URI
  const { terminalRef } = useTerminal('ws://localhost:8080/terminal');

  return (
    <div className="w-full h-full bg-zinc-950 p-2 flex flex-col">
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-1 mb-2 font-mono select-none">
        <span>RUNTIME STREAM ENGINE (STDOUT)</span>
        <span className="text-emerald-500 font-bold">● CONNECTED</span>
      </div>
      <div ref={terminalRef} className="w-full flex-1 overflow-hidden" />
    </div>
  );
};
