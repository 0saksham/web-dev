import { useEffect } from 'react'
import { useScrollReveal, useParallax } from '../hooks/useAnimations'
import ParticleBackground from '../components/ParticleBackground'
import './About.css'

const About = () => {
  useScrollReveal()
  const parallax = useParallax(0.2)

  return (
    <div className="about-page">
      {/* Hero Banner */}
      <section className="about-hero" ref={parallax.ref}>
        <div className="about-hero-bg" style={{ transform: `translateY(${parallax.offset}px)` }}>
          <img src="/images/gehu.jpg" alt="GEHU Campus" />
        </div>
        <div className="about-hero-overlay" />
        <ParticleBackground count={20} color="rgba(255, 255, 255, 0.35)" />
        <div className="about-hero-content">
          <span className="section-label" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
            About Us
          </span>
          <h1>About <span className="hero-title-highlight">IKS GEHU</span></h1>
          <p>Excellence in Education Since Our Inception</p>
        </div>
      </section>

      {/* Content */}
      <div className="container">
        <section className="about-content">
          <div className="about-section scroll-reveal">
            <div className="about-icon-wrap">🎯</div>
            <h2>Our Mission</h2>
            <p>
              IKS GEHU is dedicated to providing world-class education that 
              empowers students to achieve their full potential. We foster innovation, 
              critical thinking, and global citizenship through our comprehensive 
              academic programs and research initiatives.
            </p>
          </div>

          <div className="about-section scroll-reveal">
            <div className="about-icon-wrap">🔭</div>
            <h2>Our Vision</h2>
            <p>
              To be a leading institution of higher learning recognized globally for 
              academic excellence, innovative research, and positive societal impact. 
              We strive to create an environment where students can thrive academically 
              and personally.
            </p>
          </div>

          <div className="about-section scroll-reveal">
            <div className="about-icon-wrap">💎</div>
            <h2>Our Values</h2>
            <div className="values-grid">
              {[
                { icon: '⭐', title: 'Excellence', desc: 'We maintain the highest standards in all our endeavors.' },
                { icon: '🤝', title: 'Integrity', desc: 'We conduct ourselves with honesty and ethical principles.' },
                { icon: '💡', title: 'Innovation', desc: 'We embrace new ideas and creative solutions.' },
                { icon: '🌍', title: 'Diversity', desc: 'We celebrate diverse perspectives and backgrounds.' },
                { icon: '❤️', title: 'Community', desc: 'We foster a supportive and inclusive environment.' },
              ].map((v, i) => (
                <div key={i} className="value-card scroll-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                  <span className="value-icon">{v.icon}</span>
                  <strong>{v.title}</strong>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About


