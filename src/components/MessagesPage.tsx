import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  Phone,
  Video,
  FileText,
  ArrowLeft,
  X,
  Search,
  CheckCheck,
  Sparkles,
  MessageSquare,
  Star,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useLang } from '../LangContext.tsx';
import { api } from '../services/api.ts';
import { firestoreService } from '../services/firestoreService.ts';
import type { Message } from '../types.ts';
import { VoipCallModal } from './VoipCallModal.tsx';
import { RateArtisanModal } from './Modals/RateArtisanModal.tsx';

export default function Messages() {
  const { t: tLang, lang, changeLang } = useLang();
  const {
    artisans,
    selectedArtisanId,
    setSelectedArtisanId,
    currentUser,
    quoteModal,
    paymentModal,
    showToast,
    go,
    langueActuelle,
    changerLangue,
    t: tApp,
  } = useApp();

  const t = tLang || tApp;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callModalMode, setCallModalMode] = useState<'audio' | 'video'>('audio');
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [viewingStatus, setViewingStatus] = useState<{
    name: string;
    letter: string;
    color: string;
    time?: string;
    image?: string;
    previewText?: string;
  } | null>(null);
  const statusFileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Active artisan
  const activeArtisan = selectedArtisanId
    ? artisans.find((a) => a.id === selectedArtisanId) || artisans[0]
    : artisans[0];

  const handleInitiateCall = (mode: 'audio' | 'video') => {
    if (!activeArtisan) return;
    setCallModalMode(mode);
    setCallModalOpen(true);
  };

  const handleCallEnded = async (
    type: 'audio' | 'video',
    durationSeconds: number,
    formattedDuration: string,
    status: 'completed' | 'missed'
  ) => {
    // 1. Retour automatique au chat : Ferme l'écran d'appel
    setCallModalOpen(false);
    if (!activeArtisan) return;

    const isClientSender = currentUser?.role !== 'artisan';
    const senderRole = isClientSender ? 'client' : 'artisan';
    const senderId = currentUser?.id || 'client-user';
    const senderName = currentUser?.name || 'Client';

    const isCompleted = status === 'completed' && durationSeconds > 0;
    
    // Exact requested format:
    // 📞 Appel vocal terminé • 00:13
    // Appel VoIP sécurisé - Numéros masqués
    // Si manqué : 📞 Appel vocal manqué
    const callText = isCompleted
      ? `${type === 'video' ? '📹 Appel vidéo terminé' : '📞 Appel vocal terminé'} • ${formattedDuration}`
      : `${type === 'video' ? '📹 Appel vidéo manqué' : '📞 Appel vocal manqué'}`;

    try {
      // 2. Message système dans le chat (style WhatsApp)
      const sent = await api.sendMessage({
        artisanId: activeArtisan.id,
        clientId: isClientSender ? senderId : 'client-user',
        text: callText,
        senderId,
        senderName,
        senderRole,
        callInfo: {
          type,
          durationSeconds,
          formattedDuration: isCompleted ? formattedDuration : '00:00',
          status,
          subtext: 'Appel VoIP sécurisé - Numéros masqués',
        },
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      // 4. Sauvegarde dans l'historique d'appels de l'artisan
      await api.recordCall({
        artisanId: activeArtisan.id,
        clientId: isClientSender ? senderId : 'client-user',
        clientName: senderName,
        type,
        durationSeconds,
        formattedDuration: isCompleted ? formattedDuration : '00:00',
        status,
        timestamp: new Date().toISOString(),
        subtext: 'Appel VoIP sécurisé - Numéros masqués',
      });

      // 5. Notification push si appel manqué
      if (status === 'missed') {
        const notifBody = `Vous avez un appel manqué de ${senderName}`;
        try {
          await api.sendNotification({
            title: 'Appel manqué',
            message: notifBody,
            type: 'call_missed',
            linkPage: 'messages',
          });
        } catch (e) {
          console.warn('sendNotification fallback:', e);
        }

        showToast({
          title: '📞 Appel manqué',
          desc: `Notification push transmise à ${activeArtisan.name} : "${notifBody}"`,
          type: 'info',
        });
      } else {
        showToast({
          title: 'Appel terminé',
          desc: `${type === 'video' ? 'Appel vidéo' : 'Appel vocal'} : ${formattedDuration}`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Erreur journalisation appel:', err);
    }
  };

  // If selectedArtisanId is provided or changes, open mobile chat view
  useEffect(() => {
    if (selectedArtisanId) {
      setMobileChatOpen(true);
    }
  }, [selectedArtisanId]);

  // Load stored messages
  const loadMessages = async () => {
    try {
      const allMsgs = await api.getMessages();
      setMessages((prev) => {
        const map = new Map<string, Message>();
        for (const m of allMsgs) {
          if (m.id) map.set(m.id, m);
        }
        for (const m of prev) {
          if (m.id && !map.has(m.id)) map.set(m.id, m);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    loadMessages();
    const unsub = firestoreService.onMessagesChange((liveMsgs) => {
      if (liveMsgs) {
        setMessages((prev) => {
          const map = new Map<string, Message>();
          for (const m of prev) {
            if (m.id) map.set(m.id, m);
          }
          for (const m of liveMsgs) {
            if (m.id) map.set(m.id, m);
          }
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedArtisanId, mobileChatOpen]);

  // Conversations start completely clean and empty for new chats.
  // Filter messages for current artisan and ensure uniqueness of IDs
  const rawActiveThread = messages.filter((m) => m.artisanId === activeArtisan?.id);
  const seenMsgIds = new Set<string>();
  const activeThread = rawActiveThread.filter((m) => {
    if (!m.id) return true;
    if (seenMsgIds.has(m.id)) return false;
    seenMsgIds.add(m.id);
    return true;
  });

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !activeArtisan) return;

    setIsSending(true);
    setInputText('');

    try {
      const isClientSender = currentUser?.role !== 'artisan';
      const senderRole = isClientSender ? 'client' : 'artisan';
      const senderId = currentUser?.id || 'client-user';
      const senderName = currentUser?.name || 'Client';

      const sent = await api.sendMessage({
        artisanId: activeArtisan.id,
        clientId: isClientSender ? senderId : 'client-user',
        text: textToSend,
        senderId,
        senderName,
        senderRole,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: 'Impossible d’envoyer le message', type: 'warning' });
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setViewingStatus({
        name: currentUser?.name || 'Mon Statut',
        letter: currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'H',
        color: 'bg-[#1a3d2e]',
        time: "À l'instant",
        image: dataUrl,
      });
      showToast({
        title: 'Statut ajouté',
        desc: 'Votre statut est maintenant visible pendant 24h.',
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const quickReplies = [
    'Bonjour, êtes-vous disponible cette semaine ?',
    'Quel est votre tarif estimatif pour ces travaux ?',
    'Pouvez-vous vous déplacer à domicile ?',
  ];

  const openChat = (artisanId: number) => {
    setSelectedArtisanId(artisanId);
    setMobileChatOpen(true);
    const listeEl = document.getElementById('liste');
    const chatEl = document.getElementById('chat');
    if (listeEl) {
      listeEl.classList.add('hidden');
      listeEl.classList.add('md:flex');
    }
    if (chatEl) {
      chatEl.classList.remove('hidden');
      chatEl.classList.add('fixed', 'inset-0', 'z-50', 'flex');
    }
  };

  const closeChat = () => {
    setMobileChatOpen(false);
    const listeEl = document.getElementById('liste');
    const chatEl = document.getElementById('chat');
    if (chatEl) {
      chatEl.classList.add('hidden');
      chatEl.classList.remove('fixed', 'inset-0', 'z-50', 'flex');
    }
    if (listeEl) {
      listeEl.classList.remove('hidden');
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen p-3 flex flex-col h-[100dvh] overflow-hidden select-none">
      {/* CONTENU QUI NE BOUGE PAS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LISTE CONTACTS - FIXE (id="liste") */}
        <div
          id="liste"
          className={`w-full md:w-[35%] bg-[#1e293b] rounded-2xl flex flex-col border border-slate-700/60 overflow-hidden ${
            mobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* TITRE & BOUTONS LANGUE & BOUTONS SORTIE */}
          <div className="p-4 pb-2 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <button
                type="button"
                id="btn-sortir-messagerie"
                onClick={() => go('home')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-yellow-400 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title={t.sortir || t.Sortir || 'Sortir'}
                aria-label={t.sortir || t.Sortir || 'Sortir'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.sortir || t.Sortir || 'Sortir'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    changeLang('fr');
                    changerLangue('fr');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    lang === 'fr'
                      ? 'bg-yellow-400 text-slate-900 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                  title="Français"
                >
                  🇫🇷 Français
                </button>
                <button
                  type="button"
                  onClick={() => {
                    changeLang('en');
                    changerLangue('en');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-yellow-400 text-slate-900 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                  title="English"
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  id="btn-fermer-messagerie"
                  onClick={() => go('home')}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
                  title={t.sortir || 'Sortir'}
                  aria-label={t.sortir || 'Sortir'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="text-yellow-400 text-3xl font-bold">{t.messages}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {t.sousTitre}
            </p>
          </div>

          {/* STATUTS - TOUS GARDÉS, JUSTE CLIQUABLES MAINTENANT */}
          <div className="px-4 py-2 shrink-0">
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
              <h2 className="text-gray-400 text-xs font-bold tracking-wider uppercase">◎ {t.statuts}</h2>
              <div className="flex gap-4 mt-3 overflow-x-auto pb-1 scrollbar-none">
                {/* A */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => statusFileInputRef.current?.click()}
                    className="w-16 h-16 rounded-full bg-[#0d3d24] border-2 border-yellow-400 flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                    title="Ajouter un statut"
                  >
                    A
                  </button>
                  <span className="text-yellow-400 text-xs mt-1 font-medium">{t.ajouter}</span>
                  <input
                    type="file"
                    ref={statusFileInputRef}
                    onChange={handleStatusUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* V */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingStatus({
                        name: 'VS Exchange',
                        letter: 'V',
                        color: 'bg-[#6aa84f]',
                        time: 'Il y a 10 min',
                        previewText: 'Service de transferts et devis express actif 24h/24.',
                      });
                    }}
                    className="w-16 h-16 rounded-full bg-[#6aa84f] border-2 border-yellow-400 flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                    title="Voir le statut de VS Exchange"
                  >
                    V
                  </button>
                  <span className="text-gray-400 text-xs mt-1 truncate max-w-[70px]">VS Excha...</span>
                </div>

                {/* K */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingStatus({
                        name: 'Koffi D.',
                        letter: 'K',
                        color: 'bg-[#6aa84f]',
                        time: 'Il y a 25 min',
                        previewText: 'Sur le chantier à Cocody. Nouveaux créneaux disponibles cette semaine.',
                      });
                    }}
                    className="w-16 h-16 rounded-full bg-[#6aa84f] border-2 border-yellow-400 flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                    title="Voir le statut de Koffi D."
                  >
                    K
                  </button>
                  <span className="text-gray-400 text-xs mt-1 truncate max-w-[70px]">Koffi D...</span>
                </div>

                {/* F */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingStatus({
                        name: 'Fatou',
                        letter: 'F',
                        color: 'bg-[#1e293b]',
                        time: 'Il y a 1h',
                        previewText: 'Atelier de confection et couture africaine ouvert.',
                      });
                    }}
                    className="w-16 h-16 rounded-full bg-[#1e293b] border-2 border-yellow-400 flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                    title="Voir le statut de Fatou"
                  >
                    F
                  </button>
                  <span className="text-gray-400 text-xs mt-1">Fatou</span>
                </div>

                {/* Y */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingStatus({
                        name: 'Yves',
                        letter: 'Y',
                        color: 'bg-[#1e293b]',
                        time: 'Il y a 2h',
                        previewText: 'Menuiserie et ébénisterie sur mesure, devis gratuit.',
                      });
                    }}
                    className="w-16 h-16 rounded-full bg-[#1e293b] border-2 border-yellow-400 flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                    title="Voir le statut de Yves"
                  >
                    Y
                  </button>
                  <span className="text-gray-400 text-xs mt-1">Yves</span>
                </div>

                {/* O */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingStatus({
                        name: 'Ousmane',
                        letter: 'O',
                        color: 'bg-[#1e293b]',
                        time: 'Il y a 3h',
                        previewText: 'Dépannage plomberie et installation sanitaire disponible.',
                      });
                    }}
                    className="w-16 h-16 rounded-full bg-[#1e293b] border-2 border-yellow-400 flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                    title="Voir le statut d'Ousmane"
                  >
                    O
                  </button>
                  <span className="text-gray-400 text-xs mt-1">Ousmane</span>
                </div>

                {/* Artisans en ligne du répertoire */}
                {artisans.slice(0, 4).map((art) => (
                  <div key={art.id} className="flex flex-col items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => openChat(art.id)}
                      className="w-16 h-16 rounded-full bg-slate-800 border-2 border-yellow-400 flex items-center justify-center text-white text-base font-bold shadow-md transition-transform hover:scale-105 cursor-pointer focus:outline-none overflow-hidden"
                      title={`Discuter avec ${art.name}`}
                    >
                      {art.avatarUrl ? (
                        <img src={art.avatarUrl} alt={art.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{art.name.charAt(0).toUpperCase()}</span>
                      )}
                    </button>
                    <span className="text-gray-400 text-xs mt-1 truncate max-w-[70px]">{art.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recherche contacts */}
          <div className="px-4 py-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder={t.recherche}
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 text-xs bg-slate-900/90 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Liste déroulante des conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 px-2">
            {artisans
              .filter((a) =>
                convSearch
                  ? `${a.name} ${a.trade} ${a.city}`.toLowerCase().includes(convSearch.toLowerCase())
                  : true
              )
              .map((art) => {
                const isCurrent = art.id === activeArtisan?.id;
                const artMsgs = messages.filter((m) => m.artisanId === art.id);
                const lastMsg = artMsgs[artMsgs.length - 1];

                return (
                  <button
                    key={art.id}
                    onClick={() => openChat(art.id)}
                    className={`w-full p-3 my-0.5 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-800/90 border-l-4 border-yellow-400 text-white'
                        : 'hover:bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                        {art.avatarUrl ? (
                          <img src={art.avatarUrl} alt={art.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{art.emoji}</span>
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">
                          {art.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {lastMsg
                            ? new Date(lastMsg.timestamp).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-yellow-400 font-medium truncate">{art.trade}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {lastMsg ? lastMsg.text : 'Démarrer une conversation...'}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* CONVERSATION - FIXE (id="chat") */}
        <div
          id="chat"
          className={`flex-1 bg-[#0f172a] flex flex-col h-full overflow-hidden ${
            !mobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header de la conversation en cours avec bouton retour et actions */}
          {activeArtisan && (
            <div className="h-[60px] shrink-0 bg-[#1e293b] px-4 border-b border-slate-700/60 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                {/* Bouton retour : ferme le chat et réaffiche la liste */}
                <button
                  type="button"
                  onClick={closeChat}
                  className="md:hidden w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-yellow-400 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
                  title="← Retour"
                  aria-label="Retour à la liste"
                >
                  ←
                </button>

                <div className="w-10 h-10 rounded-full bg-slate-800 border border-yellow-400/50 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                  {activeArtisan.avatarUrl ? (
                    <img src={activeArtisan.avatarUrl} alt={activeArtisan.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{activeArtisan.emoji}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-white leading-tight">
                      {activeArtisan.name}
                    </h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 font-bold uppercase">
                      {activeArtisan.trade}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>En ligne · {activeArtisan.city}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Icône appel audio */}
                <button
                  type="button"
                  onClick={() => handleInitiateCall('audio')}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-yellow-400 border border-slate-700 flex items-center justify-center cursor-pointer transition-all shadow-xs"
                  title="Appel vocal VoIP sécurisé"
                >
                  <Phone className="w-4 h-4 stroke-[2.3]" />
                </button>

                {/* Icône appel vidéo */}
                <button
                  type="button"
                  onClick={() => handleInitiateCall('video')}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-yellow-400 border border-slate-700 flex items-center justify-center cursor-pointer transition-all shadow-xs"
                  title="Appel vidéo VoIP en direct"
                >
                  <Video className="w-4 h-4 stroke-[2.3]" />
                </button>

                {/* Devis */}
                <button
                  type="button"
                  onClick={() => quoteModal.open(activeArtisan)}
                  className="hidden sm:flex px-3 py-1.5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Devis</span>
                </button>

                {/* Bouton pour sortir directement de la messagerie */}
                <button
                  type="button"
                  id="btn-sortir-chat"
                  onClick={() => go('home')}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 flex items-center justify-center cursor-pointer transition-all shadow-xs ml-0.5"
                  title={t.sortir || t.Sortir || 'Sortir de la messagerie'}
                  aria-label={t.sortir || t.Sortir || 'Sortir de la messagerie'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Suggestions rapides en bandeau fin */}
          <div className="px-3 py-1.5 bg-[#1e293b]/70 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-bold uppercase text-gray-400 shrink-0">Suggestions :</span>
            {quickReplies.map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qr)}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* MESSAGES ICI (flex-1 overflow-y-auto p-4) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f172a]">
            {activeThread.length > 0 ? (
              activeThread.map((m, idx) => {
                const isCallEvent = Boolean(
                  m.callInfo ||
                  m.text.startsWith('📞 Appel') ||
                  m.text.startsWith('📹 Appel')
                );

                if (isCallEvent) {
                  const isVideo = m.callInfo?.type === 'video' || m.text.includes('vidéo');
                  const isMissed = m.callInfo?.status === 'missed' || m.text.includes('manqué');
                  const durationStr = m.callInfo?.formattedDuration || '00:13';

                  return (
                    <div key={m.id || `msg-${idx}`} className="flex flex-col items-center my-3 space-y-2">
                      <div className="px-4 py-2.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-slate-200 shadow-xs max-w-sm w-full sm:w-auto text-center">
                        <div className="flex items-center justify-center gap-2 font-bold text-xs text-white">
                          <span className={isMissed ? 'text-red-400' : 'text-yellow-400'}>
                            {isVideo ? '📹' : '📞'}
                          </span>
                          <span>
                            {isMissed
                              ? (isVideo ? 'Appel vidéo manqué' : 'Appel vocal manqué')
                              : (isVideo
                                  ? `Appel vidéo terminé • ${durationStr}`
                                  : `Appel vocal terminé • ${durationStr}`)}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-gray-400 mt-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-yellow-400 shrink-0" />
                          <span>Appel VoIP sécurisé - Numéros masqués</span>
                          <span>•</span>
                          <span>
                            {new Date(m.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Carte d'actions rapides post-appel */}
                      <div className="w-full max-w-sm bg-slate-800/80 rounded-2xl border border-slate-700 p-3 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-0.5">
                          <span className="flex items-center gap-1.5 text-yellow-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            Suite à votre appel :
                          </span>
                          <button
                            type="button"
                            onClick={() => handleInitiateCall(isVideo ? 'video' : 'audio')}
                            className="text-[11px] text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 cursor-pointer"
                            title="Rappeler"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Rappeler</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setRateModalOpen(true)}
                            className="px-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-yellow-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                          >
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                            <span className="truncate">Noter l'artisan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => activeArtisan && quoteModal.open(activeArtisan)}
                            className="px-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Demander un devis</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              paymentModal.open({
                                customTitle: `Règlement direct · ${activeArtisan?.name}`,
                                customAmount: 15000,
                              })
                            }
                            className="px-2 py-2 rounded-xl bg-green-900/40 hover:bg-green-800/60 border border-green-700/50 text-green-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            <span className="truncate">Payer Wave / MoMo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                const isMine =
                  currentUser?.role === 'artisan'
                    ? m.senderRole === 'artisan' && m.artisanId === currentUser.artisanId
                    : m.senderRole === 'client';

                return (
                  <div
                    key={m.id || `msg-${idx}`}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-0.5 px-1">
                      <span className="font-semibold text-slate-300">{m.senderName}</span>
                      <span>•</span>
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMine
                          ? 'bg-green-600 text-white font-medium rounded-br-xs'
                          : 'bg-[#1e293b] border border-slate-700 text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#1e293b] text-yellow-400 flex items-center justify-center text-2xl shadow-xs border border-slate-700">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">
                    Discussion avec {activeArtisan?.name}
                  </h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Aucun message pour l'instant. Décrivez vos besoins ou posez vos questions pour recevoir une réponse rapide.
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT EN BAS FIXE (h-[70px] bg-[#1e293b] p-3 flex items-center gap-2) */}
          <div className="h-[70px] bg-[#1e293b] p-3 flex items-center gap-2 border-t border-slate-700/60 shrink-0 z-30">
            <input
              id="message-input-field"
              type="text"
              placeholder="Tapez un message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-[#0f172a] rounded-full px-4 py-2 text-white outline-none border border-slate-700/80 focus:border-green-500 text-xs placeholder-gray-500"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputText.trim()}
              className="bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-40 text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-transform active:scale-95 text-sm"
              title="Envoyer"
              aria-label="Envoyer"
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* VoIP Direct In-App Calling Modal */}
      {activeArtisan && (
        <>
          <VoipCallModal
            artisan={activeArtisan}
            initialMode={callModalMode}
            isOpen={callModalOpen}
            onClose={() => setCallModalOpen(false)}
            onCallEnded={handleCallEnded}
          />
          <RateArtisanModal
            artisan={activeArtisan}
            isOpen={rateModalOpen}
            onClose={() => setRateModalOpen(false)}
          />
        </>
      )}

      {/* Visualiseur de Statut (comme WhatsApp / Instagram Story) */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full ${viewingStatus.color} border-2 border-yellow-400 flex items-center justify-center text-white text-base font-bold shadow-xs`}
                >
                  {viewingStatus.letter}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm leading-tight">{viewingStatus.name}</h4>
                  <p className="text-[11px] text-gray-400">{viewingStatus.time || 'Statut actif (24h)'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStatus(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-72 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative">
              {viewingStatus.image ? (
                <img src={viewingStatus.image} alt="Statut" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <span className="text-4xl">🟢</span>
                  <p className="text-white font-bold text-base">Statut de {viewingStatus.name}</p>
                  <p className="text-xs text-slate-300 max-w-[260px] mx-auto leading-relaxed">
                    {viewingStatus.previewText ||
                      'Artisan Pro actif sur le réseau. Joignable pour vos chantiers et devis immédiats.'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingStatus(null)}
              className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const MessagesPage = Messages;

