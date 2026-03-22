import { useEffect, useRef } from 'react'

const ParticleBackground = ({ count = 50, color = 'rgba(99, 102, 241, 0.35)', className = '' }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    const createParticles = () => {
      particles = []
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.3 - 0.15,
          opacity: Math.random() * 0.5 + 0.1,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }

    const animate = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      particles.forEach((p, i) => {
        p.pulse += 0.02
        p.x += p.speedX
        p.y += p.speedY
        const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse))

        // Wrap around edges
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = color.replace(/[\d.]+\)$/, `${currentOpacity})`)
        ctx.fill()

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x
          const dy = p.y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${0.08 * (1 - dist / 120)})`)
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    resize()
    createParticles()
    animate()
    window.addEventListener('resize', () => { resize(); createParticles() })

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [count, color])

  return (
    <canvas
      ref={canvasRef}
      className={`particle-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}

export default ParticleBackground
