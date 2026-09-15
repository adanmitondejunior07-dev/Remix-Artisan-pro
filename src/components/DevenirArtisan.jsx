import { useState } from 'react';

export default function DevenirArtisanPaywall() {
  const [hasPaid, setHasPaid] = useState(
    typeof window !== 'undefined' && (
      localStorage.getItem('hasPaid13k') === 'true' ||
      localStorage.getItem('artisanpro_paid_13k') === 'true'
    )
  );
  const [waveNumber, setWaveNumber] = useState('');
  const [waveId, setWaveId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Si déjà payé -> montre le vrai formulaire
  if (hasPaid) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Formulaire Devenir Artisan</h2>
        <input
          placeholder="Nom complet"
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          placeholder="Nom atelier"
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          placeholder="Métier (Plombier...)"
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button
          style={{ background: '#FF6B00', color: 'white', padding: '14px 24px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
        >
          S'inscrire
        </button>
      </div>
    );
  }

  // Si PAS payé -> montre page Wave bloquée avec lien Wave et confirmation
  const envoyerWhatsApp = () => {
    const message = `Salut ArtisanPro, j'ai payé 13.000F pour devenir artisan. Mon numéro Wave: ${waveNumber}, ID Wave: ${waveId}`;
    window.open(`https://wa.me/2250503444508?text=${encodeURIComponent(message)}`, '_blank');
    alert("Preuve envoyée ! L'admin va valider en 5min.");
  };

  const ouvrirWave = () => {
    window.open('https://wave.com', '_blank');
  };

  const validerEtDebloquer = () => {
    if (!waveNumber.trim()) {
      alert("Veuillez entrer votre numéro Wave ayant effectué le paiement.");
      return;
    }
    localStorage.setItem('hasPaid13k', 'true');
    localStorage.setItem('artisanpro_paid_13k', 'true');
    setHasPaid(true);
    setShowConfirmModal(false);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#FF6B00', fontSize: '28px', fontWeight: 'bold' }}>Deviens Artisan Vérifié</h1>
      <p style={{ marginTop: '8px', color: '#555', fontSize: '15px' }}>
        Paye 13.000F (10k activation + 3k badge vérifié) pour accéder au formulaire
      </p>
      
      <div style={{ background: '#1DC8FF', color: 'white', padding: '24px 20px', borderRadius: '15px', margin: '20px 0', boxShadow: '0 4px 14px rgba(29, 200, 255, 0.3)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Paye sur Wave</h2>
        <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '1px', margin: '10px 0' }}>05 03 44 45 08</h1>
        <p style={{ margin: '4px 0', fontWeight: '500' }}>Nom: ArtisanPro Africa</p>
        <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Montant: 13.000F</p>
      </div>

      {/* Confirmation et lien vers compte Wave */}
      <div style={{ background: '#FFF8F2', border: '2px solid #FF6B00', borderRadius: '14px', padding: '16px', margin: '16px 0', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 6px 0', color: '#FF6B00', fontSize: '16px' }}>Êtes-vous sûr de vouloir payer ?</h3>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#444' }}>
          Cliquez sur ce lien et allez dans votre compte Wave pour payer 13.000F au <strong>05 03 44 45 08</strong> :
        </p>
        <button
          onClick={() => {
            setShowConfirmModal(true);
            ouvrirWave();
          }}
          style={{ background: '#FF6B00', color: 'white', padding: '12px 18px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          Cliquer sur ce lien et aller dans mon compte Wave pour payer
        </button>
      </div>

      <input 
        placeholder="Ton numéro Wave qui a payé (ex: 07...)" 
        value={waveNumber}
        onChange={(e) => setWaveNumber(e.target.value)}
        style={{ width: '100%', padding: '14px', margin: '10px 0', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #ccc', fontSize: '15px' }}
      />
      <input 
        placeholder="ID transaction Wave (ex: W-ABC123)" 
        value={waveId}
        onChange={(e) => setWaveId(e.target.value)}
        style={{ width: '100%', padding: '14px', margin: '10px 0', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #ccc', fontSize: '15px' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        <button
          onClick={validerEtDebloquer}
          style={{ background: '#FF6B00', color: 'white', width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}
        >
          J'ai payé sur Wave - Activer mon compte maintenant
        </button>

        <button
          onClick={envoyerWhatsApp}
          style={{ background: '#25D366', color: 'white', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '15px' }}
        >
          Envoyer preuve sur WhatsApp (+225 0503444508)
        </button>
      </div>

      <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        Après paiement, ton formulaire sera débloqué immédiatement et ton compte activé.
      </p>

      {/* Modale de confirmation */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Êtes-vous sûr de vouloir payer ?</h3>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
              Transférez 13.000 FCFA sur Wave au <strong>05 03 44 45 08</strong> (ArtisanPro Africa).
            </p>
            <button
              onClick={() => {
                ouvrirWave();
                setShowConfirmModal(false);
              }}
              style={{ background: '#FF6B00', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginBottom: '8px' }}
            >
              Aller dans mon compte Wave et payer
            </button>
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{ background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
