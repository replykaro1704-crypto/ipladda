'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Trophy, ArrowRight, Code, Sparkles, Activity } from 'lucide-react'

// ─── Hero ─────────────────────────────────────────────────────
function HeroSection() {
  const router = useRouter()
  const [code, setCode] = useState('')

  const handleJoin = () => code.trim().length >= 4 && router.push(`/r/${code.trim()}`)

  return (
    <section className="min-h-screen flex flex-col pt-32 pb-16 page-container">
      
      {/* Badge */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 flex justify-center lg:justify-start">
        <span className="badge badge-live">
          <span className="live-dot" /> IPL 2026 Live
        </span>
      </motion.div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
        {/* Left Column - Copy */}
        <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-medium text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-none tracking-tight text-white mb-6 text-balance max-w-2xl">
            The friction-free <span className="text-[#A1A1AA]">cricket prediction</span> platform.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#A1A1AA] text-lg max-w-md font-body mb-10 leading-relaxed">
            Create a room, share the code, and compete with friends in real-time. No signups, no apps to install.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row w-full max-w-xl gap-4">
            
            <button 
              onClick={() => router.push('/create')}
              className="bg-white text-black font-display font-bold text-lg rounded-full px-8 py-4 cursor-pointer hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shrink-0 shadow-xl shadow-white/10 whitespace-nowrap">
              <Sparkles size={20} strokeWidth={2.5}/> Create Room
            </button>

              <div className="flex flex-1 relative w-full items-center">
                <input
                  className="w-full bg-[#111] border-2 border-[#333] focus:border-[#555] focus:bg-[#1A1A1A] text-white rounded-full pl-6 pr-16 py-4 font-display font-bold text-lg uppercase tracking-widest sm:text-left text-center outline-none transition-all placeholder:text-[#52525B]"
                  placeholder="ROOM CODE"
                  value={code}
                  maxLength={6}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button 
                  onClick={handleJoin}
                  className={`absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-full transition-all 
                    ${code.trim().length >= 4 ? 'bg-white text-black cursor-pointer shadow-md' : 'bg-[#1A1A1A] text-[#52525B] cursor-not-allowed'}`}>
                  <ArrowRight size={20} className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
          </motion.div>
        </div>

        {/* Right Column - Visual Mockup */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="flex-1 w-full max-w-lg relative">
          
          {/* Stylized browser window / app frame */}
          <div className="clean-card p-2 sm:p-4 rounded-3xl relative z-10 overflow-hidden shadow-2xl">
            {/* Window header */}
            <div className="flex items-center gap-2 px-3 py-2 mb-4 border-b border-[rgba(255,255,255,0.05)]">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
              <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
            </div>

            {/* Fake Content */}
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="w-32 h-6 rounded bg-[#222]" />
                <div className="w-16 h-6 rounded-full bg-[#333]" />
              </div>

              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#111]">
                  <div className="w-10 h-10 rounded-full bg-[#222]" />
                  <div className="flex-1">
                    <div className="w-24 h-4 rounded bg-[#333] mb-2" />
                    <div className="w-16 h-3 rounded bg-[#222]" />
                  </div>
                  <div className="w-12 h-6 rounded bg-[#333]" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Subtle glow behind card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white rounded-full blur-[120px] opacity-[0.03] pointer-events-none -z-10" />
        </motion.div>
      </div>

    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────
const features = [
  {
    icon: <Zap size={20} className="text-white" />,
    title: 'Instant Access',
    desc: 'Bypass forms and emails. Share a 6-letter room code and your friends are in. Pure speed.',
  },
  {
    icon: <Activity size={20} className="text-white" />,
    title: 'Real-time Points',
    desc: 'Leaderboards sort automatically. Match points are calculated and distributed instantly.',
  },
  {
    icon: <Trophy size={20} className="text-white" />,
    title: 'Export & Flex',
    desc: 'Generate gorgeous, high-contrast prediction graphics designed perfectly for Instagram Stories.',
  },
]
function Zap(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> }

function FeaturesSection() {
  return (
    <section className="py-24 page-container border-t border-[rgba(255,255,255,0.05)]">
      <div className="mb-16">
        <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight mb-4">Built for performance.</h2>
        <p className="text-[#A1A1AA] text-lg font-body">Everything you need to run a flawless prediction league.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="clean-card !p-8 flex flex-col items-start hover:-translate-y-1 cursor-default">
            
            <div className="w-12 h-12 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#111] flex items-center justify-center mb-6">
              {f.icon}
            </div>
            <h3 className="mb-2 font-display text-xl font-medium tracking-tight text-white">{f.title}</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed font-body">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="page-container py-12 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row justify-between items-center gap-6 text-[#52525B] text-sm font-body">
      <div className="flex items-center gap-2">
        <Code size={16} /> <span>Crafted by Prashant</span>
      </div>
      <div className="flex gap-6">
        <a href="#" className="hover:text-white transition-colors">Twitter</a>
        <a href="#" className="hover:text-white transition-colors flex items-center gap-1">GitHub</a>
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </main>
  )
}
