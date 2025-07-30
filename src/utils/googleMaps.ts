let isGoogleMapsLoaded = false
let googleMapsPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (isGoogleMapsLoaded) {
    return Promise.resolve()
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      reject(new Error('Google Maps API key is not configured'))
      return
    }

    // Google Maps loader function
    const loadScript = () => {
      const script = document.createElement('script')
      const params = new URLSearchParams({
        key: apiKey,
        v: 'weekly',
        libraries: 'maps,marker,core'
      })
      
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        isGoogleMapsLoaded = true
        resolve()
      }
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'))
      }
      
      document.head.appendChild(script)
    }

    // Check if Google Maps is already loading or loaded
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true
      resolve()
    } else {
      loadScript()
    }
  })

  return googleMapsPromise
}

// Type declarations for Google Maps
declare global {
  interface Window {
    google: typeof google
  }
}