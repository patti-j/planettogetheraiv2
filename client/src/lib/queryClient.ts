import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  signal?: AbortSignal
): Promise<Response> {
  // Validate HTTP method before making request
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(method.toUpperCase())) {
    console.error('INVALID HTTP METHOD DETECTED:', method);
    console.error('URL:', url);
    console.error('Body:', body);
    console.error('Stack trace:', new Error().stack);
    throw new Error(`Invalid HTTP method: ${method}. Valid methods are: ${validMethods.join(', ')}`);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add Authorization header if token exists
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: signal, // Pass the abort signal to fetch
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Don't log abort errors as they are expected when user cancels
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Fetch error in apiRequest:', error instanceof Error ? error.message : error);
    console.error('Method:', method, 'URL:', url);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: HeadersInit = {};
    
    // Add Authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // Consider data fresh for 30 seconds
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
