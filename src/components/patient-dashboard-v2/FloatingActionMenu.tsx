'use client';

import { useState } from 'react';
import { Plus, Calendar, MessageSquare, Phone, Stethoscope, X } from 'lucide-react';

interface FloatingActionMenuProps {
  onScheduleAppointment?: () => void;
  onMessage?: () => void;
  onCall?: () => void;
  onViewProfile?: () => void;
}

export function FloatingActionMenu({
  onScheduleAppointment,
  onMessage,
  onCall,
  onViewProfile,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Schedule Appointment',
      description: 'Book a new appointment',
      color: 'from-blue-600 to-blue-500',
      onClick: () => {
        onScheduleAppointment?.();
        setIsOpen(false);
      },
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Message Doctor',
      description: 'Send a message',
      color: 'from-purple-600 to-purple-500',
      onClick: () => {
        onMessage?.();
        setIsOpen(false);
      },
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: 'Start Call',
      description: 'Make a video call',
      color: 'from-emerald-600 to-emerald-500',
      onClick: () => {
        onCall?.();
        setIsOpen(false);
      },
    },
    {
      icon: <Stethoscope className="w-5 h-5" />,
      label: 'View Profile',
      description: 'Edit your profile',
      color: 'from-orange-600 to-orange-500',
      onClick: () => {
        onViewProfile?.();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40">
      {/* Menu Items */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-20 dark:bg-black/40 bg-black/20"
            aria-label="Close menu"
          />

          {/* Menu */}
          <div className="absolute bottom-20 right-0 w-80 flex flex-col gap-3 z-30">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`group w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-xl border border-white/20`}
              >
                <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                  {action.icon}
                </div>
                <div className="text-left flex-grow">
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-white/70">{action.description}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-5 h-5 rotate-45"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-4 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-xl ${
          isOpen ? 'rotate-45 from-red-600 to-pink-600' : ''
        }`}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Floating particles effect (subtle animation) */}
      {isOpen && (
        <div className="absolute bottom-6 right-6 w-12 h-12">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                animation: `float ${2 + i * 0.5}s infinite`,
                left: `${Math.cos((i / 3) * Math.PI * 2) * 20}px`,
                top: `${Math.sin((i / 3) * Math.PI * 2) * 20}px`,
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
