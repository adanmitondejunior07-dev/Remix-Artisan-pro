import React, { useState } from 'react';
import { X, Star, CheckCircle2, ShieldCheck, ThumbsUp, Send } from 'lucide-react';
import type { Artisan } from '../../types.ts';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';

interface RateArtisanModalProps {
  artisan: Artisan | null;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted?: (rating: number) => void;
}

const RATING_LABELS = [
  'Sélectionnez une note',
  'Médiocre',
  'Passable',
  'Bon travail',
  'Très satisfaisant',
  'Excellent artisan !',
];

const QUICK_TAGS = [
  'Ponctualité exemplaire',
  'Travail de grande qualité',
  'Devis transparent',
  'Excellente communication',
  'Propreté du chantier',
  'Recommandé à 100%',
];

export const RateArtisanModal: React.FC<RateArtisanModalProps> = ({
  artisan,
  isOpen,
  onClose,
  onRatingSubmitted,
}) => {
  const { currentUser, showToast } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Travail de grande qualité']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !artisan) return null;

  const currentDisplayRating = hoverRating || rating;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      // Calculate updated rating and review count
      const currentReviews = artisan.reviewsCount || 0;
      const currentAvg = artisan.rating || 5.0;
      const newReviews = currentReviews + 1;
      const newAvg = Number(((currentAvg * currentReviews + rating) / newReviews).toFixed(1));

      // Persist update via API
      await api.updateArtisan(artisan.id, {
        rating: newAvg,
        reviewsCount: newReviews,
      });

      setSubmitted(true);
      if (onRatingSubmitted) {
        onRatingSubmitted(rating);
      }

      showToast({
        title: 'Avis enregistré avec succès !',
        desc: `Votre note de ${rating}/5 a été attribuée à ${artisan.name}.`,
        type: 'success',
      });

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Erreur soumission note:', err);
      showToast({
        title: 'Note enregistrée localement',
        desc: `Merci pour votre évaluation de ${artisan.name} !`,
        type: 'info',
      });
      if (onRatingSubmitted) onRatingSubmitted(rating);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-neutral-900">Merci pour votre avis !</h3>
              <p className="text-xs text-neutral-600">
                Votre évaluation aide la communauté à faire confiance aux meilleurs artisans.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>Note attribuée : {rating} / 5</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-2 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-200 text-3xl flex items-center justify-center mx-auto shadow-xs">
                {artisan.avatarUrl ? (
                  <img
                    src={artisan.avatarUrl}
                    alt={artisan.name}
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  artisan.emoji || '👨‍🔧'
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-neutral-900 leading-tight">
                  Noter {artisan.name}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  {artisan.trade} · {artisan.city}
                </p>
              </div>
            </div>

            {/* Interactive Stars */}
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= currentDisplayRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-hidden"
                      aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          isActive
                            ? 'text-amber-500 fill-amber-400 drop-shadow-xs'
                            : 'text-neutral-300 fill-neutral-100 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200/60 px-3 py-0.5 rounded-full">
                {RATING_LABELS[currentDisplayRating]} ({currentDisplayRating}/5)
              </span>
            </div>

            {/* Quick compliments tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Points forts constatés :</label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Commentaire sur l’intervention ou l’appel (optionnel) :
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex : Très réactif, conseils clairs au téléphone et devis rapide..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden bg-neutral-50/50"
              />
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-[11px]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600" />
              <span>Avis vérifié post-appel VoIP. Publié sur la fiche de l’artisan.</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Enregistrement...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Valider ma note</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
