import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import type { PageName } from '../context/AppContext.tsx';
import { ArrowLeft, CheckCheck, Bell, Heart, MessageSquare, UserPlus, Mail, ShieldCheck, DollarSign, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase.ts';

interface MockFeedNotif {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc?: string;
  time: string;
  read: boolean;
  linkPage?: PageName;
}

export const NotificationsPage: React.FC = () => {
  const { go, notifications, unreadNotifsCount, markAllNotifsAsRead, markNotifAsRead } = useApp();

  // Notifications par défaut inspirées du modèle d'activité et enrichies par les notifications réelles
  const defaultActivityNotifs: MockFeedNotif[] = [
    {
      id: 'activity-1',
      icon: <Heart className="w-4 h-4 text-red-500 fill-red-500" />,
      iconBg: 'bg-red-50 text-red-500',
      title: 'Jean a aimé votre publication.',
      desc: 'Table en bois massif sur mesure',
      time: 'Il y a 2 min',
      read: false,
      linkPage: 'profile',
    },
    {
      id: 'activity-2',
      icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
      iconBg: 'bg-blue-50 text-blue-500',
      title: 'Awa a commenté votre publication.',
      desc: '« Excellent travail, quel est le délai pour Cocody ? »',
      time: 'Il y a 15 min',
      read: false,
      linkPage: 'profile',
    },
    {
      id: 'activity-3',
      icon: <UserPlus className="w-4 h-4 text-emerald-500" />,
      iconBg: 'bg-emerald-50 text-emerald-500',
      title: 'Koffi a commencé à vous suivre.',
      desc: 'Artisan Pro Afrique Community',
      time: 'Il y a 1h',
      read: false,
      linkPage: 'search',
    },
    {
      id: 'activity-4',
      icon: <Mail className="w-4 h-4 text-purple-500" />,
      iconBg: 'bg-purple-50 text-purple-500',
      title: 'Vous avez reçu un nouveau message.',
      desc: 'Demande de devis pour rénovation électrique',
      time: 'Hier',
      read: true,
      linkPage: 'messages',
    },
    {
      id: 'activity-5',
      icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
      iconBg: 'bg-amber-50 text-amber-600',
      title: 'Votre profil artisan a été vérifié.',
      desc: 'Badge vérifié accordé par l’administration ArtisanPro',
      time: 'Hier',
      read: true,
      linkPage: 'artisan-verification',
    },
    {
      id: 'activity-6',
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: 'Votre demande de monétisation a été acceptée.',
      desc: 'Gains débloqués pour vos vues et réalisations',
      time: 'Il y a 2j',
      read: true,
      linkPage: 'conditions-monetisation',
    },
  ];

  const [supabaseNotifs, setSupabaseNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (!error && data) {
            setSupabaseNotifs(data);
          }
        });
    }
  }, []);

  const handleMarkAllRead = () => {
    markAllNotifsAsRead();
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('notifications')
        .update({ is_read: true })
        .neq('is_read', true)
        .then(({ error }) => {
          if (error) console.warn('Supabase mark all read error:', error);
          else {
            setSupabaseNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
          }
        });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] text-[#111111] pb-24">
      {/* HEADER FIXE */}
      <div className="sticky top-0 bg-white h-14 border-b border-[#E5E7EB] flex items-center justify-between px-4 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => go('home')}
            className="w-9 h-9 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-neutral-800 transition-colors cursor-pointer"
            title="Retour"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h1 className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-tight">
              Notifications
            </h1>
            {unreadNotifsCount > 0 && (
              <span className="bg-[#FF6B00] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadNotifsCount}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-xs sm:text-sm font-bold text-[#FF6B00] hover:text-[#e05e00] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Tout marquer comme lu</span>
        </button>
      </div>

      {/* CONTENU */}
      <div className="max-w-[720px] w-[92%] sm:w-full mx-auto px-2 sm:px-4 py-6 space-y-3">
        {/* Notifications Supabase (si connecté) */}
        {supabaseNotifs.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider px-1 flex items-center justify-between">
              <span>Notifications Supabase</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Synchronisé</span>
            </div>
            {supabaseNotifs.map((sn) => (
              <div
                key={sn.id}
                className={`flex gap-3 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs ${
                  !sn.is_read ? 'border-l-4 border-l-emerald-500 bg-emerald-50/20' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-sm text-neutral-900 leading-snug">{sn.message || sn.type || 'Notification'}</b>
                    <span className="text-[11px] text-[#6B7280] shrink-0 font-mono">
                      {sn.created_at ? new Date(sn.created_at).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications réelles Firestore / AppContext */}
        {notifications.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-1">
              Alertes système &amp; Devis
            </div>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotifAsRead(n.id);
                  if (n.linkPage) go(n.linkPage as PageName);
                }}
                className={`flex gap-3 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs cursor-pointer transition-all hover:border-[#FF6B00]/40 ${
                  !n.read ? 'border-l-4 border-l-[#FF6B00] bg-orange-50/20' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-sm text-neutral-900 leading-snug">{n.title}</b>
                    <span className="text-[11px] text-[#6B7280] shrink-0 font-mono">
                      {new Date(n.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activités sociales et interactions */}
        <div className="space-y-2.5 pt-2">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-1">
            Activités et Communauté
          </div>
          {defaultActivityNotifs.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.linkPage) go(item.linkPage);
              }}
              className={`flex gap-3 p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs cursor-pointer transition-all hover:border-[#FF6B00]/40 ${
                !item.read && unreadNotifsCount > 0
                  ? 'border-l-4 border-l-[#FF6B00] bg-orange-50/15'
                  : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 font-bold`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <b className="text-sm text-neutral-900 leading-snug">{item.title}</b>
                  <span className="text-[11px] text-[#6B7280] shrink-0">{item.time}</span>
                </div>
                {item.desc && (
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">{item.desc}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
