import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { NotificationTemplate } from '../lib/types'

export interface SaveTemplateInput {
  code: string
  channel: string
  body: string
  is_active: boolean
}

export function useSettings() {
  const qc = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Record<string, string>>('/settings'),
  })

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<{ items: NotificationTemplate[] }>('/templates'),
  })

  const saveSettings = useMutation({
    mutationFn: (values: Record<string, string>) => api.put('/settings', values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const saveTemplate = useMutation({
    mutationFn: (input: SaveTemplateInput) =>
      api.put(`/templates/${input.code}`, {
        channel: input.channel,
        body: input.body,
        is_active: input.is_active,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  return {
    settings: settingsQuery.data,
    isLoadingSettings: settingsQuery.isLoading,
    templates: templatesQuery.data?.items,
    isLoadingTemplates: templatesQuery.isLoading,
    saveSettings,
    saveTemplate,
  }
}
