import type { SocialPost, SocialCommunityLinks, WithdrawalRequest } from '../types.ts';

export const DEFAULT_COMMUNITY_LINKS: SocialCommunityLinks = {
  whatsappGroup: 'https://chat.whatsapp.com/ArtisanProAfriqueOfficiel',
  facebookPage: 'https://facebook.com/ArtisanProAfrique',
};

// Aucune donnée de démo ou publication factice : uniquement les publications réelles
export const INITIAL_POSTS: SocialPost[] = [];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd-1',
    userId: 'user-artisan-1',
    userName: 'Aïcha Koné',
    userPhone: '+225 07 08 09 10 11',
    operator: 'Wave',
    amount: 15000,
    currency: 'FCFA',
    date: '2024-04-12T11:20:00.000Z',
    status: 'en_attente',
  },
  {
    id: 'wd-3',
    userId: 'user-artisan-3',
    userName: 'Fatou Diop',
    userPhone: '+225 07 45 67 89 01',
    operator: 'Orange Money',
    amount: 20000,
    currency: 'FCFA',
    date: '2024-04-12T10:15:00.000Z',
    status: 'en_attente',
  },
  {
    id: 'wd-4',
    userId: 'user-artisan-4',
    userName: 'Jean-Marc Bakayoko',
    userPhone: '+225 05 78 90 12 34',
    operator: 'MTN Mobile Money',
    amount: 18500,
    currency: 'FCFA',
    date: '2024-04-12T09:30:00.000Z',
    status: 'en_attente',
  },
  {
    id: 'wd-5',
    userId: 'user-artisan-5',
    userName: 'Aminata Coulibaly',
    userPhone: '+225 01 23 45 67 89',
    operator: 'Moov Money',
    amount: 12000,
    currency: 'FCFA',
    date: '2024-04-12T08:45:00.000Z',
    status: 'en_attente',
  },
  {
    id: 'wd-2',
    userId: 'user-artisan-2',
    userName: 'Moussa Traoré',
    userPhone: '+225 05 12 34 56 78',
    operator: 'Orange Money',
    amount: 25000,
    currency: 'FCFA',
    date: '2024-04-11T15:45:00.000Z',
    status: 'approuve',
  },
];
