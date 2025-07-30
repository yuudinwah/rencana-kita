import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai'
import { loadGoogleMaps } from '../utils/googleMaps'
import type { LocationInfo, LineInfo, QueryResult } from '../types'

// Global variables (will be managed by the composable)
let map: google.maps.Map
let bounds: google.maps.LatLngBounds
let markers: google.maps.marker.AdvancedMarkerElement[] = []
let lines: LineInfo[] = []
let popUps: LocationInfo[] = []
let Popup: any

// Initialize Google AI
const ai = new GoogleGenAI({
  vertexai: false,
  apiKey: process.env.GEMINI_API_KEY,
})

// Function declarations for AI
const locationFunctionDeclaration: FunctionDeclaration = {
  name: 'location',
  parameters: {
    type: Type.OBJECT,
    description: 'Geographic coordinates of a location.',
    properties: {
      name: {
        type: Type.STRING,
        description: 'Name of the location.',
      },
      description: {
        type: Type.STRING,
        description: 'Description of the location: why is it relevant, details to know.',
      },
      lat: {
        type: Type.STRING,
        description: 'Latitude of the location.',
      },
      lng: {
        type: Type.STRING,
        description: 'Longitude of the location.',
      },
      time: {
        type: Type.STRING,
        description: 'Time of day to visit this location (e.g., "09:00", "14:30").',
      },
      duration: {
        type: Type.STRING,
        description: 'Suggested duration of stay at this location (e.g., "1 hour", "45 minutes").',
      },
      sequence: {
        type: Type.NUMBER,
        description: 'Order in the day itinerary (1 = first stop of the day).',
      },
    },
    required: ['name', 'description', 'lat', 'lng'],
  },
}

const lineFunctionDeclaration: FunctionDeclaration = {
  name: 'line',
  parameters: {
    type: Type.OBJECT,
    description: 'Connection between a start location and an end location.',
    properties: {
      name: {
        type: Type.STRING,
        description: 'Name of the route or connection',
      },
      start: {
        type: Type.OBJECT,
        description: 'Start location of the route',
        properties: {
          lat: {
            type: Type.STRING,
            description: 'Latitude of the start location.',
          },
          lng: {
            type: Type.STRING,
            description: 'Longitude of the start location.',
          },
        },
      },
      end: {
        type: Type.OBJECT,
        description: 'End location of the route',
        properties: {
          lat: {
            type: Type.STRING,
            description: 'Latitude of the end location.',
          },
          lng: {
            type: Type.STRING,
            description: 'Longitude of the end location.',
          },
        },
      },
      transport: {
        type: Type.STRING,
        description: 'Mode of transportation between locations (e.g., "walking", "driving", "public transit").',
      },
      travelTime: {
        type: Type.STRING,
        description: 'Estimated travel time between locations (e.g., "15 minutes", "1 hour").',
      },
    },
    required: ['name', 'start', 'end'],
  },
}

