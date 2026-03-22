import { useEffect, useState } from 'react'
import '../styles/GEHUAnimation.css'

function GEHUAnimation({ isVisible, onFadeComplete }) {
  const [phase, setPhase] = useState('show') // 'show' -> 'transition' -> done

  useEffect(() => {
    if (isVisible) {
      // Show image for 2s, then start the zoom-into-background transition
      const showTimer = setTimeout(() => {
        setPhase('transition')
      }, 2000)

      // After the transition animation completes, signal parent
      const completeTimer = setTimeout(() => {
        onFadeComplete()
      }, 3200) // 2s show + 1.2s transition

      return () => {
        clearTimeout(showTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isVisible, onFadeComplete])

  return (
    <div className={`gehu-overlay ${phase === 'transition' ? 'zoom-to-bg' : ''}`}>
      <img src="/images/gehu.jpg" alt="GEHU" className="gehu-image" />
      <div className="gehu-logo-overlay">
        <img src="/images/logo.png" alt="IKS GEHU" className="gehu-logo-mark" />
        <h2 className="gehu-logo-text">
          IKS <span>GEHU</span>
        </h2>
      </div>
    </div>
  )
}

export default GEHUAnimation
