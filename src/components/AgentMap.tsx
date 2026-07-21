import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface AgentMapProps {
  markers: {
    id: string
    name: string
    siteName: string
    phone?: string
    shift?: string
    lat: number
    lng: number
    type?: 'agent' | 'site'
  }[]
}

const agentIcon = L.divIcon({
  className: 'agent-marker',
  html: `<div style="background:#22c55e;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:16px">🧑\u200d💼</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const siteIcon = L.divIcon({
  className: 'site-marker',
  html: `<div style="background:#3b82f6;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:16px">🏢</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

export default function AgentMap({ markers }: AgentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [5.36, -4.01],
      zoom: 12,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return
    layerRef.current.clearLayers()

    const valid = markers.filter(m => m.lat && m.lng && !isNaN(m.lat) && !isNaN(m.lng))

    valid.forEach(m => {
      const isAgent = m.type !== 'site'
      const icon = isAgent ? agentIcon : siteIcon
      const badgeColor = isAgent ? '#22c55e' : '#3b82f6'
      const label = isAgent ? 'Agent en poste' : 'Site (affecté)'
      const popup = `
        <div style="min-width:200px">
          <p style="font-weight:700;font-size:13px;margin:0 0 4px">${m.name}</p>
          <p style="font-size:12px;color:#666;margin:0 0 4px">📍 ${m.siteName}</p>
          <p style="font-size:11px;margin:0 0 4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${badgeColor};margin-right:4px"></span>${label}</p>
          ${m.shift ? `<p style="font-size:11px;margin:0 0 2px">🕐 ${m.shift}</p>` : ''}
          ${m.phone ? `<p style="font-size:11px;margin:0">📞 ${m.phone}</p>` : ''}
        </div>
      `
      L.marker([m.lat, m.lng], { icon })
        .bindPopup(popup)
        .addTo(layerRef.current!)
    })

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(m => [m.lat, m.lng]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [markers])

  useEffect(() => {
    const handler = (e: Event) => {
      const { lat, lng } = (e as CustomEvent).detail
      if (mapRef.current && lat && lng) {
        mapRef.current.setView([lat, lng], 16, { animate: true })
      }
    }
    window.addEventListener('agent-map-focus', handler)
    return () => window.removeEventListener('agent-map-focus', handler)
  }, [])

  return <div ref={containerRef} style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
}
