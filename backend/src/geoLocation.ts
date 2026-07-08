import axios from 'axios';

// Interface de localização
export interface IGeoLocation {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

export class GeoLocationService {
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
