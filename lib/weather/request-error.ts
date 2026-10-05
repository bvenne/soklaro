export type WeatherFailure = 'timeout' | 'network' | 'rate-limit' | 'http' | 'invalid-data';

export class WeatherRequestError extends Error {
  constructor(public readonly kind: WeatherFailure, public readonly status?: number) {
    super(kind);
    this.name = 'WeatherRequestError';
  }
}
