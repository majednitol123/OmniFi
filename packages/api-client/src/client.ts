import {
  HealthResponse,
  NetworkSummary,
  TokenResponse,
  QuoteRequest,
  QuoteResponse,
  ApiError,
  ErrorCode,
} from './types';

export interface OmniFiClientConfig {
  readonly baseUrl: string;
  readonly fetchFn?: typeof fetch;
}

export class OmniFiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: OmniFiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.fetchFn = config.fetchFn || globalThis.fetch;
  }

  public async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  public async listNetworks(): Promise<readonly NetworkSummary[]> {
    return this.request<NetworkSummary[]>('/networks');
  }

  public async listTokens(
    networkId?: string,
    riskTier?: string,
  ): Promise<readonly TokenResponse[]> {
    const params = new URLSearchParams();
    if (networkId) params.set('networkId', networkId);
    if (riskTier) params.set('riskTier', riskTier);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<TokenResponse[]>(`/tokens${query}`);
  }

  public async getToken(assetRef: string): Promise<TokenResponse> {
    return this.request<TokenResponse>(`/tokens/${encodeURIComponent(assetRef)}`);
  }

  public async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    return this.request<QuoteResponse>('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    try {
      const response = await this.fetchFn(url, options);
      const json = await response.json();

      if (!response.ok) {
        const err = json as ApiError;
        throw new Error(
          err.userMessage || err.message || `API request failed with status ${response.status}`,
        );
      }

      return json as T;
    } catch (error: any) {
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw new Error(`Network failure connecting to ${url}`);
    }
  }
}
