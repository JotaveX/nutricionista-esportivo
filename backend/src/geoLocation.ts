import axios from 'axios';

// Interface de localização
export interface IGeoLocation {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

export class GeoLocationService {
  // A Vercel injeta esses headers em toda requisição que passa pela edge
  // network dela (geolocalização própria, sem chamada externa e sem enviar
  // o IP do visitante a mais um terceiro). Só existem em produção na Vercel
  // — em dev local (`npm run dev`) não estão presentes.
  static fromVercelHeaders(headers: Record<string, string | string[] | undefined>): IGeoLocation | null {
    const country = headers['x-vercel-ip-country'];
    if (!country || Array.isArray(country)) return null;

    const city = headers['x-vercel-ip-city'];
    const latitude = headers['x-vercel-ip-latitude'];
    const longitude = headers['x-vercel-ip-longitude'];

    return {
      country,
      city: typeof city === 'string' ? decodeURIComponent(city) : 'Desconhecido',
      latitude: typeof latitude === 'string' ? parseFloat(latitude) : NaN,
      longitude: typeof longitude === 'string' ? parseFloat(longitude) : NaN,
    };
  }

  static async getLocationByIp(ip: string | undefined): Promise<IGeoLocation | null> {
    if (!ip) {
      return null;
    }

    // Tratativa para IP local durante testes
    if (ip === '::1' || ip === '127.0.0.1') {
      return {
        country: 'Localhost',
        city: 'Desenvolvimento',
        latitude: 0,
        longitude: 0,
      };
    }

    try {
      // ipwho.is: gratuita, sem chave, e suporta HTTPS (ip-api.com só aceita
      // HTTPS no plano pago, então o IP do visitante trafegaria sem cifrar)
      const response = await axios.get(`https://ipwho.is/${ip}`);
      const data = response.data;

      if (!data.success) return null;

      return {
        country: data.country,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
      };
    } catch (error) {
      console.error('Erro ao buscar geolocalização:', error);
      return null;
    }
  }
}
