'use client'

import { useState } from 'react'

export default function Home() {
  const [hoveredButton, setHoveredButton] = useState(null)

  return (
    <>
      {/* Hero Section */}
      <div style={{
        minHeight: '100vh',
        background: '#262626',
        color: '#F3F3F7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#B4D836', 
          fontWeight: 'bold', 
          letterSpacing: '0.3em', 
          marginBottom: '20px',
          animation: 'fadeIn 1s ease-in'
        }}>
          2026 TEXAS HIGH SCHOOL FOOTBALL
        </div>
        
        <h1 style={{
          fontSize: 'clamp(3rem, 15vw, 8rem)',
          fontWeight: '900',
          margin: '0 0 30px 0',
          textTransform: 'uppercase',
          letterSpacing: '-0.05em',
          lineHeight: '0.9',
          animation: 'slideUp 1s ease-out'
        }}>
          <div>Data</div>
          <div style={{ color: '#B4D836' }}>Always</div>
          <div>Wins</div>
        </h1>
        
        <p style={{
          fontSize: 'clamp(1.2rem, 3vw, 2rem)',
          marginBottom: '50px',
          opacity: 0.8,
          maxWidth: '800px',
          animation: 'fadeIn 1.5s ease-in'
        }}>
          Real-Time. Human-Verified. Game-Changing.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          marginBottom: '100px',
          animation: 'fadeIn 2s ease-in'
        }}>
          <button 
            onMouseEnter={() => setHoveredButton('legends')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: '18px 45px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: hoveredButton === 'legends' ? '#9FBE2E' : '#B4D836',
              color: '#262626',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.3s',
              transform: hoveredButton === 'legends' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: hoveredButton === 'legends' ? '0 0 30px rgba(180, 216, 54, 0.5)' : 'none'
            }}>
            Join the Legends Program
          </button>
          
          <button 
            onMouseEnter={() => setHoveredButton('demo')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              padding: '18px 45px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: hoveredButton === 'demo' ? '#F3F3F7' : 'transparent',
              color: hoveredButton === 'demo' ? '#262626' : '#F3F3F7',
              border: '2px solid #F3F3F7',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.3s',
              transform: hoveredButton === 'demo' ? 'scale(1.05)' : 'scale(1)'
            }}>
            Watch Demo
          </button>
        </div>
        
        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          animation: 'bounce 2s infinite'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#B4D836', marginBottom: '10px', letterSpacing: '0.2em' }}>
            SCROLL
          </div>
          <div style={{
            width: '24px',
            height: '40px',
            border: '2px solid #B4D836',
            borderRadius: '12px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '8px'
          }}>
            <div style={{
              width: '4px',
              height: '8px',
              background: '#B4D836',
              borderRadius: '2px',
              animation: 'scrollDot 2s infinite'
            }}></div>
          </div>
        </div>
      </div>

      {/* Stats Comparison */}
      <div style={{
        background: '#1a1a1a',
        padding: '100px 20px',
        color: '#F3F3F7'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '60px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '5rem', 
              fontWeight: '900', 
              color: '#B4D836', 
              marginBottom: '10px',
              transition: 'transform 0.3s'
            }}>5-15</div>
            <div style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Seconds Per Play</div>
            <div style={{ fontSize: '1rem', opacity: 0.5, textDecoration: 'line-through' }}>
              Hudl: 12-24 hours
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '5rem', 
              fontWeight: '900', 
              color: '#B4D836', 
              marginBottom: '10px',
              transition: 'transform 0.3s'
            }}>99.9%</div>
            <div style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Accuracy Rate</div>
            <div style={{ fontSize: '1rem', opacity: 0.5, textDecoration: 'line-through' }}>
              Hudl: 70-80% (AI errors)
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '5rem', 
              fontWeight: '900', 
              color: '#FF3636', 
              marginBottom: '10px',
              transition: 'transform 0.3s'
            }}>$500</div>
            <div style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Legends Forever</div>
            <div style={{ fontSize: '1rem', opacity: 0.5, textDecoration: 'line-through' }}>
              Standard: $2,500/year
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div style={{
        background: '#262626',
        padding: '100px 20px',
        color: '#F3F3F7'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '900',
            textAlign: 'center',
            marginBottom: '80px',
            textTransform: 'uppercase'
          }}>
            Why <span style={{ color: '#FF3636' }}>Hudl</span> Fails
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px'
          }}>
            <div style={{ 
              padding: '40px', 
              background: '#1a1a1a', 
              borderLeft: '4px solid #FF3636',
              transition: 'transform 0.3s',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🐌</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#FF3636' }}>Too Slow</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.8', fontSize: '1.1rem' }}>
                Stats arrive 12-24 hours after the game. Can't make halftime adjustments. Can't scout opponents in real-time.
              </p>
            </div>
            
            <div style={{ 
              padding: '40px', 
              background: '#1a1a1a', 
              borderLeft: '4px solid #FF3636',
              transition: 'transform 0.3s',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🤖</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#FF3636' }}>AI Mistakes</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.8', fontSize: '1.1rem' }}>
                70-80% error rate with AI tracking. Coaches waste hours every Sunday fixing mistakes instead of game planning.
              </p>
            </div>
            
            <div style={{ 
              padding: '40px', 
              background: '#1a1a1a', 
              borderLeft: '4px solid #FF3636',
              transition: 'transform 0.3s',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👻</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#FF3636' }}>No Visibility</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.8', fontSize: '1.1rem' }}>
                98% of players never get recruited. Inaccurate stats mean college scouts can't find talent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #B4D836 0%, #8BA82A 100%)',
        padding: '120px 20px',
        color: '#262626',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          fontWeight: '900',
          marginBottom: '30px',
          textTransform: 'uppercase'
        }}>
          Become a Legend
        </h2>
        
        <p style={{
          fontSize: '1.8rem',
          marginBottom: '40px',
          maxWidth: '900px',
          margin: '0 auto 40px',
          fontWeight: '600'
        }}>
          Only 10 schools get Legends status.<br/>
          Lock in <strong>$500/year forever</strong>.
        </p>
        
        <button style={{
          padding: '25px 60px',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          background: '#262626',
          color: '#B4D836',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          transition: 'all 0.3s'
        }}>
          Apply Now
        </button>
        
        <p style={{
          marginTop: '40px',
          fontSize: '1.1rem',
          opacity: 0.8,
          fontWeight: '600'
        }}>
          DFW Coaches Clinic • January 30 - February 1, 2026
        </p>
      </div>

      {/* Footer */}
      <div style={{
        background: '#0a0a0a',
        padding: '60px 20px',
        color: '#F3F3F7',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#B4D836', marginBottom: '20px' }}>
          StatIQ
        </div>
        <p style={{ opacity: 0.6, marginBottom: '10px', fontSize: '1.1rem' }}>
          Real-Time High School Sports Analytics
        </p>
        <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>
          © 2026 StatIQ, Inc. • Data Always Wins.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes scrollDot {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
      `}</style>
    </>
  )
}
