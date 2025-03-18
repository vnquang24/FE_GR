"use client";

import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Provider as ZenStackHooksProvider } from '../../generated/hooks';
import { fetchInstance } from '@/lib/api';
import StoreProviderWrapper from './ui/store-provider';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Tạo QueryClient một lần duy nhất
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false
      }
    }
  }));

  return (
    <ZenStackHooksProvider
      value={{
        endpoint: "http://localhost:8000/api/models",
        fetch: fetchInstance,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <StoreProviderWrapper>
          {children}
        </StoreProviderWrapper>
      </QueryClientProvider>
    </ZenStackHooksProvider>
  );
}