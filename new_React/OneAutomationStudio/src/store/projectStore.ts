import { create } from 'zustand';
import type { Project, RobotModel } from '../types';

interface ProjectStore {
  // State
  currentProject: Project | null;
  projects: Project[];
  robotModels: RobotModel[];

  // Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  setRobotModels: (models: RobotModel[]) => void;
  addRobotModel: (model: RobotModel) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  projects: [],
  robotModels: [],

  setCurrentProject: (project) =>
    set(() => ({
      currentProject: project,
    })),

  setProjects: (projects) =>
    set(() => ({
      projects,
    })),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),

  deleteProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    })),

  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    })),

  setRobotModels: (models) =>
    set(() => ({
      robotModels: models,
    })),

  addRobotModel: (model) =>
    set((state) => ({
      robotModels: [...state.robotModels, model],
    })),
}));
