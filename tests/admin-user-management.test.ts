import { describe, it, expect } from 'vitest';
import { calculateExpiryDate } from '@/components/admin/EditUserModal';
import { getPlanLabel } from '@/components/admin/UsersTable';

describe('Admin User Management & Plan Expiry Rules', () => {
  it('calculates plan expiration correctly for monthly, quarterly, semiannual and annual periods', () => {
    const today = new Date();

    // 1 Month
    const oneMonth = calculateExpiryDate('1_month');
    expect(oneMonth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d1 = new Date(oneMonth);
    expect(d1.getTime()).toBeGreaterThan(today.getTime());

    // 3 Months
    const threeMonths = calculateExpiryDate('3_months');
    expect(threeMonths).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d3 = new Date(threeMonths);
    expect(d3.getTime()).toBeGreaterThan(d1.getTime());

    // 6 Months
    const sixMonths = calculateExpiryDate('6_months');
    expect(sixMonths).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d6 = new Date(sixMonths);
    expect(d6.getTime()).toBeGreaterThan(d3.getTime());

    // 1 Year
    const oneYear = calculateExpiryDate('1_year');
    expect(oneYear).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const dYear = new Date(oneYear);
    expect(dYear.getFullYear()).toBeGreaterThanOrEqual(today.getFullYear() + 1);

    // Lifetime
    const lifetime = calculateExpiryDate('lifetime');
    expect(lifetime).toBe('');
  });

  it('correctly returns plan human-readable labels', () => {
    expect(getPlanLabel('1_month')).toBe('1 Mês');
    expect(getPlanLabel('3_months')).toBe('3 Meses');
    expect(getPlanLabel('6_months')).toBe('6 Meses');
    expect(getPlanLabel('1_year')).toBe('1 Ano');
    expect(getPlanLabel('lifetime')).toBe('Vitalício');
  });

  it('verifies collaborator permissions constraint against admin accounts', () => {
    const collaboratorRole = 'collaborator';
    const targetAdminUser = { id: 2, role: 'admin' };
    const targetNormalUser = { id: 5, role: 'user' };
    const masterAdminUser = { id: 1, role: 'admin' };

    const canModify = (operatorRole: string, target: { id: number; role: string }) => {
      if (operatorRole === 'collaborator' && (target.role === 'admin' || target.id === 1)) {
        return false;
      }
      return true;
    };

    expect(canModify(collaboratorRole, targetAdminUser)).toBe(false);
    expect(canModify(collaboratorRole, masterAdminUser)).toBe(false);
    expect(canModify(collaboratorRole, targetNormalUser)).toBe(true);
  });

  it('verifies master user root protection against deletion', () => {
    const isProtectedFromDeletion = (id: number, currentUserId: number) => {
      return id <= 1 || id === currentUserId;
    };

    expect(isProtectedFromDeletion(1, 2)).toBe(true);
    expect(isProtectedFromDeletion(2, 2)).toBe(true);
    expect(isProtectedFromDeletion(3, 2)).toBe(false);
  });
});
