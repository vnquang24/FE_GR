"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ZenStackHooksProvider } from '../../generated/hooks';
import { fetchInstance, queryClient } from '@/lib/api';
import StoreProviderWrapper from './ui/store-provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toast } from '@/components/ui/toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ZenStackHooksProvider
        value={{
          endpoint: (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000') + "/api/models",
          fetch: fetchInstance,
        }}
      >
        <StoreProviderWrapper>
          {children}
        </StoreProviderWrapper>
        <Toast position="top-center" />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </ZenStackHooksProvider>
    </QueryClientProvider>
  );
}