import { useState, useEffect } from 'react'
import '../styles/IntroAnimation.css'

function IntroAnimation({ onComplete }) {
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    const videoElement = document.getElementById('intro-video')
    
    if (videoElement) {
      const handleVideoEnd = () => {
        setShowIntro(false)
        onComplete()
      }

      videoElement.addEventListener('ended', handleVideoEnd)

      // Skip intro after 10 seconds if video doesn't end
      const skipTimer = setTimeout(() => {
        if (showIntro) {
          setShowIntro(false)
          onComplete()
        }
      }, 10000)

      return () => {
        videoElement.removeEventListener('ended', handleVideoEnd)
        clearTimeout(skipTimer)
      }
    }
  }, [showIntro, onComplete])

  const handleSkip = () => {
    setShowIntro(false)
    onComplete()
  }

  if (!showIntro) {
    return null
  }

  return (
    <div className="intro-container">
      <video
        id="intro-video"
        className="intro-video"
        autoPlay
        muted
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <button className="skip-button" onClick={handleSkip}>
        Skip
      </button>
    </div>
  )
}

export default IntroAnimation
