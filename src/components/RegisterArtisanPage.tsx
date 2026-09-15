import React, { useState } from 'react';
import {
  UserPlus,
  Globe,
  MapPin,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { AFRICAN_COUNTRIES } from '../data/africanCountries.ts';
import { formatTelephone } from '../utils/phoneUtils.ts';
import { AfricanPhoneInput } from './AfricanPhoneInput.tsx';
import { saveArtisanAfrique } from '../utils/artisanStorage.ts';

export const RegisterArtisanPage: React.FC = () => {
  const { currentUser, currentArtisan, refreshData, switchUser, go, showToast, setSelectedArtisanId } = useApp();

  // État vérifiant si le paiement de 13.000F a été effectué
  const [hasPaid, setHasPaid] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('hasPaid13k') === 'true' ||
        localStorage.getItem('artisanpro_paid_13k') === 'true' ||
        currentUser?.hasPaidActivation13k === true ||
        currentUser?.verified === true ||
        currentUser?.is_verified === true ||
        currentArtisan?.verified === true ||
        currentArtisan?.is_verified === true ||
        currentUser?.role === 'admin' ||
        currentUser?.role === 'super_admin'
      );
    }
    return false;
  });

  const [waveNumber, setWaveNumber] = useState(currentUser?.phone || '');
  const [waveId, setWaveId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Formulaire d'inscription artisan
  const [name, setName] = useState(currentUser?.name || '');
  const [workshopName, setWorkshopName] = useState('');
  const [trade, setTrade] = useState('Plombier');
  const [selectedCountryCode, setSelectedCountryCode] = useState('CI');
  const [city, setCity] = useState('Abidjan');
  const [services, setServices] = useState('Dépannage d’urgence, Réparation tuyauterie, Remplacement robinetterie');
  const [phone, setPhone] = useState(currentUser?.phone || '+225 07 ');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [plan] = useState<'Free' | 'Pro' | 'Premium'>('Pro');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCountry = AFRICAN_COUNTRIES.find((c) => c.code === selectedCountryCode) || AFRICAN_COUNTRIES[0];

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const countryObj = AFRICAN_COUNTRIES.find((c) => c.code === code);
    if (countryObj) {
      setPhone(`${countryObj.dialCode} `);
      if (countryObj.popularCities && countryObj.popularCities.length > 0) {
        setCity(countryObj.popularCities[0]);
      }
    }
  };

  const copyWaveNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('0503444508');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast({
        title: 'Numéro copié !',
        desc: '05 03 44 45 08 copié dans le presse-papier. Ouvrez Wave pour transférer 13.000 FCFA.',
        type: 'success',
      });
    }
  };

  const ouvrirCompteWave = () => {
    // Ouvre le service Wave pour effectuer le paiement
    window.open('https://wave.com', '_blank');
  };

  // Envoi preuve WhatsApp
  const envoyerWhatsApp = () => {
    if (!waveNumber.trim()) {
      showToast({
        title: 'Numéro requis',
        desc: 'Veuillez saisir votre numéro Wave ayant effectué le transfert.',
        type: 'warning',
      });
      return;
    }
    const message = `Salut ArtisanPro Africa, j'ai payé 13.000F pour devenir artisan. Mon numéro Wave: ${waveNumber.trim()}, ID Transaction Wave: ${waveId.trim() || 'Nouveau'}`;
    window.open(`https://wa.me/2250503444508?text=${encodeURIComponent(message)}`, '_blank');
    showToast({
      title: 'Preuve transmise !',
      desc: 'Votre preuve a été envoyée sur WhatsApp au +225 0503444508.',
      type: 'success',
    });
  };

  // Validation directe et activation du compte en ligne (sortie définitive du mode démo)
  const handleValiderPaiementEtDebloquer = async () => {
    if (!waveNumber.trim()) {
      showToast({
        title: 'Numéro requis',
        desc: 'Veuillez saisir le numéro Wave avec lequel vous avez payé.',
        type: 'warning',
      });
      return;
    }

    setIsValidating(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasPaid13k', 'true');
        localStorage.setItem('artisanpro_paid_13k', 'true');
        if (currentUser?.id) {
          localStorage.setItem(`artisanpro_paid_13k_${currentUser.id}`, 'true');
          localStorage.setItem(`artisanpro_verified_${currentUser.id}`, 'true');
        }
      }

      if (currentUser) {
        const updated = {
          ...currentUser,
          role: 'artisan' as const,
          hasPaidActivation13k: true,
          hasPaid10k: true,
          a_paye_10k: true,
          is_verified: true,
          verified: true,
          phone: waveNumber.trim() || currentUser.phone,
        };
        await switchUser(updated, false);
        try {
          await api.updateUser(currentUser.id, {
            role: 'artisan',
            hasPaidActivation13k: true,
            hasPaid10k: true,
            a_paye_10k: true,
            is_verified: true,
            verified: true,
          });
        } catch {}
      }

      setHasPaid(true);
      setShowConfirmModal(false);

      showToast({
        title: 'Compte Débloqué avec Succès !',
        desc: 'Votre paiement de 13.000 FCFA a été enregistré. Le formulaire est débloqué.',
        type: 'success',
      });
    } catch {
      showToast({
        title: 'Erreur',
        desc: 'Impossible de valider le compte.',
        type: 'warning',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Soumission du formulaire artisan
  const handleRegisterArtisan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanTrade = trade.trim();
    const cleanCity = city.trim();
    const cleanServices = services
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    if (!cleanName || !cleanTrade || !cleanCity) {
      showToast({ title: 'Attention', desc: 'Veuillez remplir les champs obligatoires.', type: 'warning' });
      return;
    }

    // Validation stricte du téléphone via formatTelephone
    const checkTel = formatTelephone(phone);
    if (!checkTel.ok) {
      alert(checkTel.msg || 'Format de téléphone incorrect');
      showToast({ title: 'Numéro invalide', desc: checkTel.msg || 'Format de téléphone incorrect', type: 'warning' });
      return;
    }
    const validatedPhone = checkTel.value || phone.trim();

    setIsSubmitting(true);
    try {
      const cleanEmail = email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@artisanpro.africa`;
      const fullName = workshopName.trim() ? `${cleanName} (${workshopName.trim()})` : cleanName;

      // 1. Créer l'artisan
      const newArtisan = await api.createArtisan({
        name: fullName,
        trade: cleanTrade,
        city: cleanCity,
        country: currentCountry.name,
        rating: 5.0,
        reviewsCount: 1,
        plan,
        emoji: '🛠️',
        services: cleanServices.length ? cleanServices : ['Prestation générale'],
        phone: validatedPhone,
        email: cleanEmail,
        whatsapp: whatsapp.trim() ? (formatTelephone(whatsapp).ok ? (formatTelephone(whatsapp) as any).value : whatsapp.trim()) : validatedPhone,
        lat: currentCountry.lat,
        lng: currentCountry.lng,
        description: description || `Artisan qualifié en ${cleanTrade}, disponible pour interventions rapides et travail soigné à ${cleanCity} (${currentCountry.name}).`,
        experienceYears: 5,
        hourlyRate: currentCountry.currency === 'FCFA' ? '10 000 FCFA / h' : `15 ${currentCountry.currency} / h`,
        verified: true,
        is_verified: true,
        hasPaid10k: true,
        a_paye_10k: true,
        hasPaidActivation13k: true,
      });

      // 2. Mettre à jour le compte existant (CLIENT -> ARTISAN) ou inscrire un nouvel utilisateur si non connecté
      let activeUser = currentUser;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          name: cleanName,
          role: 'artisan' as const,
          isArtisan: true,
          artisanId: newArtisan.id,
          artisanPaidAt: Date.now(),
          transactionId: `trx-13k-${Date.now()}`,
          phone: validatedPhone,
          city: cleanCity,
          country: currentCountry.name,
          whatsapp: whatsapp.trim() ? (formatTelephone(whatsapp).ok ? (formatTelephone(whatsapp) as any).value : whatsapp.trim()) : validatedPhone,
          hasPaidActivation13k: true,
          hasPaid10k: true,
          a_paye_10k: true,
          is_verified: true,
          verified: true,
        };
        try {
          await api.updateUser(currentUser.id, updatedUser);
        } catch {
          // ignore
        }
        activeUser = updatedUser;
      } else {
        const res = await api.register({
          name: cleanName,
          email: cleanEmail,
          role: 'artisan',
          phone: phone.trim(),
          city: cleanCity,
          country: currentCountry.name,
          trade: cleanTrade,
          whatsapp: whatsapp.trim() || phone.trim(),
        });
        activeUser = {
          ...res.user,
          artisanId: newArtisan.id,
          role: 'artisan' as const,
          isArtisan: true,
          artisanPaidAt: Date.now(),
          transactionId: `trx-13k-${Date.now()}`,
          hasPaidActivation13k: true,
          hasPaid10k: true,
          a_paye_10k: true,
          is_verified: true,
          verified: true,
        };
      }

      // Récupération des éléments DOM paysSelect et telInput pour le numéro complet
      const paysSelectElem = document.getElementById('paysSelect') as HTMLSelectElement | null;
      const telInputElem = document.getElementById('telInput') as HTMLInputElement | null;
      const telephoneComplet =
        paysSelectElem && telInputElem
          ? `${paysSelectElem.value}${telInputElem.value.replace(/\s/g, '')}`
          : validatedPhone;

      // Enregistre-le dans localStorage dans une liste "artisans_afrique"
      saveArtisanAfrique({
        nom: fullName,
        telephone: telephoneComplet,
        pays: currentCountry.name,
        metier: cleanTrade,
        ville: cleanCity,
        mot_de_passe: '123456',
        email: cleanEmail,
        role: 'artisan',
      });

      await refreshData();
      await switchUser(activeUser, false);
      setSelectedArtisanId(newArtisan.id);

      alert('Inscription réussie ! Bienvenue chez Artisan Pro Afrique');
      showToast({
        title: 'Inscription réussie ! Bienvenue chez Artisan Pro Afrique',
        desc: `Félicitations ${cleanName} (${currentCountry.name}), votre profil est en ligne.`,
        type: 'success',
      });

      go('home');
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message || 'Impossible de créer le profil', type: 'warning' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // Si PAS payé -> montre page Wave avec confirmation et lien vers compte Wave
  // =========================================================================
  if (!hasPaid) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#FF6B00', fontSize: '28px', fontWeight: 'bold' }}>Deviens Artisan Vérifié</h1>
        <p style={{ marginTop: '8px', color: '#444', fontSize: '15px' }}>
          Paye 13.000F (10k activation + 3k badge vérifié) pour accéder au formulaire
        </p>

        {/* Boîte Wave Officielle */}
        <div style={{ background: '#1DC8FF', color: 'white', padding: '24px 20px', borderRadius: '18px', margin: '20px 0', boxShadow: '0 8px 24px rgba(29, 200, 255, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '22px' }}>🌊</span>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Paye sur Wave</h2>
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '2px', margin: '12px 0' }}>05 03 44 45 08</h1>
          <p style={{ margin: '4px 0', fontWeight: '600', fontSize: '15px' }}>Nom : ArtisanPro Africa</p>
          <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: '16px' }}>Montant : 13.000 FCFA</p>

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={copyWaveNumber}
              style={{
                background: 'rgba(255,255,255,0.95)',
                color: '#0084B4',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {copied ? <Check style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
              {copied ? 'Numéro Copié !' : 'Copier 05 03 44 45 08'}
            </button>
          </div>
        </div>

        {/* Bouton demandant la confirmation et ouvrant le compte Wave */}
        <div style={{ background: '#FFF8F2', border: '2px solid #FF6B00', borderRadius: '16px', padding: '18px', margin: '20px 0', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertCircle style={{ width: '22px', height: '22px', color: '#FF6B00', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#222', fontSize: '15px' }}>
                Êtes-vous sûr de vouloir payer ?
              </p>
              <p style={{ margin: '4px 0 12px 0', color: '#555', fontSize: '13px' }}>
                Cliquez sur ce lien et allez dans votre compte Wave pour payer 13.000 FCFA à <strong>ArtisanPro Africa (05 03 44 45 08)</strong> :
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(true);
                  ouvrirCompteWave();
                }}
                style={{
                  background: '#FF6B00',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(255, 107, 0, 0.25)',
                }}
              >
                <span>Cliquer ici pour aller dans votre compte Wave et payer</span>
                <ExternalLink style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Saisie des informations après paiement */}
        <div style={{ textAlign: 'left', marginTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '6px' }}>
            Numéro Wave qui a payé :
          </label>
          <input 
            placeholder="Ton numéro Wave qui a payé (ex: 07 00 00 00 00)" 
            value={waveNumber}
            onChange={(e) => setWaveNumber(e.target.value)}
            style={{ width: '100%', padding: '14px', marginBottom: '12px', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #ccc', fontSize: '15px' }}
          />

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '6px' }}>
            ID ou Référence de transaction Wave :
          </label>
          <input 
            placeholder="ID transaction Wave (ex: W-ABC123)" 
            value={waveId}
            onChange={(e) => setWaveId(e.target.value)}
            style={{ width: '100%', padding: '14px', marginBottom: '16px', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #ccc', fontSize: '15px' }}
          />
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            disabled={isValidating}
            onClick={handleValiderPaiementEtDebloquer}
            style={{
              background: '#FF6B00',
              color: 'white',
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
            }}
          >
            {isValidating ? 'Activation en cours...' : 'J’ai payé sur Wave - Activer mon compte maintenant'}
          </button>

          <button
            type="button"
            onClick={envoyerWhatsApp}
            style={{
              background: '#25D366',
              color: 'white',
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>Envoyer la preuve de paiement sur WhatsApp (+225 0503444508)</span>
          </button>
        </div>

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
          Votre compte est immédiatement vérifié et activé pour commencer à recevoir des clients et encaisser vos gains.
        </p>

        {/* Modale de confirmation "Êtes-vous sûr de vouloir payer ?" */}
        {showConfirmModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '24px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FF6B00', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '28px' }}>
                🌊
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111' }}>
                Êtes-vous sûr de vouloir payer ?
              </h3>
              <p style={{ fontSize: '14px', color: '#555', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Vous allez être redirigé vers Wave pour transférer <strong>13.000 FCFA</strong> au compte officiel <strong>05 03 44 45 08 (ArtisanPro Africa)</strong>.
              </p>
              
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', textAlign: 'left' }}>
                <div>• Numéro Wave : <strong>05 03 44 45 08</strong></div>
                <div>• Montant : <strong>13.000 FCFA</strong></div>
                <div>• Bénéficiaire : <strong>ArtisanPro Africa</strong></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    copyWaveNumber();
                    ouvrirCompteWave();
                  }}
                  style={{ background: '#FF6B00', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
                >
                  Aller dans mon compte Wave et payer
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  style={{ background: 'transparent', color: '#666', padding: '10px', borderRadius: '12px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // Si déjà payé -> montre le vrai formulaire débloqué
  // =========================================================================
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Accès Confirmé & Vérifié</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-950">Formulaire Devenir Artisan</h2>
        <p className="text-xs sm:text-sm text-neutral-600">
          Renseignez vos informations pour activer votre vitrine artisanale certifiée et commencer à gagner.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleRegisterArtisan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Nom complet *
            </label>
            <input
              placeholder="Nom complet (ex: Koffi Konan)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Nom de l'atelier
            </label>
            <input
              placeholder="Nom atelier (ex: Atelier Élite Froid & Plomberie)"
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Métier principal *
            </label>
            <input
              placeholder="Métier (Plombier, Électricien, Menuisier...)"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Pays de résidence *
              </label>
              <select
                value={selectedCountryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#FF6B00] bg-white font-medium"
              >
                {AFRICAN_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <AfricanPhoneInput
                id="telInput"
                label="Numéro de téléphone (Afrique)"
                value={phone}
                onChange={(fullNumber) => setPhone(fullNumber)}
                placeholder="0503444508"
                required
              />
              <span className="text-[11px] text-neutral-500 -mt-2 block">
                Format Côte d'Ivoire : 0503444508 ou +2250503444508
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Ville ou Commune *
            </label>
            <input
              placeholder={`Ex. ${currentCountry.popularCities?.[0] || 'Abidjan'}...`}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Services proposés
            </label>
            <input
              placeholder="Services (séparés par des virgules)"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ background: '#FF6B00' }}
              className="w-full py-4 rounded-xl text-white font-black text-base shadow-md shadow-[#FF6B00]/25 transition-all hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              <span>{isSubmitting ? 'Inscription en cours...' : "S'inscrire"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
