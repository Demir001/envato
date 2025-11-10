import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 */
const generateToken = (
  id: number,
  email: string,
  role: string,
  tenantId: string,
): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN; // örn: "1d" veya "7d"

  // --- DÜZELTME 1: Tip Koruması (Type Guard) ---
  // Bu, 'secret' değişkeninin 'undefined' olamayacağını
  // TypeScript'e kanıtlar.
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    throw new Error('Server configuration error: JWT secret missing.');
  }

  // --- DÜZELTME 2: 'expiresIn' Tipini Çözme ---
  // Hata (TS2322), tip (type) dosyasının 'string' kabul etmediğini
  // gösteriyor. 'expiresIn' değerini saniyeye (number) çevireceğiz.
  
  let expiresInSeconds: number;
  
  if (expiresIn) {
    // '1d' (gün) veya '7d' (gün) gibi string'leri saniyeye çevir
    // '1h' (saat) veya '30m' (dakika) da eklenebilir.
    if (expiresIn.endsWith('d')) {
      expiresInSeconds = parseInt(expiresIn.replace('d', '')) * 60 * 60 * 24;
    } else if (expiresIn.endsWith('h')) {
      expiresInSeconds = parseInt(expiresIn.replace('h', '')) * 60 * 60;
    } else {
      expiresInSeconds = 60 * 60 * 24; // Varsayılan: 1 gün (86400)
    }
  } else {
    expiresInSeconds = 60 * 60 * 24; // Varsayılan: 1 gün (86400)
  }

  const payload = {
    id,
    email,
    role,
    tenantId,
  };

  const options: SignOptions = {
    // 'expiresIn' için 'string' ("1d") yerine
    // 'number' (86400) kullanıyoruz.
    expiresIn: expiresInSeconds,
  };

  // 'secret' (artık 'string') ve 'options.expiresIn' (artık 'number')
  // tiplerinin (type) doğru olması gerekir.
  return jwt.sign(payload, secret, options);
};

export default generateToken;