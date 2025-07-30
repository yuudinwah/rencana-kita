<template>
  <div id="app">
    <!-- Main container for the map and related UI elements -->
    <div id="map-container" class="map-container" :class="{ 'map-container-shifted': timelineVisible && !isMobile }">
      <div id="map" ref="mapRef"></div>

      <!-- Container for search elements positioned at the top -->
      <div class="search-container">
        <!-- Toggle switch for enabling/disabling Day Planner Mode -->
        <div class="mode-toggle">
          <label class="switch">
            <input 
              type="checkbox" 
              id="planner-mode-toggle" 
              v-model="isPlannerMode"
              @change="onPlannerModeChange"
            />
            <span class="slider round"></span>
          </label>
          <span class="mode-label">Day Planner Mode</span>
        </div>

        <div class="search-bar">
          <i class="fas fa-search search-icon"></i>
          <textarea
            id="prompt-input"
            v-model="promptText"
            :placeholder="promptPlaceholder"
            @keydown="onPromptKeydown"
          ></textarea>
          <button 
            id="generate" 
            class="search-button"
            :class="{ loading: isGenerating }"
            @click="handleGenerate"
          >
            <i class="fas fa-arrow-right"></i>
            <div class="spinner"></div>
          </button>
        </div>

        <div class="error" id="error-message" v-if="errorMessage">{{ errorMessage }}</div>
      </div>

      <!-- Carousel for displaying location cards at the bottom -->
      <div class="card-carousel" v-show="locations.length > 0">
        <div class="card-container" id="card-container" ref="cardContainer">
          <div 
            v-for="(location, index) in locations" 
            :key="index"
            class="location-card"
            :class="{ 'card-active': index === activeCardIndex, 'day-planner-card': isPlannerMode }"
            @click="selectCard(index)"
          >
            <div class="card-image" :style="{ backgroundImage: `url('${getPlaceholderImage(location.name)}')` }"></div>
            
            <div v-if="isPlannerMode && location.sequence" class="card-sequence-badge">{{ location.sequence }}</div>
            <div v-if="isPlannerMode && location.time" class="card-time-badge">{{ location.time }}</div>
            
            <div class="card-content">
              <h3 class="card-title">{{ location.name }}</h3>
              <p class="card-description">{{ location.description }}</p>
              <div v-if="isPlannerMode && location.duration" class="card-duration">{{ location.duration }}</div>
              <div class="card-coordinates">
                {{ location.position.lat().toFixed(5) }}, {{ location.position.lng().toFixed(5) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="carousel-controls">
          <button class="carousel-arrow prev" @click="navigateCards(-1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="carousel-indicators">
            <div 
              v-for="(location, index) in locations" 
              :key="index"
              class="carousel-dot"
              :class="{ active: index === activeCardIndex }"
            ></div>
          </div>
          <button class="carousel-arrow next" @click="navigateCards(1)">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Button to reset the map and clear current results -->
      <button id="reset" class="reset-button" @click="restart">
        <i class="fas fa-undo"></i>
      </button>
    </div>

    <!-- Semi-transparent overlay displayed when timeline is open on mobile -->
    <div 
      class="map-overlay" 
      :class="{ visible: timelineVisible && isMobile }"
      @click="hideTimeline"
    ></div>

    <!-- Sliding panel for displaying the day plan timeline -->
    <div 
      class="timeline-container" 
      :class="{ visible: timelineVisible }"
      :style="{ display: timelineVisible ? 'block' : 'none' }"
    >
      <!-- Button to toggle timeline visibility on mobile -->
      <button class="timeline-toggle" @click="showTimeline">
        <i class="fas fa-calendar-alt"></i>
      </button>

      <div class="timeline-header">
        <h3>Your Day Plan</h3>
        <div class="timeline-actions">
          <button class="export-button" @click="exportDayPlan">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="close-button" @click="hideTimeline">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="timeline" id="timeline">
        <template v-for="(item, index) in sortedDayPlan" :key="index">
          <!-- Location Timeline Item -->
          <div class="timeline-item">
            <div class="timeline-time">{{ item.time || 'Flexible' }}</div>
            <div class="timeline-connector">
              <div class="timeline-dot"></div>
              <div class="timeline-line"></div>
            </div>
            <div 
              class="timeline-content" 
              :class="{ active: getLocationIndex(item.name) === activeCardIndex }"
              @click="selectLocationByName(item.name)"
            >
              <div class="timeline-title">{{ item.name }}</div>
              <div class="timeline-description">{{ item.description }}</div>
              <div v-if="item.duration" class="timeline-duration">
                <i class="fas fa-clock"></i> {{ item.duration }}
              </div>
            </div>
          </div>

          <!-- Travel Timeline Item -->
          <div 
            v-if="index < sortedDayPlan.length - 1 && getTravelInfo(index)"
            class="timeline-item transport-item"
          >
            <div class="timeline-time">{{ getEstimatedTravelTime(index) }}</div>
            <div class="timeline-connector">
              <div class="timeline-dot transport-dot"></div>
              <div class="timeline-line"></div>
            </div>
            <div class="timeline-content transport">
              <div class="timeline-title">
                <i :class="getTransportIconClass(getTravelInfo(index)?.transport)"></i>
                {{ getTravelInfo(index)?.transport || 'Travel' }}
              </div>
              <div class="timeline-description">{{ getTravelInfo(index)?.name || 'To next location' }}</div>
              <div v-if="getTravelInfo(index)?.travelTime" class="timeline-duration travel-time">
                <i class="fas fa-route"></i> {{ getTravelInfo(index)?.travelTime }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-show="isLoading" class="spinner"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { initializeMap, sendTextQuery, restartApp } from './composables/useMapExplorer'
import type { LocationInfo } from './types'

// Reactive state
const mapRef = ref<HTMLElement>()
const cardContainer = ref<HTMLElement>()
const promptText = ref('')
const isPlannerMode = ref(false)
const isGenerating = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const activeCardIndex = ref(0)
const timelineVisible = ref(false)
const isMobile = ref(false)

// Location and route data
const locations = ref<LocationInfo[]>([])
const dayPlanItinerary = ref<LocationInfo[]>([])
const travelRoutes = ref<any[]>([])

// Computed properties
const promptPlaceholder = computed(() => 
  isPlannerMode.value 
    ? "Create a day plan in... (e.g. 'Plan a day exploring Central Park' or 'One day in Paris')"
    : 'Explore places, history, events, or ask about any location...'
)

const sortedDayPlan = computed(() => 
  [...dayPlanItinerary.value].sort((a, b) => 
    (a.sequence || Infinity) - (b.sequence || Infinity) ||
    (a.time || '').localeCompare(b.time || '')
  )
)

// Methods
const onPlannerModeChange = () => {
  if (!isPlannerMode.value && timelineVisible.value) {
    hideTimeline()
  }
}

const onPromptKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    e.stopPropagation()
    handleGenerate()
  }
}

const handleGenerate = async () => {
  if (!promptText.value.trim()) return
  
  isGenerating.value = true
  errorMessage.value = ''
  
  try {
    const result = await sendTextQuery(promptText.value, isPlannerMode.value)
    locations.value = result.locations
    dayPlanItinerary.value = result.dayPlan
    travelRoutes.value = result.lines
    
    if (isPlannerMode.value && dayPlanItinerary.value.length > 0) {
      showTimeline()
    }
    
    promptText.value = ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred'
  } finally {
    isGenerating.value = false
  }
}

const restart = () => {
  const result = restartApp()
  locations.value = []
  dayPlanItinerary.value = []
  travelRoutes.value = []
  activeCardIndex.value = 0
  hideTimeline()
}

const selectCard = (index: number) => {
  activeCardIndex.value = index
  // Map pan logic will be handled in the composable
}

const navigateCards = (direction: number) => {
  const newIndex = activeCardIndex.value + direction
  if (newIndex >= 0 && newIndex < locations.value.length) {
    selectCard(newIndex)
  }
}

const showTimeline = () => {
  timelineVisible.value = true
  // Layout adjustment logic will be handled with CSS and watchers
}

const hideTimeline = () => {
  timelineVisible.value = false
}

const selectLocationByName = (name: string) => {
  const index = locations.value.findIndex(loc => loc.name === name)
  if (index !== -1) {
    selectCard(index)
  }
}

const getLocationIndex = (name: string) => {
  return locations.value.findIndex(loc => loc.name === name)
}

const getPlaceholderImage = (locationName: string): string => {
  let hash = 0
  for (let i = 0; i < locationName.length; i++) {
    hash = locationName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  const saturation = 60 + (hash % 30)
  const lightness = 50 + (hash % 20)
  const letter = locationName.charAt(0).toUpperCase() || '?'

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">
      <rect width="300" height="180" fill="hsl(${hue}, ${saturation}%, ${lightness}%)" />
      <text x="150" y="95" font-family="Arial, sans-serif" font-size="72" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text>
    </svg>
  `)}`
}

const getTravelInfo = (index: number) => {
  if (!travelRoutes.value.length || index >= sortedDayPlan.value.length - 1) return null
  
  const currentLocation = sortedDayPlan.value[index]
  const nextLocation = sortedDayPlan.value[index + 1]
  
  return travelRoutes.value.find(route => 
    route.name.includes(currentLocation.name) || 
    route.name.includes(nextLocation.name) ||
    route.name.toLowerCase().includes('to')
  )
}

const getEstimatedTravelTime = (index: number) => {
  const travelInfo = getTravelInfo(index)
  if (!travelInfo?.travelTime) return ''
  
  // Calculate estimated time based on current location end time
  const currentLocation = sortedDayPlan.value[index]
  if (!currentLocation.time || !currentLocation.duration) return ''
  
  try {
    const [hours, minutes] = currentLocation.time.split(':').map(Number)
    const durationMatch = currentLocation.duration.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60
    
    const endTime = new Date()
    endTime.setHours(hours, minutes + durationMinutes, 0, 0)
    
    return `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return ''
  }
}

const getTransportIconClass = (transport?: string) => {
  if (!transport) return 'fas fa-route'
  
  const type = transport.toLowerCase()
  if (type.includes('walk')) return 'fas fa-walking'
  if (type.includes('car') || type.includes('driv')) return 'fas fa-car-side'
  if (type.includes('bus') || type.includes('transit') || type.includes('public')) return 'fas fa-bus-alt'
  if (type.includes('train') || type.includes('subway') || type.includes('metro')) return 'fas fa-train'
  if (type.includes('bike') || type.includes('cycl')) return 'fas fa-bicycle'
  if (type.includes('taxi') || type.includes('cab')) return 'fas fa-taxi'
  if (type.includes('boat') || type.includes('ferry')) return 'fas fa-ship'
  if (type.includes('plane') || type.includes('fly')) return 'fas fa-plane-departure'
  return 'fas fa-route'
}

const exportDayPlan = () => {
  if (!dayPlanItinerary.value.length) return
  
  let content = '# Your Day Plan\n\n'
  
  sortedDayPlan.value.forEach((item, index) => {
    content += `## ${index + 1}. ${item.name}\n`
    content += `Time: ${item.time || 'Flexible'}\n`
    if (item.duration) content += `Duration: ${item.duration}\n`
    content += `\n${item.description}\n\n`
    
    // Add travel info
    if (index < sortedDayPlan.value.length - 1) {
      const travelInfo = getTravelInfo(index)
      if (travelInfo) {
        const nextItem = sortedDayPlan.value[index + 1]
        content += `### Travel to ${nextItem.name}\n`
        content += `Method: ${travelInfo.transport || 'Not specified'}\n`
        if (travelInfo.travelTime) content += `Time: ${travelInfo.travelTime}\n`
        content += `\n`
      }
    }
  })
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'day-plan.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
  // Check if mobile
  isMobile.value = window.innerWidth <= 768
  
  // Initialize map
  await nextTick()
  if (mapRef.value) {
    await initializeMap(mapRef.value)
  }
  
  // Add resize listener
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
  })
})
</script>