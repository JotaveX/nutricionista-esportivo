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
      // Usando a ip-api (gratuita para testes/uso moderado)
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      const data = response.data;

      if (data.status === 'fail') return null;

      return {
        country: data.country,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
      };
    } catch (error) {
      console.error('Erro ao buscar geolocalização:', error);
      return null;
    }
  }
}
