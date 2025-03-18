'use client';

import { StoreProvider } from 'easy-peasy';
import store from '@/lib/redux/store';

export default function StoreProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreProvider store={store}>{children}</StoreProvider>;  
}