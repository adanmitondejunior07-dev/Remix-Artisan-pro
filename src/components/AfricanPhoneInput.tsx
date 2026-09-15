import React, { useState, useEffect } from 'react';

export interface AfricanPhoneInputProps {
  value?: string;
  onChange?: (fullNumber: string, localNumber: string, dialCode: string) => void;
  required?: boolean;
  id?: string;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const AFRICAN_PHONE_COUNTRIES = [
  { code: '+225', label: '🇨🇮 +225 CI', name: 'Côte d’Ivoire' },
  { code: '+213', label: '🇩🇿 +213 Algérie', name: 'Algérie' },
  { code: '+244', label: '🇦🇴 +244 Angola', name: 'Angola' },
  { code: '+229', label: '🇧🇯 +229 Bénin', name: 'Bénin' },
  { code: '+267', label: '🇧🇼 +267 Botswana', name: 'Botswana' },
  { code: '+226', label: '🇧🇫 +226 Burkina', name: 'Burkina' },
  { code: '+257', label: '🇧🇮 +257 Burundi', name: 'Burundi' },
  { code: '+237', label: '🇨🇲 +237 Cameroun', name: 'Cameroun' },
  { code: '+238', label: '🇨🇻 +238 Cap-Vert', name: 'Cap-Vert' },
  { code: '+236', label: '🇨🇫 +236 Centrafrique', name: 'Centrafrique' },
  { code: '+235', label: '🇹🇩 +235 Tchad', name: 'Tchad' },
  { code: '+269', label: '🇰🇲 +269 Comores', name: 'Comores' },
  { code: '+242', label: '🇨🇬 +242 Congo', name: 'Congo' },
  { code: '+243', label: '🇨🇩 +243 RDC', name: 'RDC' },
  { code: '+253', label: '🇩🇯 +253 Djibouti', name: 'Djibouti' },
  { code: '+20', label: '🇪🇬 +20 Égypte', name: 'Égypte' },
  { code: '+240', label: '🇬🇶 +240 Guinée Éq.', name: 'Guinée Éq.' },
  { code: '+291', label: '🇪🇷 +291 Érythrée', name: 'Érythrée' },
  { code: '+268', label: '🇸🇿 +268 Eswatini', name: 'Eswatini' },
  { code: '+251', label: '🇪🇹 +251 Éthiopie', name: 'Éthiopie' },
  { code: '+241', label: '🇬🇦 +241 Gabon', name: 'Gabon' },
  { code: '+220', label: '🇬🇲 +220 Gambie', name: 'Gambie' },
  { code: '+233', label: '🇬🇭 +233 Ghana', name: 'Ghana' },
  { code: '+224', label: '🇬🇳 +224 Guinée', name: 'Guinée' },
  { code: '+245', label: '🇬🇼 +245 Guinée-Bissau', name: 'Guinée-Bissau' },
  { code: '+254', label: '🇰🇪 +254 Kenya', name: 'Kenya' },
  { code: '+266', label: '🇱🇸 +266 Lesotho', name: 'Lesotho' },
  { code: '+231', label: '🇱🇷 +231 Liberia', name: 'Liberia' },
  { code: '+218', label: '🇱🇾 +218 Libye', name: 'Libye' },
  { code: '+261', label: '🇲🇬 +261 Madagascar', name: 'Madagascar' },
  { code: '+265', label: '🇲🇼 +265 Malawi', name: 'Malawi' },
  { code: '+223', label: '🇲🇱 +223 Mali', name: 'Mali' },
  { code: '+222', label: '🇲🇷 +222 Mauritanie', name: 'Mauritanie' },
  { code: '+230', label: '🇲🇺 +230 Maurice', name: 'Maurice' },
  { code: '+212', label: '🇲🇦 +212 Maroc', name: 'Maroc' },
  { code: '+258', label: '🇲🇿 +258 Mozambique', name: 'Mozambique' },
  { code: '+264', label: '🇳🇦 +264 Namibie', name: 'Namibie' },
  { code: '+227', label: '🇳🇪 +227 Niger', name: 'Niger' },
  { code: '+234', label: '🇳🇬 +234 Nigeria', name: 'Nigeria' },
  { code: '+250', label: '🇷🇼 +250 Rwanda', name: 'Rwanda' },
  { code: '+239', label: '🇸🇹 +239 Sao Tomé', name: 'Sao Tomé' },
  { code: '+221', label: '🇸🇳 +221 Sénégal', name: 'Sénégal' },
  { code: '+248', label: '🇸🇨 +248 Seychelles', name: 'Seychelles' },
  { code: '+232', label: '🇸🇱 +232 Sierra Leone', name: 'Sierra Leone' },
  { code: '+252', label: '🇸🇴 +252 Somalie', name: 'Somalie' },
  { code: '+27', label: '🇿🇦 +27 Afrique du Sud', name: 'Afrique du Sud' },
  { code: '+211', label: '🇸🇸 +211 Soudan du Sud', name: 'Soudan du Sud' },
  { code: '+249', label: '🇸🇩 +249 Soudan', name: 'Soudan' },
  { code: '+255', label: '🇹🇿 +255 Tanzanie', name: 'Tanzanie' },
  { code: '+228', label: '🇹🇬 +228 Togo', name: 'Togo' },
  { code: '+216', label: '🇹🇳 +216 Tunisie', name: 'Tunisie' },
  { code: '+256', label: '🇺🇬 +256 Ouganda', name: 'Ouganda' },
  { code: '+260', label: '🇿🇲 +260 Zambie', name: 'Zambie' },
  { code: '+263', label: '🇿🇼 +263 Zimbabwe', name: 'Zimbabwe' },
];

export const AfricanPhoneInput: React.FC<AfricanPhoneInputProps> = ({
  value = '',
  onChange,
  required = false,
  id = 'telInput',
  placeholder = '0503444508',
  label = 'Numéro de téléphone (Afrique)',
  className = '',
  disabled = false,
}) => {
  const [selectedDialCode, setSelectedDialCode] = useState<string>('+225');
  const [localNumber, setLocalNumber] = useState<string>('');

  useEffect(() => {
    if (!value) {
      setLocalNumber('');
      return;
    }
    const clean = String(value).trim();
    const matched = AFRICAN_PHONE_COUNTRIES.find((c) => clean.startsWith(c.code));
    if (matched) {
      setSelectedDialCode(matched.code);
      setLocalNumber(clean.slice(matched.code.length).trim());
    } else {
      setLocalNumber(clean);
    }
  }, [value]);

  const computeFullNumber = (dial: string, num: string) => {
    const cleanNum = num.replace(/\s/g, '');
    if (!cleanNum) return '';
    if (cleanNum.startsWith('+')) {
      return cleanNum;
    }
    // Si commence par un 0 (ex: 0503444508 ou 0707123456)
    if (dial === '+225' && cleanNum.startsWith('0')) {
      return `${dial}${cleanNum}`;
    }
    return `${dial}${cleanNum}`;
  };

  const handleDialChange = (newDial: string) => {
    setSelectedDialCode(newDial);
    if (onChange) {
      onChange(computeFullNumber(newDial, localNumber), localNumber, newDial);
    }
  };

  const handleNumChange = (newNum: string) => {
    setLocalNumber(newNum);
    if (onChange) {
      onChange(computeFullNumber(selectedDialCode, newNum), newNum, selectedDialCode);
    }
  };

  return (
    <div style={{ marginBottom: '15px' }} className={className}>
      {label && <label style={{ fontWeight: 'bold' }}>{label}</label>}
      <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
        <select
          id="paysSelect"
          name="paysSelect"
          value={selectedDialCode}
          disabled={disabled}
          onChange={(e) => handleDialChange(e.target.value)}
          style={{
            width: '155px',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            fontWeight: 'bold',
            background: 'white',
          }}
        >
          {AFRICAN_PHONE_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          id={id}
          name={id}
          data-telephone-input="true"
          value={localNumber}
          disabled={disabled}
          onChange={(e) => handleNumChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #ddd',
          }}
        />
      </div>
    </div>
  );
};