// System instructions
const systemInstructions = `## System Instructions for an Interactive Map Explorer

**Model Persona:** You are a knowledgeable, geographically-aware assistant that provides visual information through maps.
Your primary goal is to answer any location-related query comprehensively, using map-based visualizations.
You can process information about virtually any place, real or fictional, past, present, or future.

**Core Capabilities:**

1. **Geographic Knowledge:** You possess extensive knowledge of:
   * Global locations, landmarks, and attractions
   * Historical sites and their significance
   * Natural wonders and geography
   * Cultural points of interest
   * Travel routes and transportation options

2. **Two Operation Modes:**

   **A. General Explorer Mode** (Default when DAY_PLANNER_MODE is false):
   * Respond to any query by identifying relevant geographic locations
   * Show multiple points of interest related to the query
   * Provide rich descriptions for each location
   * Connect related locations with appropriate paths
   * Focus on information delivery rather than scheduling

   **B. Day Planner Mode** (When DAY_PLANNER_MODE is true):
   * Create detailed day itineraries with:
     * A logical sequence of locations to visit throughout a day (typically 4-6 major stops)
     * Specific times and realistic durations for each location visit
     * Travel routes between locations with appropriate transportation methods
     * A balanced schedule considering travel time, meal breaks, and visit durations
     * Each location must include a 'time' (e.g., "09:00") and 'duration' property
     * Each location must include a 'sequence' number (1, 2, 3, etc.) to indicate order
     * Each line connecting locations should include 'transport' and 'travelTime' properties

**Output Format:**

1. **General Explorer Mode:**
   * Use the "location" function for each relevant point of interest with name, description, lat, lng
   * Use the "line" function to connect related locations if appropriate
   * Provide as many interesting locations as possible (4-8 is ideal)
   * Ensure each location has a meaningful description

2. **Day Planner Mode:**
   * Use the "location" function for each stop with required time, duration, and sequence properties
   * Use the "line" function to connect stops with transport and travelTime properties
   * Structure the day in a logical sequence with realistic timing
   * Include specific details about what to do at each location

**Important Guidelines:**
* For ANY query, always provide geographic data through the location function
* If unsure about a specific location, use your best judgment to provide coordinates
* Never reply with just questions or requests for clarification
* Always attempt to map the information visually, even for complex or abstract queries
* For day plans, create realistic schedules that start no earlier than 8:00am and end by 9:00pm

Remember: In default mode, respond to ANY query by finding relevant locations to display on the map, even if not explicitly about travel or geography. In day planner mode, create structured day itineraries.`;

export async function initializeMap(mapElement: HTMLElement) {
  // Load Google Maps API first
  await loadGoogleMaps()
  
  // Load Google Maps libraries
  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
  const { LatLngBounds } = await google.maps.importLibrary('core') as google.maps.CoreLibrary
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary

  bounds = new LatLngBounds()

  map = new Map(mapElement, {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
    mapId: '4504f8b37365c3d0',
    gestureHandling: 'greedy',
    zoomControl: false,
    cameraControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
  })

  // Define custom Popup class
  Popup = class extends google.maps.OverlayView {
    position: google.maps.LatLng
    containerDiv: HTMLElement

    constructor(position: google.maps.LatLng, content: HTMLElement) {
      super()
      this.position = position
      content.classList.add('popup-bubble')

      this.containerDiv = document.createElement('div')
      this.containerDiv.classList.add('popup-container')
      this.containerDiv.appendChild(content)
      Popup.preventMapHitsAndGesturesFrom(this.containerDiv)
    }

    onAdd() {
      this.getPanes()!.floatPane.appendChild(this.containerDiv)
    }

    onRemove() {
      if (this.containerDiv.parentElement) {
        this.containerDiv.parentElement.removeChild(this.containerDiv)
      }
    }

    draw() {
      const divPosition = this.getProjection()!.fromLatLngToDivPixel(this.position)
      const display = Math.abs(divPosition!.x) < 4000 && Math.abs(divPosition!.y) < 4000 ? 'block' : 'none'

      if (display === 'block') {
        this.containerDiv.style.left = divPosition!.x + 'px'
        this.containerDiv.style.top = divPosition!.y + 'px'
      }

      if (this.containerDiv.style.display !== display) {
        this.containerDiv.style.display = display
      }
    }
  }
}

