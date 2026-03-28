'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Trophy, Clock, Users } from 'lucide-react'

export type TabKey = 'predict' | 'leaderboard' | 'history' | 'room'

interface NavigationProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'predict',     label: 'Predict',     icon: CheckCircle2 },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'history',     label: 'History',     icon: Clock },
  { key: 'room',        label: 'Room',        icon: Users },
]

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="bottom-nav bg-[#0A0A0A] border-t border-[#222]">
      <div className="flex items-stretch safe-bottom max-w-2xl mx-auto w-full px-2">
        {TABS.map((tab) => {
          const active = tab.key === activeTab
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative min-h-[60px] transition-all"
              style={{ color: active ? '#FFFFFF' : '#52525B' }}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute top-0 left-1/4 right-1/4 h-[3px] rounded-b-full bg-white"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div animate={{ y: active ? -2 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                 <Icon size={20} className={active ? "text-white" : "text-[#52525B]"} />
              </motion.div>
              <span className={`text-[10px] font-body uppercase tracking-wider ${active ? 'font-semibold text-white' : 'font-medium text-[#52525B]'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
