import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import IntroAnimation from './components/IntroAnimation'
import GEHUAnimation from './components/GEHUAnimation'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import About from './pages/About'
import Contact from './pages/Contact'
import IKSPage from './pages/IKSPage'
import './styles/Animations.css'

function App() {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('introShown')
  })

  const [showGEHU, setShowGEHU] = useState(false)

  const handleIntroComplete = () => {
    setShowIntro(false)
    setShowGEHU(true)
    sessionStorage.setItem('introShown', 'true')
  }

  const handleGEHUFadeComplete = () => {
    setShowGEHU(false)
  }

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      {showGEHU && <GEHUAnimation isVisible={showGEHU} onFadeComplete={handleGEHUFadeComplete} />}
      {/* Render layout underneath the GEHU overlay so it transitions seamlessly */}
      {!showIntro && (
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/:roleType" element={<AuthPage />} />
            <Route path="/register/:roleType" element={<RegisterPage />} />
            <Route path="/dashboard/:roleType" element={<Dashboard />} />
            <Route path="/iks" element={<IKSPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
      )}
    </>
  )
}

export default App
