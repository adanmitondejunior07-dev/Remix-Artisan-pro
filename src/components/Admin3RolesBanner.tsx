import React from 'react';
import {
  Shield,
  Crown,
  Banknote,
  Cpu,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { admins, getDashboard, type AdminAfricaProfile } from '../config/adminConfig.ts';

interface Admin3RolesBannerProps {
  currentEmail?: string | null;
  selectedAdminEmail: string;
  onSelectAdminEmail: (email: string) => void;
}

export const Admin3RolesBanner: React.FC<Admin3RolesBannerProps> = ({
  currentEmail,
  selectedAdminEmail,
  onSelectAdminEmail,
}) => {
  const currentAssignedDashboard = getDashboard(selectedAdminEmail);

  return (
    <div className="rounded-3xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 p-6 sm:p-7 text-white border-2 border-[#FF6B00]/50 shadow-xl space-y-5 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-80 h-80 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* TITRE ET BADGE */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>ADMINISTRATEUR SUPRÊME UNIQUE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
            Administration Centrale de la Plateforme
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
            Espace de contrôle réservé à l'administrateur suprême officiel pour piloter les artisans, les validations et l'envers du décor.
          </p>
        </div>

        {/* STATUT DU DASHBOARD ACTIF */}
        <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-700/80 text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-neutral-400">
            Écran Assigné Actuel
          </div>
          <div className="text-sm font-black text-[#FF6B00] flex items-center gap-1.5 justify-end">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{currentAssignedDashboard}</span>
          </div>
        </div>
      </div>

      {/* LES 3 CARTES DES ADMINS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        {admins.map((admin) => {
          const isSelected = selectedAdminEmail.toLowerCase() === admin.email.toLowerCase();
          const isUserEmail = currentEmail?.toLowerCase() === admin.email.toLowerCase();
          const screenName = getDashboard(admin.email);

          // Icône et couleur selon le rôle
          const isDirection = admin.role === 'DIRECTION_GENERALE';
          const isRetraits = admin.role === 'ADMIN_RETRAITS';
          const isControle = admin.role === 'CONTROLE_CENTRAL';

          return (
            <button
              key={admin.email}
              type="button"
              onClick={() => onSelectAdminEmail(admin.email)}
              className={`text-left p-4 rounded-2xl transition-all border cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-neutral-900/95 border-[#FF6B00] shadow-lg shadow-[#FF6B00]/20 ring-2 ring-[#FF6B00]/30'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                        isDirection
                          ? 'bg-amber-500/20 text-amber-400'
                          : isRetraits
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {isDirection ? <Crown className="w-4 h-4" /> : isRetraits ? <Banknote className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {admin.role}
                    </span>
                  </div>

                  {isUserEmail && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-[10px] font-extrabold text-emerald-300">
                      Vous
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-black text-sm text-white">{admin.nom}</div>
                  <div className="text-[11px] font-mono text-neutral-400 truncate">{admin.email}</div>
                </div>

                <div className="text-xs">
                  <span className="text-neutral-400 text-[10px] block uppercase font-bold">Niveau d'accès :</span>
                  <span className="font-bold text-amber-300">{admin.acces}</span>
                </div>
              </div>

              {/* ÉCRAN ATTRIBUÉ (selon getDashboard) */}
              <div className="pt-2 border-t border-neutral-800/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 block">
                  Écran assigné :
                </span>
                <div className="text-xs font-black text-neutral-100 flex items-center justify-between">
                  <span className="truncate">{screenName}</span>
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#FF6B00]' : 'text-neutral-500'}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
