// === 3 SUPER ADMINS FONDATEURS - ARTISANPRO AFRIQUE ===
// Fichier de configuration partagé Dart / Flutter

List<String> superAdmins = [
  'adanmitondejunior07@gmail.com',
  'artisanpro.afrique@gmail.com',
  'contactartisanproafrica@gmail.com',
];

bool isSuperAdmin(String? email) {
  if (email == null) return false;
  return superAdmins.contains(email.toLowerCase().trim());
}
