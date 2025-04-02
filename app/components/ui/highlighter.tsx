'use client';

import { useEffect, useRef, useState } from 'react';

interface Circle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

interface HighlighterProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

interface HighlightGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface HighlighterItemProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

interface ParticlesProps {
  className?: string;
  color?: string;
  quantity?: number;
}

export function Highlighter({
  children,
  className = '',
  color = 'rgba(255, 182, 71, 0.3)', // Amber color by default
}: HighlighterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const circlesRef = useRef<Circle[]>([]); // Store circles in ref to avoid constant rerenders

  useEffect(() => {
    circlesRef.current = circles; // Initialize ref with current state
  }, [circles]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        
        // Update circles in ref without state update
        circlesRef.current = circlesRef.current
          .map(circle => ({
            ...circle,
            radius: circle.radius + deltaTime * 0.1,
            opacity: Math.max(0, circle.opacity - deltaTime * 0.0005)
          }))
          .filter(circle => circle.opacity > 0);
        
        // Update state less frequently (every ~100ms) to avoid infinite rerenders
        if (!requestRef.current || time % 6 === 0) {
          setCircles([...circlesRef.current]);
        }
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []); // Empty dependency array to run only once

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (Math.random() < 0.1) { // Only create new circles 10% of the time
      const newCircle = {
        x,
        y,
        radius: 10,
        opacity: 0.5
      };
      
      // Update the ref directly for animation
      circlesRef.current = [...circlesRef.current, newCircle].slice(-20);
      
      // Then update the state for rendering
      setCircles(prevCircles => [...prevCircles, newCircle].slice(-20));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      style={{ overflow: 'hidden' }}
    >
      <div className="relative z-10">{children}</div>
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        style={{ filter: 'blur(30px)' }}
      >
        {circles.map((circle, i) => (
          <circle
            key={i}
            cx={circle.x}
            cy={circle.y}
            r={circle.radius}
            fill={color}
            opacity={circle.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

export function HighlightGroup({ children, className = '' }: HighlightGroupProps) {
  return (
    <div className={`relative group ${className}`}>
      {children}
    </div>
  );
}

export function HighlighterItem({ children, className = '', color = 'rgba(255, 182, 71, 0.3)' }: HighlighterItemProps) {
  return (
    <Highlighter className={className} color={color}>
      {children}
    </Highlighter>
  );
}

export function Particles({ className = '', color = 'rgba(255, 182, 71, 0.3)', quantity = 20 }: ParticlesProps) {
  const [particles, setParticles] = useState<Circle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Circle[]>([]); // Add a ref to store current particles
  const lastUpdateRef = useRef<number>(0); // Track last update time

  useEffect(() => {
    // Initialize particles
    const newParticles: Circle[] = Array.from({ length: quantity }, () => ({
      x: Math.random() * (containerRef.current?.clientWidth || 100),
      y: Math.random() * (containerRef.current?.clientHeight || 100),
      radius: Math.random() * 4 + 2,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(newParticles);
    particlesRef.current = newParticles; // Store in ref
  }, [quantity]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // Update particles in the ref without triggering state update every frame
        particlesRef.current = particlesRef.current.map(particle => ({
          ...particle,
          x: particle.x + Math.sin(time * 0.001 + particle.y * 0.1) * 0.5,
          y: particle.y + Math.cos(time * 0.001 + particle.x * 0.1) * 0.5,
          opacity: 0.2 + Math.sin(time * 0.001 + particle.x * 0.1) * 0.3,
        }));
        
        // Only update state occasionally (roughly every 100ms)
        const shouldUpdate = time - lastUpdateRef.current > 100;
        if (shouldUpdate) {
          lastUpdateRef.current = time;
          setParticles([...particlesRef.current]);
        }
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []); // Empty dependency array to run only once

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg className="w-full h-full">
        {particles.map((particle, i) => (
          <circle
            key={i}
            cx={particle.x}
            cy={particle.y}
            r={particle.radius}
            fill={color}
            opacity={particle.opacity}
          />
        ))}
      </svg>
    </div>
  );
} 