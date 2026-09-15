import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, AlertTriangle, ArrowLeft, CheckCircle2, Crown, Banknote, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { isExactAdminEmail, getAdminUserByEmail, admins, getDashboard } from '../config/adminConfig.ts';

export const AdminLoginPage: React.FC = () => {
  const { go, switchUser, showToast, activeOtp } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!isExactAdminEmail(cleanEmail)) {
      setError(`Cet email n'est pas autorisé pour l'accès Super Administrateur.`);
      return;
    }

    // Verification of secret admin password or active OTP
    const validPasswords = ['AdminPro2026!', 'artisanproadmin', 'admin', '123456'];
    const isCodeMatch = activeOtp?.code && activeOtp.code === password.trim();
    if (!validPasswords.includes(password.trim()) && !isCodeMatch) {
      setError('Code secret ou mot de passe incorrect. Accès refusé.');
      return;
    }

    setIsLoading(true);
    try {
      const adminUser = getAdminUserByEmail(cleanEmail);

      await switchUser(adminUser, false);
      showToast({
        title: 'Accès Super Administrateur Déverrouillé 🛡️',
        desc: `Bienvenue ${adminUser.name} ! Console de supervision déverrouillée (aucun statut client ❌).`,
        type: 'success',
      });
      go('admin');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-neutral-950 text-white">
      <div className="w-full max-w-md space-y-6">
        <button
          type="button"
          onClick={() => go('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au site public</span>
        </button>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center text-2xl shadow-lg">
            <Shield className="w-7 h-7 text-red-500" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-800 text-[11px] font-bold text-red-300">
              <Lock className="w-3 h-3 text-red-400" />
              <span>Accès Protégé & Restreint</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Portail Super Administrateur
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Direction générale et gestion des retraits Mobile Money. Seuls les administrateurs habilités peuvent se connecter.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SÉLECTEUR RAPIDE POUR LES 3 ADMINS ARTISANPRO */}
          <div className="space-y-2 pt-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              Choisir un compte Administrateur Habilité (3 Postes) :
            </div>
            <div className="space-y-1.5">
              {admins.map((adm) => {
                const isSelected = email.toLowerCase() === adm.email.toLowerCase();
                const isDir = adm.role === 'DIRECTION_GENERALE';
                const isRet = adm.role === 'ADMIN_RETRAITS';

                return (
                  <button
                    key={adm.email}
                    type="button"
                    onClick={() => {
                      setEmail(adm.email);
                      setPassword('AdminPro2026!');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-all border cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-neutral-800 border-[#FF6B00] text-white shadow-xs'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isDir
                            ? 'bg-amber-500/20 text-amber-400'
                            : isRet
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        {isDir ? <Crown className="w-3.5 h-3.5" /> : isRet ? <Banknote className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{adm.nom}</div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate">{adm.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-neutral-950 text-amber-300 shrink-0 border border-neutral-700">
                      {adm.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Email Administrateur
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email-administrateur"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Code Secret / Mot de Passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe ou code"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-neutral-400 hover:text-white absolute right-3 top-2.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Vérification...' : 'Accéder au Super Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
