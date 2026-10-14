import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { AllocatePaymentResult, Contract, DeviceStatus, ListResponse, Payment, Platform } from '../lib/types'

export interface PaymentRow extends Payment {
  customer_name: string
  customer_phone: string
  device_model: string
  device_status: DeviceStatus
  platform: Platform
  grace_days: number
  contract_total?: string
  contract_months?: number
}

export interface ContractInput {
  device_id: number
  total_amount: string
  down_payment: string
  months: number
  grace_days: number
  start_date: string
}

export interface PayInput {
  amount: string
  external_ref?: string
  paid_at?: string
}

export interface AllocatePaymentInput {
  device_id?: number
  contract_id?: number
  amount: string
  external_ref?: string
  paid_at?: string
}

export function usePayments(scope = 'overdue', search = '', offset = 0, limit = 25, archived = false) {
  const qc = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['payments', { scope, search, offset, limit, archived }],
    queryFn: () =>
      api.get<ListResponse<PaymentRow>>('/payments', {
        scope,
        search,
        offset,
        limit,
        archived,
      }),
  })

  const createContract = useMutation({
    mutationFn: (input: ContractInput) => api.post<Contract>('/contracts', input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['device', vars.device_id] })
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['payments'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const pay = useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: number; input: PayInput }) =>
      api.post<{ message: string; unlocked?: boolean; contract_closed?: boolean }>(
        `/payments/${paymentId}/pay`,
        input
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments'] })
      void qc.invalidateQueries({ queryKey: ['device'] })
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const allocate = useMutation({
    mutationFn: (input: AllocatePaymentInput) =>
      api.post<AllocatePaymentResult>('/payments/allocate', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments'] })
      void qc.invalidateQueries({ queryKey: ['payment'] })
      void qc.invalidateQueries({ queryKey: ['device'] })
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const archiveDevice = useMutation({
    mutationFn: (deviceId: number) => api.del(`/devices/${deviceId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments'] })
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const restoreDevice = useMutation({
    mutationFn: (deviceId: number) => api.post(`/devices/${deviceId}/restore`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments'] })
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return {
    ...listQuery,
    createContract,
    pay,
    allocate,
    archiveDevice,
    restoreDevice,
  }
}
