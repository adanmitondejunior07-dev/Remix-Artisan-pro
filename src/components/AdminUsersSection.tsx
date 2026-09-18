import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Trash2,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  MapPin,
  Calendar,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { User, Artisan } from '../types.ts';
import { admins } from '../config/adminConfig.ts';

interface AdminUsersSectionProps {
  bannedUserIds: string[];
  onToggleBanUser: (id: string, name: string) => void;
}

export const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({
  bannedUserIds,
  onToggleBanUser,
}) => {
  const {
    users,
    artisans,
    deleteUser,
    viewProfile,
    showToast,
    refreshData,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'artisan' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [countryFilter, setCountryFilter] = useState('all');

  // Agréger tous les utilisateurs réels de la plateforme (Clients, Artisans, Admins)
  const allPlatformUsers = useMemo(() => {
    const list: Array<
      User & {
        displayRole: 'client' | 'artisan' | 'admin';
        isSuspended: boolean;
        sourceType: string;
      }
    > = [];
    const seenEmails = new Set<string>();
    const seenIds = new Set<string>();

    // 1. Utilisateurs de la collection Firestore "users"
    users.forEach((u) => {
      const emailKey = u.email ? u.email.trim().toLowerCase() : '';
      if (emailKey) seenEmails.add(emailKey);
      seenIds.add(u.id);

      const isAdm =
        u.role === 'admin' ||
        u.role === 'super_admin' ||
        admins.some((a) => a.email.toLowerCase() === emailKey);
      const isArt = u.role === 'artisan' || Boolean(u.artisanId);
      const displayRole: 'client' | 'artisan' | 'admin' = isAdm
        ? 'admin'
        : isArt
        ? 'artisan'
        : 'client';

      list.push({
        ...u,
        displayRole,
        isSuspended: bannedUserIds.includes(u.id),
        sourceType: 'user',
      });
    });

    // 2. Artisans ayant un profil (s'ils ne sont pas déjà inclus)
    artisans.forEach((art) => {
      const emailKey = art.email ? art.email.trim().toLowerCase() : '';
      if (emailKey && seenEmails.has(emailKey)) return;
      const artId = `artisan-${art.id}`;
      if (seenIds.has(artId) || seenIds.has(String(art.id))) return;

      if (emailKey) seenEmails.add(emailKey);
      seenIds.add(artId);

      list.push({
        id: String(art.id),
        name: art.name,
        email: art.email || 'Non renseigné',
        phone: art.phone || 'Non renseigné',
        whatsapp: art.whatsapp,
        role: 'artisan',
        displayRole: 'artisan',
        city: art.city || 'Abidjan',
        country: art.country || 'Côte d’Ivoire',
        avatarUrl: art.avatarUrl,
        joinedDate: art.joinedDate || '2025-01-10',
        latitude: art.lat,
        longitude: art.lng,
        isSuspended: bannedUserIds.includes(String(art.id)),
        sourceType: 'artisan',
        trade: art.trade,
      } as any);
    });

    // 3. Administrateurs déclarés officiels
    admins.forEach((adm, idx) => {
      const emailKey = adm.email.toLowerCase();
      if (seenEmails.has(emailKey)) return;
      seenEmails.add(emailKey);

      list.push({
        id: `admin-${idx + 1}`,
        name: adm.nom || 'Administrateur Officiel',
        email: adm.email,
        phone: '+225 0503444508',
        whatsapp: '+2250503444508',
        role: 'super_admin',
        displayRole: 'admin',
        city: 'Abidjan',
        country: 'Côte d’Ivoire',
        avatarUrl: undefined,
        joinedDate: '2025-01-01',
        isSuspended: false,
        sourceType: 'admin',
      });
    });

    return list;
  }, [users, artisans, bannedUserIds]);

  // Liste des pays uniques pour le filtre
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    allPlatformUsers.forEach((u) => {
      if (u.country) set.add(u.country);
    });
    return Array.from(set).sort();
  }, [allPlatformUsers]);

  // Filtrage combiné
  const filteredUsers = useMemo(() => {
    return allPlatformUsers.filter((user) => {
      // 1. Filtre Rôle
      if (roleFilter !== 'all' && user.displayRole !== roleFilter) return false;

      // 2. Filtre Statut
      if (statusFilter === 'active' && user.isSuspended) return false;
      if (statusFilter === 'suspended' && !user.isSuspended) return false;

      // 3. Filtre Pays
      if (countryFilter !== 'all' && user.country?.toLowerCase() !== countryFilter.toLowerCase()) {
        return false;
      }

      // 4. Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.phone && user.phone.toLowerCase().includes(q)) ||
          (user.city && user.city.toLowerCase().includes(q)) ||
          (user.country && user.country.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allPlatformUsers, roleFilter, statusFilter, countryFilter, searchQuery]);

  // Statistiques rapides
  const stats = useMemo(() => {
    return {
      total: allPlatformUsers.length,
      clients: allPlatformUsers.filter((u) => u.displayRole === 'client').length,
      artisans: allPlatformUsers.filter((u) => u.displayRole === 'artisan').length,
      admins: allPlatformUsers.filter((u) => u.displayRole === 'admin').length,
    };
  }, [allPlatformUsers]);

  const handleDelete = async (u: (typeof allPlatformUsers)[0]) => {
    if (confirm(`Confirmer la suppression définitive de l'utilisateur ${u.name} (${u.email}) ?`)) {
      await deleteUser(u.id);
      showToast({
        title: 'Utilisateur supprimé',
        desc: `Le compte ${u.name} a été retiré.`,
        type: 'success',
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-4 sm:p-6 shadow-xs space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
              Super Admin View
            </span>
            <span className="text-xs font-bold text-neutral-400">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}
            </span>
          </div>
          <h2 className="text-xl font-black text-neutral-900 mt-1">
            GESTION DES UTILISATEURS
          </h2>
          <p className="text-xs text-neutral-500 max-w-2xl">
            Visibilité complète et sans restriction sur l'ensemble des comptes réels inscrits : Clients, Artisans et Administrateurs.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            await refreshData();
            showToast({ title: 'Données utilisateurs synchronisées', type: 'info' });
          }}
          className="self-start lg:self-auto px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Actualiser la liste</span>
        </button>
      </div>

      {/* Cartes de synthèse rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setRoleFilter('all')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider font-bold block opacity-70">
            Total Comptes
          </span>
          <span className="text-xl font-black">{stats.total}</span>
        </div>

        <div
          onClick={() => setRoleFilter('client')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'client'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-blue-50/60 hover:bg-blue-100/60 border-blue-200 text-blue-900'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider font-bold block opacity-80">
            Clients
          </span>
          <span className="text-xl font-black">{stats.clients}</span>
        </div>

        <div
          onClick={() => setRoleFilter('artisan')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'artisan'
              ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-xs'
              : 'bg-orange-50/60 hover:bg-orange-100/60 border-orange-200 text-orange-900'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider font-bold block opacity-80">
            Artisans
          </span>
          <span className="text-xl font-black">{stats.artisans}</span>
        </div>

        <div
          onClick={() => setRoleFilter('admin')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'admin'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
              : 'bg-purple-50/60 hover:bg-purple-100/60 border-purple-200 text-purple-900'
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider font-bold block opacity-80">
            Admins
          </span>
          <span className="text-xl font-black">{stats.admins}</span>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par nom, email réel, téléphone, ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          />
        </div>

        {/* Filtre Rôle */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Tous les rôles</option>
            <option value="client">Clients uniquement</option>
            <option value="artisan">Artisans uniquement</option>
            <option value="admin">Administrateurs uniquement</option>
          </select>
        </div>

        {/* Filtre Statut */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Comptes Actifs 🟢</option>
            <option value="suspended">Comptes Suspendus 🔴</option>
          </select>
        </div>
      </div>

      {/* Tableau complet des utilisateurs */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-700">
          <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-400 border-y border-neutral-200">
            <tr>
              <th className="py-3 px-3">Photo</th>
              <th className="py-3 px-3">Nom complet</th>
              <th className="py-3 px-3">Email (Réel)</th>
              <th className="py-3 px-3">Téléphone</th>
              <th className="py-3 px-3">Rôle</th>
              <th className="py-3 px-3">Pays & Ville</th>
              <th className="py-3 px-3">Statut</th>
              <th className="py-3 px-3">Date d'inscription</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const avatar = u.avatarUrl || u.avatar || (u as any).photoUrl;
                const isSuspended = u.isSuspended;

                return (
                  <tr key={u.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* 1. Photo de profil */}
                    <td className="py-3 px-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-200 border border-neutral-300 shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={u.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-orange-100 text-[#FF6B00]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. Nom complet */}
                    <td className="py-3 px-3">
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            viewProfile({
                              userId: u.id,
                              name: u.name,
                              artisanId: u.artisanId,
                            })
                          }
                          className="font-bold text-neutral-900 hover:text-[#FF6B00] text-left block hover:underline cursor-pointer"
                        >
                          {u.name}
                        </button>
                        <span className="text-[10px] text-neutral-400 font-mono block">
                          ID: {u.id}
                        </span>
                      </div>
                    </td>

                    {/* 3. Email réel */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-neutral-800 font-medium">
                        <a
                          href={`mailto:${u.email}`}
                          className="hover:text-[#FF6B00] hover:underline"
                        >
                          {u.email}
                        </a>
                      </div>
                    </td>

                    {/* 4. Téléphone */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono text-neutral-700 font-semibold flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{u.phone || 'Non renseigné'}</span>
                        {u.whatsapp && (
                          <a
                            href={`https://wa.me/${u.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Ouvrir WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* 5. Rôle (Client / Artisan / Admin) */}
                    <td className="py-3 px-3">
                      {u.displayRole === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
                          <Shield className="w-3 h-3 text-purple-700" />
                          Admin
                        </span>
                      ) : u.displayRole === 'artisan' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF6B00] border border-orange-200 inline-flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-[#FF6B00]" />
                          Artisan
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-700" />
                          Client
                        </span>
                      )}
                    </td>

                    {/* 6. Pays & Ville */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-neutral-700">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                        <span className="font-medium">
                          {u.city || 'Abidjan'}, {u.country || 'Côte d’Ivoire'}
                        </span>
                      </div>
                    </td>

                    {/* 7. Statut du compte */}
                    <td className="py-3 px-3">
                      {isSuspended ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1">
                          <UserX className="w-3 h-3 text-red-600" />
                          Suspendu
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          Actif
                        </span>
                      )}
                    </td>

                    {/* 8. Date d'inscription */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-500">
                      {u.joinedDate || '2025-01-10'}
                    </td>

                    {/* 9. Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            viewProfile({
                              userId: u.id,
                              name: u.name,
                              artisanId: u.artisanId,
                            })
                          }
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                          title="Voir le profil"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleBanUser(u.id, u.name)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                            isSuspended
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                          title={isSuspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                        >
                          {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>

                        {u.displayRole !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                            title="Supprimer définitivement le compte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-10 text-center text-neutral-400">
                  Aucun utilisateur ne correspond aux critères de recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
