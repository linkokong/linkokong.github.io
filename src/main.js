import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import "./global/index.scss";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('SW registered:', registration.scope)
        
        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Check every hour
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              console.log('New version available')
              // Force reload to get new version
              window.location.reload()
            }
          })
        })
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}

createApp(App).mount('#app')
