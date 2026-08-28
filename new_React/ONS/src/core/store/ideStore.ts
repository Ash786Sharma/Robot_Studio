import { create } from 'zustand';

interface VariableTag {
  id: string;
  name: string;
  type: 'BOOL' | 'INT' | 'REAL';
  value: any;
}

interface IDEState {
  // Tabs & File Systems
  activeTab: 'workflow' | 'editor' | 'simulation';
  setActiveTab: (tab: 'workflow' | 'editor' | 'simulation') => void;
  code: string;
  setCode: (code: string) => void;

  // ReactFlow Node Graph Data
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;

  // Telemetry Registers (Live Hardware Tags)
  plcTags: Record<string, VariableTag>;
  updateTagValue: (id: string, value: any) => void;
  
  // Robot Spatial Telemetry (High-Frequency updates for ThreeJS)
  robotTransform: { position: [number, number, number]; rotation: [number, number, number] };
  setRobotTransform: (pos: [number, number, number], rot: [number, number, number]) => void;
}

export const useIDEStore = create<IDEState>();

