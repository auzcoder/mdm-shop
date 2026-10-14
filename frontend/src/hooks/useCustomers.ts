import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Customer, ListResponse } from '../lib/types'

export interface CustomerInput {
  full_name: string
  phone: string
  passport?: string | null
  address?: string | null
  telegram_chat_id?: string | null
  note?: string | null
}

export function useCustomers(search = '', offset = 0, limit = 25, archived = false) {
  const qc = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['customers', { search, offset, limit, archived }],
    queryFn: () =>
      api.get<ListResponse<Customer>>('/customers', { search, offset, limit, archived }),
  })

  const createCustomer = useMutation({
    mutationFn: (input: CustomerInput) => api.post<Customer>('/customers', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customers'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const updateCustomer = useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomerInput }) =>
      api.put<Customer>(`/customers/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customers'] })
      void qc.invalidateQueries({ queryKey: ['devices'] })
    },
  })

  const deleteCustomer = useMutation({
    mutationFn: (id: number) => api.del(`/customers/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customers'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const restoreCustomer = useMutation({
    mutationFn: (id: number) => api.post(`/customers/${id}/restore`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customers'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return {
    ...listQuery,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    restoreCustomer,
  }
}
