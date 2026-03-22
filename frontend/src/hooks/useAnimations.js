import { useEffect, useRef, useState, useCallback } from 'react'

/** Scroll-triggered reveal: call on component mount to observe elements with .scroll-reveal class */
export function useScrollReveal() {
  const observerRef = useRef(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    // Observe all elements with .scroll-reveal
    const revealElements = document.querySelectorAll('.scroll-reveal')
    revealElements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])
}

/** Parallax hook: returns { y } based on scroll position  */
export function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      // Calculate how far the element is from center of viewport
      const elementCenter = rect.top + rect.height / 2
      const viewportCenter = windowHeight / 2
      const distance = elementCenter - viewportCenter
      setOffset(distance * speed)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return { ref, offset }
}

/** Mouse-tracking 3D tilt effect */
export function useTilt(intensity = 15) {
  const ref = useRef(null)
  const [style, setStyle] = useState({})

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({
      transform: `perspective(1000px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease',
    })
  }, [intensity])

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease',
    })
  }, [])

  return { ref, style, handleMouseMove, handleMouseLeave }
}
