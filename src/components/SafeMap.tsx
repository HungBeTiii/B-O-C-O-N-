import React, { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

export type LatLngValue = [number, number]

const DEFAULT_CENTER: LatLngValue = [21.0235, 105.8156]

const pinIcon = L.divIcon({
  className: '',
  html: '<div class="map-pin"></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34]
})

class MapBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { console.error('MAP ERROR:', error) }
  render() {
    if (this.state.failed) {
      return (
        <div className="grid h-full min-h-80 place-items-center rounded-xl border bg-slate-100 p-6 text-center text-sm text-slate-600">
          <div>
            <div className="text-base font-black text-slate-800">Không tải được bản đồ tương tác</div>
            <div className="mt-2">Hãy kiểm tra Internet rồi tải lại trang. Tọa độ đơn hàng vẫn được lưu nếu bạn đã chọn vị trí.</div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function MapSizer({ target }: { target: LatLngValue | null }) {
  const map = useMap()

  useEffect(() => {
    const refresh = () => map.invalidateSize()
    const t1 = window.setTimeout(refresh, 50)
    const t2 = window.setTimeout(refresh, 350)

    let observer: ResizeObserver | null = null
    const container = map.getContainer()
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(refresh)
      observer.observe(container)
    }

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      observer?.disconnect()
    }
  }, [map])

  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 17), { animate: true, duration: 0.6 })
    }
  }, [map, target?.[0], target?.[1]])

  return null
}

function PickerEvents({
  value,
  onChange,
  accuracy
}: {
  value: LatLngValue | null
  onChange: (value: LatLngValue) => void
  accuracy?: number | null
}) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng])
    }
  })

  if (!value) return null

  return (
    <>
      {accuracy && accuracy > 0 && <Circle center={value} radius={accuracy} pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.12, weight: 1.5 }}/>} 
      <Marker
        position={value}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend(event) {
            const marker = event.target as L.Marker
            const next = marker.getLatLng()
            onChange([next.lat, next.lng])
          }
        }}
      />
    </>
  )
}

export function MapPicker({
  value,
  onChange,
  accuracy
}: {
  value: LatLngValue | null
  onChange: (value: LatLngValue) => void
  accuracy?: number | null
}) {
  const [tileError, setTileError] = useState(false)
  const center = value ?? DEFAULT_CENTER

  return (
    <MapBoundary>
      <div className="relative h-80 overflow-hidden rounded-xl border bg-slate-100">
        <MapContainer
          center={center}
          zoom={value ? 17 : 13}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <MapSizer target={value}/>
          <TileLayer
  attribution='Tiles &copy; Esri'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
  eventHandlers={{
    tileerror() { setTileError(true) },
    load() { setTileError(false) }
  }}
/>
          <PickerEvents value={value} onChange={onChange} accuracy={accuracy}/>
        </MapContainer>

        {!value && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-700 shadow">
            Bấm vào bản đồ hoặc dùng vị trí hiện tại
          </div>
        )}

        {tileError && (
          <div className="absolute inset-x-3 bottom-3 z-[600] rounded-xl border border-amber-200 bg-amber-50/95 p-3 text-xs font-semibold text-amber-800 shadow">
            Không tải được ảnh nền bản đồ. Kiểm tra kết nối Internet rồi thử lại.
          </div>
        )}
      </div>
    </MapBoundary>
  )
}

export function LocationMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const center: LatLngValue = [latitude, longitude]
  const [tileError, setTileError] = useState(false)

  return (
    <MapBoundary>
      <div className="relative h-72 overflow-hidden rounded-xl border bg-slate-100">
        <MapContainer center={center} zoom={17} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <MapSizer target={center}/>
          <TileLayer
  attribution='Tiles &copy; Esri'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
  eventHandlers={{
    tileerror() { setTileError(true) },
    load() { setTileError(false) }
  }}
/>
          <Marker position={center} icon={pinIcon}/>
        </MapContainer>

        {tileError && (
          <div className="absolute inset-x-3 bottom-3 z-[600] rounded-xl border border-amber-200 bg-amber-50/95 p-3 text-xs font-semibold text-amber-800 shadow">
            Không tải được lớp bản đồ. Bạn vẫn có thể bấm “Chỉ đường tới vị trí khách hàng”.
          </div>
        )}
      </div>
    </MapBoundary>
  )
}
