import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Device, Enrollment, LockResult } from '../lib/types'

export interface DeviceInput {
  customer_id?: number | null
  platform: string
  serial_number?: string | null
  imei?: string | null
  model?: string | null
  enrollment_id?: string | null
  amapi_name?: string | null
}

export function useDeviceControl(deviceId?: number) {
  const qc = useQueryClient()

  const invalidateDevice = () => {
    if (deviceId) {
      void qc.invalidateQueries({ queryKey: ['device', deviceId] })
    }
    void qc.invalidateQueries({ queryKey: ['devices'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
    void qc.invalidateQueries({ queryKey: ['audit'] })
    void qc.invalidateQueries({ queryKey: ['payments'] })
  }

  const lock = useMutation({
    mutationFn: ({
      id = deviceId,
      message,
      reason = 'manual',
    }: {
      id?: number
      message?: string
      reason?: string
    }) => {
      const targetId = id ?? deviceId
      if (!targetId) throw new Error("Qurilma ID ko'rsatilmadi")
      return api.post<LockResult>(`/devices/${targetId}/lock`, { message, reason })
    },
    onSuccess: invalidateDevice,
  })

  const unlock = useMutation({
    mutationFn: (targetId?: number) => {
      const id = targetId ?? deviceId
      if (!id) throw new Error("Qurilma ID ko'rsatilmadi")
      return api.post<LockResult>(`/devices/${id}/unlock`)
    },
    onSuccess: invalidateDevice,
  })

  const release = useMutation({
    mutationFn: (targetId?: number) => {
      const id = targetId ?? deviceId
      if (!id) throw new Error("Qurilma ID ko'rsatilmadi")
      return api.post(`/devices/${id}/release`)
    },
    onSuccess: invalidateDevice,
  })

  const erase = useMutation({
    mutationFn: (targetId?: number) => {
      const id = targetId ?? deviceId
      if (!id) throw new Error("Qurilma ID ko'rsatilmadi")
      return api.post<LockResult>(`/devices/${id}/erase`, { confirm: 'ERASE' })
    },
    onSuccess: invalidateDevice,
  })

  const markLost = useMutation({
    mutationFn: ({
      id = deviceId,
      note = 'Panel orqali belgilandi',
    }: {
      id?: number
      note?: string
    } = {}) => {
      const targetId = id ?? deviceId
      if (!targetId) throw new Error("Qurilma ID ko'rsatilmadi")
      return api.post(`/devices/${targetId}/lost`, { note })
    },
    onSuccess: invalidateDevice,
  })

  const enroll = useMutation({
    mutationFn: (targetId?: number) => {
      const id = targetId ?? deviceId
      if (!id) throw new Error("Qurilma ID ko'rsatilmadi")
      return api.post<Enrollment>(`/devices/${id}/enroll`)
    },
    onSuccess: invalidateDevice,
  })

  const createDevice = useMutation({
    mutationFn: (input: DeviceInput) => api.post<Device>('/devices', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const updateDevice = useMutation({
    mutationFn: ({ id, input }: { id: number; input: DeviceInput }) =>
      api.put<Device>(`/devices/${id}`, input),
    onSuccess: invalidateDevice,
  })

  const deleteDevice = useMutation({
    mutationFn: (id: number) => api.del(`/devices/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const restoreDevice = useMutation({
    mutationFn: (id: number) => api.post(`/devices/${id}/restore`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['devices'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return {
    lock,
    unlock,
    release,
    erase,
    markLost,
    enroll,
    createDevice,
    updateDevice,
    deleteDevice,
    restoreDevice,
    invalidateDevice,
  }
}