export async function sendTextQuery(prompt: string, isPlannerMode: boolean): Promise<QueryResult> {
  // Reset state
  restartApp()

  let finalPrompt = prompt
  if (isPlannerMode) {
    finalPrompt = prompt + ' day trip'
  }

  const updatedInstructions = isPlannerMode
    ? systemInstructions.replace('DAY_PLANNER_MODE', 'true')
    : systemInstructions.replace('DAY_PLANNER_MODE', 'false')

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: finalPrompt,
    config: {
      systemInstruction: updatedInstructions,
      temperature: 1,
      tools: [
        {
          functionDeclarations: [
            locationFunctionDeclaration,
            lineFunctionDeclaration,
          ],
        },
      ],
    },
  })

  let text = ''
  let results = false
  const dayPlanItinerary: LocationInfo[] = []

  for await (const chunk of response) {
    const fns = chunk.functionCalls ?? []
    for (const fn of fns) {
      if (fn.name === 'location') {
        const locationInfo = await setPin(fn.args, isPlannerMode)
        if (isPlannerMode && fn.args.time) {
          dayPlanItinerary.push(locationInfo)
        }
        results = true
      }
      if (fn.name === 'line') {
        await setLeg(fn.args, isPlannerMode)
        results = true
      }
    }

    if (chunk.candidates && chunk.candidates.length > 0 && chunk.candidates[0].content && chunk.candidates[0].content.parts) {
      chunk.candidates[0].content.parts.forEach((part) => {
        if (part.text) text += part.text
      })
    } else if (chunk.text) {
      text += chunk.text
    }
  }

  if (!results) {
    throw new Error('Could not generate any results. Try again, or try a different prompt.')
  }

  return {
    locations: popUps,
    dayPlan: dayPlanItinerary,
    lines: lines,
  }
}

async function setPin(args: any, isPlannerMode: boolean): Promise<LocationInfo> {
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary
  
  const point = { lat: Number(args.lat), lng: Number(args.lng) }
  bounds.extend(point)

  const marker = new AdvancedMarkerElement({
    map,
    position: point,
    title: args.name,
  })
  markers.push(marker)
  map.panTo(point)
  map.fitBounds(bounds)

  const content = document.createElement('div')
  let timeInfo = ''
  if (args.time) {
    timeInfo = `<div style="margin-top: 4px; font-size: 12px; color: #2196F3;">
                  <i class="fas fa-clock"></i> ${args.time}
                  ${args.duration ? ` • ${args.duration}` : ''}
                </div>`
  }
  content.innerHTML = `<b>${args.name}</b><br/>${args.description}${timeInfo}`

  const popup = new Popup(new google.maps.LatLng(point), content)

  if (!isPlannerMode) {
    popup.setMap(map)
  }

  const locationInfo: LocationInfo = {
    name: args.name,
    description: args.description,
    position: new google.maps.LatLng(point),
    popup,
    content,
    time: args.time,
    duration: args.duration,
    sequence: args.sequence,
  }

  popUps.push(locationInfo)
  return locationInfo
}

async function setLeg(args: any, isPlannerMode: boolean) {
  const start = { lat: Number(args.start.lat), lng: Number(args.start.lng) }
  const end = { lat: Number(args.end.lat), lng: Number(args.end.lng) }
  
  bounds.extend(start)
  bounds.extend(end)
  map.fitBounds(bounds)

  const polyOptions = {
    strokeOpacity: 0.0,
    strokeWeight: 3,
    map,
  }

  const geodesicPolyOptions: google.maps.PolylineOptions = {
    strokeColor: isPlannerMode ? '#2196F3' : '#CC0099',
    strokeOpacity: 1.0,
    strokeWeight: isPlannerMode ? 4 : 3,
    map,
  }

  if (isPlannerMode) {
    geodesicPolyOptions.icons = [
      {
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
        offset: '0',
        repeat: '15px',
      },
    ]
  }

  const poly = new google.maps.Polyline(polyOptions)
  const geodesicPoly = new google.maps.Polyline(geodesicPolyOptions)

  const path = [start, end]
  poly.setPath(path)
  geodesicPoly.setPath(path)

  const lineInfo: LineInfo = {
    poly,
    geodesicPoly,
    name: args.name,
    transport: args.transport,
    travelTime: args.travelTime,
  }

  lines.push(lineInfo)
}

export function restartApp() {
  bounds = new google.maps.LatLngBounds()

  markers.forEach((marker) => marker.setMap(null))
  markers = []

  lines.forEach((line) => {
    line.poly.setMap(null)
    line.geodesicPoly.setMap(null)
  })
  lines = []

  popUps.forEach((popup) => {
    popup.popup.setMap(null)
    if (popup.content && popup.content.remove) popup.content.remove()
  })
  popUps = []

  return { success: true }
}