import { Navigate, useParams } from 'react-router-dom'

export default function ContractNew() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/calculator?device_id=${id || ''}`} replace />
}
