'use client';

import { ToastProvider as HeroUIToastProvider } from '@heroui/react';

export function ToastProvider() {
  return <HeroUIToastProvider placement="top-center" />;
}
