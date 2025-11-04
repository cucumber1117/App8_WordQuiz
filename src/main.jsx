import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import Home from './home.jsx'

// Use the project App icon (bundled via Vite) as the favicon / apple-touch-icon.
// This ensures the PNG from `src/assets/image/Appicon.png` is included in the build
// and the correct hashed URL is set at runtime.
import appIconUrl from './assets/image/Appicon.png'

// update existing link[rel="icon"] and link[rel="apple-touch-icon"] to point to the bundled asset
try {
  const setHref = (selector, url) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute('href', url)
    else {
      const link = document.createElement('link')
      link.setAttribute('rel', selector.includes('apple') ? 'apple-touch-icon' : 'icon')
      link.setAttribute('href', url)
      document.head.appendChild(link)
    }
  }
  setHref('link[rel="icon"]', appIconUrl)
  setHref('link[rel="apple-touch-icon"]', appIconUrl)
} catch (e) {
  // ignore in environments where document isn't available
  // (e.g., during SSR or certain tests)
  // eslint-disable-next-line no-console
  console.warn('failed to set app icon', e)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Home />
  </StrictMode>,
)
