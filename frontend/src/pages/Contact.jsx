import { useState } from 'react'
import { useScrollReveal, useParallax } from '../hooks/useAnimations'
import ParticleBackground from '../components/ParticleBackground'
import './Contact.css'

const Contact = () => {
  useScrollReveal()
  const parallax = useParallax(0.2)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    
    try {
      const response = await fetch('https://iks-backend-sq2b.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
    
    setTimeout(() => setStatus(''), 5000)
  }

  return (
    <div className="contact-page">
      {/* Hero Banner */}
      <section className="contact-hero" ref={parallax.ref}>
        <div className="contact-hero-bg" style={{ transform: `translateY(${parallax.offset}px)` }}>
          <img src="/images/GEU.jpg" alt="GEU Campus" />
        </div>
        <div className="contact-hero-overlay" />
        <ParticleBackground count={20} color="rgba(255, 255, 255, 0.35)" />
        <div className="contact-hero-content">
          <span className="section-label" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
            Get In Touch
          </span>
          <h1>Contact <span className="hero-title-highlight">Us</span></h1>
          <p>We'd love to hear from you</p>
        </div>
      </section>

      <div className="container">
        <div className="contact-content">
          <div className="contact-info">
            {[
              { icon: 'ðŸ“', title: 'Address', desc: 'Graphic Era Hill University, Dehradun, Uttarakhand' },
              { icon: 'ðŸ“§', title: 'Email', desc: 'iks@gehu.ac.in' },
              { icon: 'ðŸ“ž', title: 'Phone', desc: '+91 135 269 8000' },
            ].map((item, i) => (
              <div key={i} className="info-card scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="info-icon-wrap">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <form className="contact-form glass-card scroll-reveal" onSubmit={handleSubmit}>
            <h3 className="form-title">Send a Message</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="What's this about?" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows="5" value={formData.message} onChange={handleChange} placeholder="Tell us more..." required></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send Message'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
            {status === 'success' && <p className="form-status success">âœ… Message sent successfully!</p>}
            {status === 'error' && <p className="form-status error">âŒ Failed to send message. Please try again.</p>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Contact



