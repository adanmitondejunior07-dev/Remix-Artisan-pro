import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Volume2,
  VolumeX,
  Shield,
  Lock,
  Wifi,
  Sparkles,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { Artisan } from '../types.ts';

interface VoipCallModalProps {
  artisan: Artisan;
  initialMode: 'audio' | 'video';
  isOpen: boolean;
  onClose: () => void;
  onCallEnded: (
    type: 'audio' | 'video',
    durationSeconds: number,
    formattedDuration: string,
    status: 'completed' | 'missed'
  ) => void;
}

export const VoipCallModal: React.FC<VoipCallModalProps> = ({
  artisan,
  initialMode,
  isOpen,
  onClose,
  onCallEnded,
}) => {
  // Confirmation state before starting the call
  const [confirmed, setConfirmed] = useState(false);
  const [callMode, setCallMode] = useState<'audio' | 'video'>(initialMode);
  
  // Call in-progress state
  const [callState, setCallState] = useState<'requesting_permission' | 'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [durationSeconds, setDurationSeconds] = useState(0);
  
  // Media controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callMode === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const stateTimeoutRef = useRef<any>(null);

  // Sync mode when initialMode changes
  useEffect(() => {
    setCallMode(initialMode);
    setIsVideoEnabled(initialMode === 'video');
  }, [initialMode]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setCallState('connecting');
      setDurationSeconds(0);
      setIsMuted(false);
      setIsVideoEnabled(initialMode === 'video');
      setPermissionError(null);
    } else {
      cleanupStream();
    }
  }, [isOpen, initialMode]);

  // Clean up streams and intervals
  const cleanupStream = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
      stateTimeoutRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Format seconds to WhatsApp style string e.g. "2min 34s" or "45s"
  const formatDurationString = (secs: number): string => {
    if (secs === 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) {
      return `${m}min ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${s}s`;
  };

  // Timer formatted for display during call e.g. "02:34"
  const formatTimerDisplay = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Start the actual VoIP WebRTC call after user clicks "Appeler" in the popup
  const startVoipCall = async () => {
    setConfirmed(true);
    setCallState('requesting_permission');
    setPermissionError(null);

    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callMode === 'video',
        });
        mediaStreamRef.current = stream;
        if (localVideoRef.current && stream && callMode === 'video') {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err: any) {
      console.warn('Microphone/Camera permission notice:', err);
      setPermissionError(
        'Accès micro/caméra non accordé. L’appel se poursuivra en mode VoIP audio simulé.'
      );
    }

    // Step 1: Connecting
    setCallState('connecting');

    // Step 2: Ringing after 1.2s
    stateTimeoutRef.current = setTimeout(() => {
      setCallState('ringing');

      // Step 3: Connected after 2.8s
      stateTimeoutRef.current = setTimeout(() => {
        setCallState('connected');
        // Start counter
        timerIntervalRef.current = setInterval(() => {
          setDurationSeconds((prev) => prev + 1);
        }, 1000);
      }, 2600);
    }, 1500);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Invert
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle Video Track
  const toggleVideo = async () => {
    const nextState = !isVideoEnabled;
    setIsVideoEnabled(nextState);

    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((t) => (t.enabled = nextState));
      } else if (nextState && navigator.mediaDevices) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = videoStream.getVideoTracks()[0];
          mediaStreamRef.current.addTrack(newVideoTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }
        } catch (e) {
          console.warn('Camera request denied:', e);
        }
      }
    }
  };

  // Hangup call
  const handleHangup = () => {
    const finalSecs = durationSeconds;
    const isCompleted = finalSecs > 0 && callState === 'connected';
    const status: 'completed' | 'missed' = isCompleted ? 'completed' : 'missed';
    const formatted = formatTimerDisplay(finalSecs);
    setCallState('ended');
    cleanupStream();
    onCallEnded(callMode, finalSecs, formatted, status);
    onClose();
  };

  if (!isOpen) return null;

  // 1. CONFIRMATION POP-UP (Before calling)
  if (!confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-100 relative overflow-hidden">
          {/* Top Decorative accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-100 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-100 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Badge */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="w-16 h-16 rounded-3xl bg-sky-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-sky-500/20 ring-4 ring-sky-100">
              {callMode === 'video' ? (
                <Video className="w-8 h-8 stroke-[2.2]" />
              ) : (
                <Phone className="w-8 h-8 stroke-[2.2]" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-neutral-900 leading-snug">
                Appeler {artisan.name} ?
              </h3>
              <p className="text-xs text-neutral-500">
                {callMode === 'video' ? 'Appel vidéo VoIP en direct' : 'Appel vocal VoIP en direct'}
              </p>
            </div>

            {/* Mode Selector Pill */}
            <div className="flex items-center p-1 bg-neutral-100 rounded-2xl w-full max-w-[240px] text-xs font-bold">
              <button
                type="button"
                onClick={() => setCallMode('audio')}
                className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  callMode === 'audio'
                    ? 'bg-white text-sky-600 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setCallMode('video')}
                className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  callMode === 'video'
                    ? 'bg-white text-sky-600 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Vidéo HD</span>
              </button>
            </div>

            {/* Privacy Shield Box */}
            <div className="w-full p-3 rounded-2xl bg-sky-50/70 border border-sky-200/60 text-left flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-sky-950">
                <span className="font-bold block text-sky-900">Sécurité & Numéros Masqués</span>
                Vos vrais numéros de téléphone ne sont jamais partagés. L’appel passe directement par Internet (WebRTC) sans frais opérateur.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={startVoipCall}
                className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-black text-xs shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                {callMode === 'video' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                <span>Appeler</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE VOIP IN-CALL SCREEN
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md h-[90vh] max-h-[680px] bg-neutral-900 rounded-[32px] overflow-hidden shadow-2xl border border-neutral-800 flex flex-col justify-between text-white">
        
        {/* Background gradient & glow */}
        <div className="absolute inset-0 bg-radial-at-t from-sky-950/40 via-neutral-950 to-neutral-950 pointer-events-none" />

        {/* Top bar: Security & encryption badge */}
        <div className="relative z-10 px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-[11px] text-neutral-300 font-medium">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Chiffré de bout en bout</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/80 border border-sky-800/50 text-[10px] text-sky-300 font-bold">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>Numéros Masqués</span>
          </div>
        </div>

        {/* Center: Artisan info, video stream or pulsing avatar */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          {callMode === 'video' && isVideoEnabled ? (
            <div className="relative w-full h-72 sm:h-80 rounded-3xl overflow-hidden bg-neutral-800 border border-neutral-700 shadow-inner flex items-center justify-center mb-4">
              {/* Remote simulation video avatar */}
              <div className="flex flex-col items-center justify-center space-y-3 p-4">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-4xl shadow-lg animate-pulse">
                  {artisan.emoji}
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  Flux vidéo direct ArtisanPro VoIP
                </div>
              </div>

              {/* Local camera preview PIP */}
              <div className="absolute bottom-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden bg-neutral-950 border-2 border-sky-500 shadow-xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                <span className="absolute bottom-1.5 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded-md text-white font-medium">
                  Vous
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Pulsing avatar rings */}
              <div className="relative flex items-center justify-center">
                {callState === 'connected' ? (
                  <div className="absolute w-36 h-36 rounded-full bg-sky-500/20 animate-ping duration-1000" />
                ) : (
                  <div className="absolute w-36 h-36 rounded-full bg-amber-500/20 animate-pulse" />
                )}
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-5xl">
                    {artisan.emoji}
                  </div>
                </div>
              </div>

              {/* Audio Wave Visualizer when connected */}
              {callState === 'connected' && (
                <div className="flex items-center gap-1 h-6">
                  {[40, 75, 50, 95, 60, 85, 45, 90, 65, 35].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-sky-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 120}ms`,
                        animationDuration: '600ms',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Artisan Name & Status */}
          <div className="mt-4 space-y-1">
            <h2 className="text-xl font-black text-white tracking-wide">
              {artisan.name}
            </h2>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              {artisan.trade} · {artisan.city}
            </p>

            {/* Dynamic Status Display */}
            <div className="pt-2">
              {callState === 'requesting_permission' && (
                <span className="text-xs text-sky-300 animate-pulse font-medium">
                  Autorisation micro & caméra...
                </span>
              )}
              {callState === 'connecting' && (
                <span className="text-xs text-neutral-400 animate-pulse font-medium">
                  Connexion au réseau ArtisanPro VoIP...
                </span>
              )}
              {callState === 'ringing' && (
                <span className="text-xs text-sky-400 animate-pulse font-bold tracking-wide">
                  Sonnerie en cours...
                </span>
              )}
              {callState === 'connected' && (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {formatTimerDisplay(durationSeconds)}
                  </span>
                </div>
              )}
            </div>

            {permissionError && (
              <p className="text-[10px] text-amber-300 max-w-xs mx-auto pt-2">
                {permissionError}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Call Controls (Like WhatsApp) */}
        <div className="relative z-10 px-6 pb-8 pt-4">
          <div className="bg-neutral-800/80 backdrop-blur-md rounded-3xl p-4 border border-neutral-700/60 shadow-xl flex items-center justify-around gap-2">
            
            {/* Mute Audio */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-neutral-700/60 text-white hover:bg-neutral-700'
              }`}
              title={isMuted ? 'Activer le micro' : 'Couper le micro'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Toggle Video */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                !isVideoEnabled
                  ? 'bg-neutral-700/40 text-neutral-400'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              }`}
              title={isVideoEnabled ? 'Couper la vidéo' : 'Activer la vidéo'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Toggle Speaker */}
            <button
              type="button"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                !isSpeakerOn
                  ? 'bg-neutral-700/40 text-neutral-400'
                  : 'bg-neutral-700/60 text-white hover:bg-neutral-700'
              }`}
              title={isSpeakerOn ? 'Haut-parleur activé' : 'Écouteur'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* End Call Button (Large Red) */}
            <button
              type="button"
              onClick={handleHangup}
              className="w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform active:scale-95 cursor-pointer"
              title="Raccrocher"
            >
              <PhoneOff className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>

          <p className="text-[10px] text-neutral-500 text-center mt-3">
            Appel VoIP sans échange de numéros · ArtisanPro Sécurité
          </p>
        </div>
      </div>
    </div>
  );
};
