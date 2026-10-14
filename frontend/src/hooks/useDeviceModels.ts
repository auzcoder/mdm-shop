import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface DeviceModel {
  id: number
  platform: 'ios' | 'android' | 'macos'
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export function useDeviceModels(platform?: string, activeOnly = false, search = '') {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['models', { platform, activeOnly, search }],
    queryFn: () => {
      const params: Record<string, string | boolean> = {}
      if (platform) params.platform = platform
      if (activeOnly) params.active_only = true
      if (search.trim()) params.search = search.trim()
      return api.get<{ items: DeviceModel[]; total: number }>('/models', params)
    },
  })

  const createModel = useMutation({
    mutationFn: (data: { platform: string; name: string; is_active?: boolean; sort_order?: number }) =>
      api.post<DeviceModel>('/models', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['models'] })
    },
  })

  const updateModel = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; is_active: boolean; sort_order?: number } }) =>
      api.put<DeviceModel>(`/models/${id}`, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['models'] })
    },
  })

  const toggleModel = useMutation({
    mutationFn: (id: number) => api.post<DeviceModel>(`/models/${id}/toggle`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['models'] })
    },
  })

  const deleteModel = useMutation({
    mutationFn: (id: number) => api.del<{ ok: boolean }>(`/models/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['models'] })
    },
  })

  return {
    ...query,
    models: query.data?.items ?? [],
    createModel,
    updateModel,
    toggleModel,
    deleteModel,
  }
}
