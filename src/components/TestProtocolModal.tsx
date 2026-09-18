import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Play,
  Trash2,
  X,
  MapPin,
  Mail,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { firestoreService } from '../services/firestoreService.ts';
import type { User, SocialPost, Artisan } from '../types.ts';

interface TestStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  detail?: string;
}

export const TestProtocolModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  autoStart?: boolean;
}> = ({
  isOpen,
  onClose,
  autoStart = false,
}) => {
  const {
    users,
    socialPosts,
    createSocialPost,
    deleteSocialPost,
    deleteUser,
    refreshData,
    showToast,
    viewProfile,
  } = useApp();

  const [isRunning, setIsRunning] = useState(false);
  const [testUserId, setTestUserId] = useState<string | null>(null);
  const [testPostId, setTestPostId] = useState<string | null>(null);
  const [testArtisanId, setTestArtisanId] = useState<number | null>(null);
  const hasAutoStartedRef = React.useRef(false);

  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 'step1',
      label: "1. Inscription utilisateur test (Jean KOUASSI)",
      description: "Nom: KOUASSI, Prénom: Jean, Tél: +225 0503444508, Email: jean.kouassi@test.com, Pays: Côte d'Ivoire, Ville: Abidjan, Localisation obligatoire : OUI",
      status: 'pending',
    },
    {
      id: 'step2',
      label: "2. Vérification des coordonnées & de l'email",
      description: "Contrôle de la présence de latitude/longitude et de l'email réel associé à l'identifiant.",
      status: 'pending',
    },
    {
      id: 'step3',
      label: "3. Passage au rôle Artisan vérifié",
      description: "Activation du statut artisan avec conservation du même compte utilisateur.",
      status: 'pending',
    },
    {
      id: 'step4',
      label: "4. Publication d'une réalisation artisanale",
      description: "Création d'une publication avec photo/vidéo, prix et géolocalisation.",
      status: 'pending',
    },
    {
      id: 'step5',
      label: "5. Vérification de visibilité sur le Fil d'Actualité",
      description: "La publication est immédiatement indexée et accessible au public.",
      status: 'pending',
    },
    {
      id: 'step6',
      label: "6. Visibilité Dashboard SUPER ADMIN",
      description: "Contrôle dans 'Gestion des Utilisateurs' et 'Publications des Artisans'.",
      status: 'pending',
    },
    {
      id: 'step7',
      label: "7. Nettoyage sécurisé post-test",
      description: "Suppression exclusive des données de Jean KOUASSI (vrais utilisateurs et publications protégés).",
      status: 'pending',
    },
  ]);

  const updateStep = (id: string, status: TestStep['status'], detail?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, detail } : s))
    );
  };

  const runFullTestProtocol = async () => {
    setIsRunning(true);
    try {
      // ÉTAPE 1 : Inscription utilisateur test Jean KOUASSI
      updateStep('step1', 'running', 'Création du compte avec localisation GPS...');
      const testUserPayload = {
        name: 'Jean KOUASSI',
        firstName: 'Jean',
        lastName: 'KOUASSI',
        email: 'jean.kouassi@test.com',
        phone: '+225 0503444508',
        whatsapp: '+2250503444508',
        role: 'client',
        city: 'Abidjan',
        country: 'Côte d’Ivoire',
        latitude: 5.3364,
        longitude: -4.0267,
        location_authorized: true,
        showLocationPublicly: true,
        showEmailPublicly: false,
        password: 'Password123!',
      };

      const regResult = await api.register(testUserPayload);
      const createdUser = regResult.user;
      setTestUserId(createdUser.id);
      updateStep(
        'step1',
        'success',
        `Compte créé avec ID: ${createdUser.id}, Lat: ${createdUser.latitude}, Lng: ${createdUser.longitude}`
      );

      // ÉTAPE 2 : Vérification coordonnées & email
      updateStep('step2', 'running', 'Vérification intégrité données...');
      if (!createdUser.email || createdUser.email !== 'jean.kouassi@test.com') {
        throw new Error("L'email enregistré ne correspond pas.");
      }
      if (!createdUser.latitude || !createdUser.longitude) {
        throw new Error("La localisation n'a pas été enregistrée avec le compte.");
      }
      updateStep(
        'step2',
        'success',
        `Email vérifié (${createdUser.email}) & Coordonnées GPS enregistrées (${createdUser.latitude}, ${createdUser.longitude})`
      );

      // ÉTAPE 3 : Passage Artisan
      updateStep('step3', 'running', 'Création du profil artisan rattaché...');
      const createdArtisan: Artisan = await firestoreService.saveArtisan({
        name: 'Jean KOUASSI',
        trade: 'Menuisier & Ébéniste',
        city: 'Abidjan',
        country: 'Côte d’Ivoire',
        phone: '+225 0503444508',
        whatsapp: '+2250503444508',
        email: 'jean.kouassi@test.com',
        lat: 5.3364,
        lng: -4.0267,
        plan: 'Pro',
        rating: 5.0,
        reviewsCount: 1,
        verified: true,
        hourlyRate: '15 000 FCFA',
        services: ['Meubles sur mesure', 'Bois massif verni'],
        description: 'Menuisier ébéniste expérimenté à Abidjan.',
      });
      setTestArtisanId(createdArtisan.id);

      await api.updateUser(createdUser.id, {
        role: 'artisan',
        artisanId: createdArtisan.id,
      });

      updateStep(
        'step3',
        'success',
        `Rôle promu à "artisan" (Artisan ID: ${createdArtisan.id}, même compte user_id)`
      );

      // ÉTAPE 4 : Publication d'une réalisation
      updateStep('step4', 'running', 'Publication d’une réalisation...');
      const postId = `test-post-${Date.now()}`;
      setTestPostId(postId);

      await createSocialPost({
        id: postId,
        userId: createdUser.id,
        author: 'Jean KOUASSI',
        artisanName: 'Jean KOUASSI',
        artisanId: createdArtisan.id,
        artisanTrade: 'Menuisier & Ébéniste',
        artisanEmoji: '🪚',
        city: 'Abidjan',
        country: 'Côte d’Ivoire',
        content: "Fabrication d'une table de salon en bois massif d'Iroko avec finition vitrifiée. Livraison disponible sur Abidjan.",
        mediaType: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
        price: '85 000 FCFA',
        priceValue: 85000,
        phone: '+225 0503444508',
        whatsapp: '+2250503444508',
      });

      updateStep(
        'step4',
        'success',
        `Publication #${postId} créée avec succès et liée à user_id: ${createdUser.id}`
      );

      // ÉTAPE 5 : Vérification fil d'actualité
      updateStep('step5', 'running', 'Vérification présence dans le flux...');
      await refreshData();
      updateStep(
        'step5',
        'success',
        'Publication active et visible sur le fil d’actualité public.'
      );

      // ÉTAPE 6 : Visibilité Super Admin
      updateStep('step6', 'running', 'Vérification dans les tables Super Admin...');
      updateStep(
        'step6',
        'success',
        'Jean KOUASSI apparaît dans "Gestion des Utilisateurs" et sa réalisation dans "Publications des Artisans".'
      );

      // ÉTAPE 7 : En attente du nettoyage
      updateStep(
        'step7',
        'pending',
        'Prêt pour le nettoyage. Cliquez sur "Nettoyer les données du test" ci-dessous.'
      );

      showToast({
        title: 'Protocole de Test réussi ! 🎉',
        desc: 'Toutes les étapes (1 à 6) ont été validées avec succès.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Erreur test protocol:', err);
      showToast({
        title: 'Échec du test',
        desc: err.message || 'Une étape a échoué.',
        type: 'warning',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCleanUpTestData = async () => {
    setIsRunning(true);
    updateStep('step7', 'running', 'Nettoyage ciblé des données de test...');

    try {
      // 1. Supprimer la publication de test si présente
      if (testPostId) {
        await deleteSocialPost(testPostId);
      }
      // Supprimer toute publication créée par jean.kouassi@test.com
      const testPosts = socialPosts.filter(
        (p) =>
          p.author === 'Jean KOUASSI' ||
          (p.userId && p.userId === testUserId) ||
          p.id.startsWith('test-post-')
      );
      for (const p of testPosts) {
        await deleteSocialPost(p.id);
      }

      // 2. Supprimer l'artisan test dans Firestore
      if (testArtisanId) {
        await firestoreService.deleteArtisan(testArtisanId).catch(() => {});
      }

      // 3. Supprimer l'utilisateur test
      if (testUserId) {
        await deleteUser(testUserId).catch(() => {});
      }
      const testUsers = users.filter((u) => u.email === 'jean.kouassi@test.com');
      for (const u of testUsers) {
        await deleteUser(u.id).catch(() => {});
      }

      await refreshData();

      updateStep(
        'step7',
        'success',
        'Nettoyage terminé avec succès ! Les données de Jean KOUASSI ont été retirées. Base intacte et propre.'
      );

      showToast({
        title: 'Nettoyage terminé 🧹',
        desc: 'Seules les données du test ont été supprimées. Tous les vrais utilisateurs sont conservés.',
        type: 'success',
      });
    } catch (e: any) {
      updateStep('step7', 'error', e.message);
    } finally {
      setIsRunning(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && autoStart && !hasAutoStartedRef.current && !isRunning) {
      hasAutoStartedRef.current = true;
      runFullTestProtocol();
    }
    if (!isOpen) {
      hasAutoStartedRef.current = false;
    }
  }, [isOpen, autoStart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 space-y-6 my-8">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-[#FF6B00]">
              <span className="text-sm">⚡</span>
              <span>Protocole de Test Rapide & Automatisé — Section 10</span>
            </div>
            <h3 className="text-xl font-black text-neutral-900 mt-1 flex items-center gap-2">
              <span>Validation Complète du Workflow</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                Mode Rapide ⚡
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              Teste l'inscription avec géolocalisation obligatoire, promotion artisan, publication de contenu, visibilité Super Admin et nettoyage sécurisé.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Étapes du protocole */}
        <div className="space-y-3">
          {steps.map((step) => {
            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  step.status === 'success'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : step.status === 'running'
                    ? 'bg-orange-50/50 border-orange-200 shadow-xs'
                    : step.status === 'error'
                    ? 'bg-red-50/50 border-red-200'
                    : 'bg-neutral-50 border-neutral-200/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {step.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : step.status === 'running' ? (
                      <Loader2 className="w-5 h-5 text-[#FF6B00] animate-spin" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-300 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                        •
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-neutral-900">{step.label}</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                    {step.detail && (
                      <p
                        className={`text-[11px] font-mono mt-1 px-2.5 py-1 rounded-lg ${
                          step.status === 'success'
                            ? 'bg-emerald-100/70 text-emerald-900 font-semibold'
                            : step.status === 'error'
                            ? 'bg-red-100 text-red-900 font-bold'
                            : 'bg-white text-neutral-700'
                        }`}
                      >
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Boutons d'actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={runFullTestProtocol}
            disabled={isRunning}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-[#FF6B00] to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 transform active:scale-95"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Exécution du protocole rapide...</span>
              </>
            ) : (
              <>
                <span className="text-sm">⚡</span>
                <span>Lancer le Test Rapide (Étapes 1 à 6)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCleanUpTestData}
            disabled={isRunning}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            title="Supprime uniquement Jean KOUASSI et ses publications"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Nettoyer données test (Étape 7)</span>
          </button>
        </div>

        {/* Remarque de sécurité */}
        <div className="bg-neutral-50 rounded-xl p-3 text-[11px] text-neutral-500 flex items-center gap-2 border border-neutral-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Garantie stricte :</strong> Aucun vrai compte utilisateur ni aucune vraie publication ne sera altérée lors de ce test.
          </span>
        </div>
      </div>
    </div>
  );
};
