export type Coordinates = { latitude: number; longitude: number };

export type Place = Coordinates & {
  id: string;
  name: string;
  admin?: string;
  country?: string;
  timezone?: string;
};

export type WeatherPoint = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isDay: boolean;
  precipitation: number;
  precipitationProbability: number;
  humidity: number;
  dewPoint: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
};

export type DailyForecast = {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
  precipitationSum: number;
  sunshineDuration: number;
  sunrise: string;
  sunset: string;
};

export type WeatherForecast = {
  place: Place;
  timezone: string;
  timezoneAbbreviation: string;
  updatedAt: string;
  current: WeatherPoint;
  hourly: WeatherPoint[];
  daily: DailyForecast[];
  source: 'live' | 'cache' | 'mock';
};

export interface WeatherProvider {
  getForecast(place: Place, signal?: AbortSignal): Promise<WeatherForecast>;
}

export interface GeocodingProvider {
  search(query: string, signal?: AbortSignal): Promise<Place[]>;
}
