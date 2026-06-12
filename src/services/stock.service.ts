import { api } from '../lib/api'

export const getEquipments      = (p?: any) => api.get('/stock/equipments', { params: p }).then(r => r.data)
export const getEquipmentStats  = () => api.get('/stock/equipments/stats').then(r => r.data)
export const createEquipment    = (d: any) => api.post('/stock/equipments', d).then(r => r.data)
export const getVehicles        = (p?: any) => api.get('/stock/vehicles', { params: p }).then(r => r.data)
export const createVehicle      = (d: any) => api.post('/stock/vehicles', d).then(r => r.data)
export const updateVehicle      = (id: string, d: any) => api.patch(`/stock/vehicles/${id}`, d).then(r => r.data)
export const addFuelLog         = (d: any) => api.post('/stock/vehicles/fuel', d).then(r => r.data)
export const getVehicleFuelLogs = (id: string) => api.get(`/stock/vehicles/${id}/fuel`).then(r => r.data)
