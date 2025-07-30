export interface LocationInfo {
  name: string
  description: string
  position: google.maps.LatLng
  popup: any
  content: HTMLElement
  time?: string
  duration?: string
  sequence?: number
}

export interface LineInfo {
  poly: google.maps.Polyline
  geodesicPoly: google.maps.Polyline
  name: string
  transport?: string
  travelTime?: string
}

export interface QueryResult {
  locations: LocationInfo[]
  dayPlan: LocationInfo[]
  lines: LineInfo[]
}