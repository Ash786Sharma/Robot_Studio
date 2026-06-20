import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './api';
import type { Project, RobotModel } from '../types';

// Projects
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects');
      return data;
    },
  });
};

export const useProject = (projectId: string | null) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await apiClient.get(`/projects/${projectId}`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await apiClient.post('/projects', project);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Files
export const useProjectFiles = (projectId: string | null) => {
  return useQuery({
    queryKey: ['files', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await apiClient.get(`/projects/${projectId}/files`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useFileContent = (fileId: string | null) => {
  return useQuery({
    queryKey: ['fileContent', fileId],
    queryFn: async () => {
      if (!fileId) return '';
      const { data } = await apiClient.get(`/files/${fileId}/content`);
      return data.content;
    },
    enabled: !!fileId,
  });
};

export const useSaveFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fileId, content }: { fileId: string; content: string }) => {
      const { data } = await apiClient.post(`/files/${fileId}/save`, { content });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fileContent', variables.fileId] });
    },
  });
};

// Robot Models
export const useRobotModels = (): ReturnType<typeof useQuery<RobotModel[]>> => {
  return useQuery({
    queryKey: ['robotModels'],
    queryFn: async () => {
      const { data } = await apiClient.get('/robot-models');
      return data;
    },
  });
};

export const useRobotModel = (modelId: string | null): ReturnType<typeof useQuery<RobotModel | null>> => {
  return useQuery({
    queryKey: ['robotModel', modelId],
    queryFn: async () => {
      if (!modelId) return null;
      const { data } = await apiClient.get(`/robot-models/${modelId}`);
      return data;
    },
    enabled: !!modelId,
  });
};

// Upload Robot Model
export const useUploadRobotModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/robot-models/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robotModels'] });
    },
  });
};
