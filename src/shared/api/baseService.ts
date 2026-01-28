import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/shared/utils/tokenStorage";

export class ApiConfigAdapter {
  private static instance: ApiConfigAdapter;
  private readonly baseURL: string;

  private constructor() {
    // Use relative URL in development to leverage Vite proxy
    // If VITE_BASE_URL is set to http://localhost (without port), use empty string for proxy
    // Otherwise use the provided base URL
    const envBaseURL = import.meta.env.VITE_BASE_URL;
    if (envBaseURL === "http://localhost" || !envBaseURL) {
      this.baseURL = "";
    } else {
      this.baseURL = envBaseURL;
    }
  }

  static getInstance(): ApiConfigAdapter {
    if (!ApiConfigAdapter.instance) {
      ApiConfigAdapter.instance = new ApiConfigAdapter();
    }
    return ApiConfigAdapter.instance;
  }

  getBaseURL(): string {
    return this.baseURL;
  }
}

export interface HttpMethodStrategy<TResponse = unknown> {
  execute(
    api: AxiosInstance,
    url: string,
    data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<AxiosResponse<TResponse>>;
}

export class GetStrategy<TResponse> implements HttpMethodStrategy<TResponse> {
  async execute(
    api: AxiosInstance,
    url: string,
    _data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<AxiosResponse<TResponse>> {
    return api.get(url, { params });
  }
}

export class PostStrategy<TResponse> implements HttpMethodStrategy<TResponse> {
  async execute(
    api: AxiosInstance,
    url: string,
    data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<AxiosResponse<TResponse>> {
    return api.post(url, data, { params });
  }
}

export class PutStrategy<TResponse> implements HttpMethodStrategy<TResponse> {
  async execute(
    api: AxiosInstance,
    url: string,
    data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<AxiosResponse<TResponse>> {
    return api.put(url, data, { params });
  }
}

export class DeleteStrategy<TResponse>
  implements HttpMethodStrategy<TResponse>
{
  async execute(
    api: AxiosInstance,
    url: string,
    _data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<AxiosResponse<TResponse>> {
    return api.delete(url, { params });
  }
}

export class HttpMethodFactory {
  private static strategies: Map<string, HttpMethodStrategy> = new Map([
    ["GET", new GetStrategy()],
    ["POST", new PostStrategy()],
    ["PUT", new PutStrategy()],
    ["DELETE", new DeleteStrategy()],
  ]);

  static getStrategy<TResponse>(
    method: "GET" | "POST" | "PUT" | "DELETE",
  ): HttpMethodStrategy<TResponse> {
    const strategy = this.strategies.get(method) as
      | HttpMethodStrategy<TResponse>
      | undefined;
    if (!strategy) {
      throw new Error(`Unknown HTTP method: ${method}`);
    }
    return strategy;
  }
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface QueryParams {
  page?: number;
  per_page?: number;
  fields?: string;
  include?: string;
  [key: string]: unknown;
}

export abstract class BaseService<
  TEntity,
  TCreate = Partial<TEntity>,
  TUpdate = Partial<TEntity>,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
> {
  protected readonly api: AxiosInstance;
  protected readonly basePath: string;

  constructor(basePath: string) {
    const config = ApiConfigAdapter.getInstance();
    this.api = axios.create({
      baseURL: `${config.getBaseURL()}/api/v1${basePath}`,
      timeout: 5000,
    });
    this.basePath = basePath;
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor: adicionar token Bearer
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor: tratar erros 401
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Token inválido ou expirado
          tokenStorage.removeToken();
          
          // Redirecionar para login apenas se não estiver já na página de login
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      },
    );
  }

  protected async executeRequest<TResponse>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<AxiosResponse<TResponse>> {
    const strategy = HttpMethodFactory.getStrategy<TResponse>(method);
    return strategy.execute(this.api, url, data, params);
  }

  protected handleResponse<T>(response: AxiosResponse<T>): T {
    return response.data;
  }

  protected handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API Error: ${error.response?.data?.message || error.message}`,
      );
    }
    throw new Error("An unexpected error occurred");
  }

  protected async getAll(params?: TQuery & QueryParams): Promise<TEntity[]> {
    try {
      const response = await this.executeRequest<
        TEntity[] | PaginatedResponse<TEntity>
      >("GET", "/", undefined, params);
      const data = this.handleResponse(response);
      // Check if response is paginated
      if (data && typeof data === "object" && "data" in data) {
        return (data as PaginatedResponse<TEntity>).data;
      }
      return data as TEntity[];
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async getAllPaginated(
    params?: TQuery & QueryParams,
  ): Promise<PaginatedResponse<TEntity>> {
    try {
      const response = await this.executeRequest<PaginatedResponse<TEntity>>(
        "GET",
        "/",
        undefined,
        params,
      );
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async getById(id: number): Promise<TEntity> {
    try {
      const response = await this.executeRequest<TEntity>("GET", `/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async create(data: TCreate): Promise<TEntity> {
    try {
      const response = await this.executeRequest<TEntity>("POST", "/", data);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async update(id: number, data: TUpdate): Promise<TEntity> {
    try {
      const response = await this.executeRequest<TEntity>(
        "PUT",
        `/${id}`,
        data,
      );
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async delete(id: number): Promise<void> {
    try {
      await this.executeRequest("DELETE", `/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }
}
