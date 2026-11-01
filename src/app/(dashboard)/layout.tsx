import React from 'react';
import { requirePortfolioContext } from '@/server/dal/auth-dal';
import { PrivateShell } from '@/components/layout/private-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Verificação Zero-Trust dupla no PostgreSQL antes de entregar qualquer rota interna
  await requirePortfolioContext();

  return <PrivateShell>{children}</PrivateShell>;
}
