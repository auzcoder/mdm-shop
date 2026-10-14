import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Role, User } from '../lib/types'

export interface CreateUserInput {
  email: string
  phone?: string
  full_name?: string
  password: string
  role: Role
}

export interface UpdateUserInput {
  id: number
  phone?: string
  full_name?: string
  role: Role
  is_active: boolean
  password?: string
}

export function useUsers(archived = false) {
  const qc = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['users', { archived }],
    queryFn: () => api.get<{ items: User[] }>('/users', { archived }),
  })

  const createUser = useMutation({
    mutationFn: (input: CreateUserInput) => api.post<User>('/users', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateUser = useMutation({
    mutationFn: ({ id, ...input }: UpdateUserInput) =>
      api.put<User>(`/users/${id}`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.del(`/users/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const restoreUser = useMutation({
    mutationFn: (id: number) => api.post(`/users/${id}/restore`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const changePassword = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.post(`/users/${id}/password`, { password }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return {
    ...listQuery,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
    changePassword,
  }
}
