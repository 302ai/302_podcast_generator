'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

interface Particle {
  x: number
  y: number
  size: number
  alpha: number
  speed: number
  color: string
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>()
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.offsetWidth
      canvas.height = parent.offsetHeight
    }

    const createParticles = () => {
      const particles: Particle[] = []
      const isDark = theme === 'dark'
      const colors = isDark
        ? ['255, 255, 255']
        : [
            '124, 58, 237',
            '109, 40, 217',
          ]

      for (let i = 0; i < (isDark ? 200 : 150); i++) {
        const color = colors[Math.floor(Math.random() * colors.length)]
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 0.8 + 0.2,
          alpha: Math.random() * (isDark ? 0.3 : 0.25) + (isDark ? 0.1 : 0.15),
          speed: Math.random() * 0.2 + 0.05,
          color
        })
      }
      particlesRef.current = particles
    }

    const drawParticles = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = mouseRef.current.x
      const centerY = mouseRef.current.y
      const isDark = theme === 'dark'

      particlesRef.current.forEach(particle => {
        const dx = centerX - particle.x
        const dy = centerY - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 80
        const influence = Math.max(0, 1 - distance / maxDistance) * 0.5

        particle.x += particle.speed * (1 + influence)
        if (particle.x > canvas.width) {
          particle.x = 0
          particle.y = Math.random() * canvas.height
        }

        ctx.beginPath()
        ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        if (particle.size > 0.5) {
          ctx.beginPath()
          ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha * (isDark ? 0.3 : 0.4)})`
          ctx.arc(particle.x, particle.y, particle.size * (isDark ? 1.5 : 2), 0, Math.PI * 2)
          ctx.fill()
        }
      })

      rafRef.current = requestAnimationFrame(drawParticles)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    resizeCanvas()
    createParticles()
    drawParticles()

    window.addEventListener('resize', resizeCanvas)
    canvas.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [theme])

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  )
}
