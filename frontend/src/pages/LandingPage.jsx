import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveRole, roles, roleLabels } from '../utils/roleStorage'
import { useScrollReveal, useTilt, useParallax } from '../hooks/useAnimations'
import ParticleBackground from '../components/ParticleBackground'
import './LandingPage.css'

const slideshowImages = [
  { src: '/images/gehu.jpg', alt: 'Graphic Era Hill University' },
  { src: '/images/GEU.jpg', alt: 'Graphic Era University' },
  { src: '/images/haldwani.webp', alt: 'Haldwani Campus' },
  { src: '/images/bheemtal.webp', alt: 'Bhimtal Campus' },
]

const campuses = [
  { src: '/images/gehu.jpg', alt: 'GEHU Dehradun', link: 'https://gehu.ac.in/dehradun/' },
  { src: '/images/GEU.jpg', alt: 'Graphic Era University', link: 'https://geu.ac.in/' },
  { src: '/images/haldwani.webp', alt: 'GEHU Haldwani', link: 'https://gehu.ac.in/haldwani/' },
  { src: '/images/bheemtal.webp', alt: 'GEHU Bhimtal', link: 'https://gehu.ac.in/bhimtal/' },
]

const stats = [
  { number: '4+', label: 'Campuses' },
  { number: '10K+', label: 'Students' },
  { number: '500+', label: 'Faculty' },
  { number: '50+', label: 'Programs' },
]

const roleGradients = {
  [roles.CAMPUS_IN_CHARGE]: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  [roles.SPOC]: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  [roles.ADMIN_OFFICE]: 'linear-gradient(135deg, #f97316, #f59e0b)',
}

const roleFeatures = {
  [roles.CAMPUS_IN_CHARGE]: ['Events', 'Reports', 'Teams'],
  [roles.SPOC]: ['Coordinate', 'Track', 'Share'],
  [roles.ADMIN_OFFICE]: ['Users', 'Config', 'Audit'],
}

const RoleCard = ({ role, label, description, icon, gradient, features, index, onSelect }) => {
  const tilt = useTilt(18)
  
  return (
    <div
      ref={tilt.ref}
      className="role-card"
      style={{ ...tilt.style, animationDelay: `${index * 0.15}s` }}
      onMouseMove={tilt.handleMouseMove}
      onMouseLeave={tilt.handleMouseLeave}
      onClick={() => onSelect(role)}
    >
      {/* Gradient header strip */}
      <div className="role-card-header" style={{ background: gradient }}>
        <span className="role-card-number">0{index + 1}</span>
        <span className="role-card-icon">{icon}</span>
      </div>
      <div className="role-card-body">
        <h3>{label}</h3>
        <p>{description}</p>
        <div className="role-card-tags">
          {features.map((f, i) => (
            <span key={i} className="role-tag">{f}</span>
          ))}
        </div>
        <button className="btn btn-primary role-card-btn">
          Get Started
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      {/* Animated border glow on hover */}
      <div className="role-card-shine" />
    </div>
  )
}

const LandingPage = () => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const parallax = useParallax(0.15)
  useScrollReveal()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleRoleSelect = (role) => {
    if (saveRole(role)) {
      navigate(`/auth/${role}`)
    }
  }

  return (
    <div className="landing-page">
      {/* ========== HERO WITH PARALLAX ========== */}
      <section className="hero-slideshow" ref={parallax.ref}>
        <div className="slideshow-container" style={{ transform: `translateY(${parallax.offset}px)` }}>
          {slideshowImages.map((img, index) => (
            <div
              key={index}
              className={`slideshow-slide ${index === currentSlide ? 'active' : ''}`}
            >
              <img src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
        <div className="slideshow-overlay" />
        <ParticleBackground count={40} color="rgba(255, 255, 255, 0.5)" />

        <div className="hero-content-over-slideshow">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Indian Knowledge Systems
          </div>
          <h1 className="hero-title">
            Welcome to <br />
            <span className="hero-title-highlight">IKS GEHU Portal</span>
          </h1>
          <p className="hero-subtitle">
            Preserving India's intellectual heritage through innovation — 
            Graphic Era Hill University
          </p>
          <div className="slideshow-indicators">
            {slideshowImages.map((img, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={img.alt}
              />
            ))}
          </div>
          <div className="hero-scroll-hint">
            <div className="scroll-mouse">
              <div className="scroll-wheel" />
            </div>
            <span>Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* ========== STATS STRIP ========== */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ROLE SELECTION ========== */}
      <section className="role-selection">
        <ParticleBackground count={25} color="rgba(99, 102, 241, 0.3)" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-header scroll-reveal">
            <span className="section-label">Get Started</span>
            <h2 className="section-title">Select Your <span className="gradient-text">Role</span></h2>
            <p className="section-subtitle">
              Choose your role to access the appropriate portal and manage your responsibilities
            </p>
          </div>
          <div className="roles-grid stagger-children">
            <RoleCard
              role={roles.CAMPUS_IN_CHARGE}
              label={roleLabels[roles.CAMPUS_IN_CHARGE]}
              description="Manage campus operations, student services, and administrative tasks"
              icon="🏫"
              gradient={roleGradients[roles.CAMPUS_IN_CHARGE]}
              features={roleFeatures[roles.CAMPUS_IN_CHARGE]}
              index={0}
              onSelect={handleRoleSelect}
            />
            <RoleCard
              role={roles.SPOC}
              label={roleLabels[roles.SPOC]}
              description="Single point of contact for coordination and communication"
              icon="👤"
              gradient={roleGradients[roles.SPOC]}
              features={roleFeatures[roles.SPOC]}
              index={1}
              onSelect={handleRoleSelect}
            />
            <RoleCard
              role={roles.ADMIN_OFFICE}
              label={roleLabels[roles.ADMIN_OFFICE]}
              description="Administrative oversight and system management"
              icon="🏢"
              gradient={roleGradients[roles.ADMIN_OFFICE]}
              features={roleFeatures[roles.ADMIN_OFFICE]}
              index={2}
              onSelect={handleRoleSelect}
            />
          </div>
        </div>
      </section>

      {/* ========== PROMO VIDEO SECTION ========== */}
      <section className="video-section">
        <div className="container">
          <div className="section-header scroll-reveal">
            <span className="section-label">Watch</span>
            <h2 className="section-title">Experience Our <span className="gradient-text">Campus</span></h2>
            <p className="section-subtitle">
              Take a virtual tour and discover what makes Graphic Era Hill University special
            </p>
          </div>
          <div className="video-wrapper scroll-reveal">
            <div className="video-container">
              <video
                controls
                playsInline
                preload="metadata"
                poster="/images/gehu.jpg"
              >
                <source src="/videos/main.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CAMPUS GALLERY WITH LINKS ========== */}
      <section className="campus-gallery">
        <div className="container">
          <div className="section-header scroll-reveal">
            <span className="section-label">Our Campuses</span>
            <h2 className="section-title">A Legacy of <span className="gradient-text">Excellence</span></h2>
          </div>
          <div className="gallery-grid">
            {campuses.map((campus, i) => (
              <a
                key={i}
                href={campus.link}
                target="_blank"
                rel="noopener noreferrer"
                className="gallery-item scroll-reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="gallery-image-wrap">
                  <img src={campus.src} alt={campus.alt} className="gallery-img" />
                  <div className="gallery-overlay">
                    <span className="gallery-label">{campus.alt}</span>
                    <span className="gallery-link-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
