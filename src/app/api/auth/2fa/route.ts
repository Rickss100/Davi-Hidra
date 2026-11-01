import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import {
  buildTotpOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotpCode
} from '@/lib/totp';
import { getAuthorizedContextOrNull, recordAuditLog } from '@/server/dal/auth-dal';

export async function GET() {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, ctx.actor.id)).limit(1);
  const userRow = rows[0];
  if (!userRow) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  if (userRow.totpEnabled) {
    return NextResponse.json({
      totpEnabled: true,
      qrCodeDataUrl: null,
      manualKey: null
    });
  }

  // Gera ou reutiliza segredo pendente de ativação
  let plainSecret: string;
  if (userRow.totpSecretEncrypted) {
    try {
      plainSecret = decryptTotpSecret(userRow.totpSecretEncrypted);
    } catch {
      plainSecret = generateTotpSecret();
      await db
        .update(users)
        .set({ totpSecretEncrypted: encryptTotpSecret(plainSecret), updatedAt: new Date() })
        .where(eq(users.id, userRow.id));
    }
  } else {
    plainSecret = generateTotpSecret();
    await db
      .update(users)
      .set({ totpSecretEncrypted: encryptTotpSecret(plainSecret), updatedAt: new Date() })
      .where(eq(users.id, userRow.id));
  }

  const otpAuthUri = buildTotpOtpAuthUri(userRow.email, plainSecret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri, {
    width: 240,
    margin: 2,
    color: {
      dark: '#070A11',
      light: '#FFFFFF'
    }
  });

  return NextResponse.json({
    totpEnabled: false,
    qrCodeDataUrl,
    manualKey: plainSecret
  });
}

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, ctx.actor.id)).limit(1);
  const userRow = rows[0];
  if (!userRow) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  if (action === 'enable') {
    if (!userRow.totpSecretEncrypted) {
      return NextResponse.json(
        { error: 'NO_SECRET', message: 'Gere o QR Code primeiro antes de ativar.' },
        { status: 400 }
      );
    }

    const secret = decryptTotpSecret(userRow.totpSecretEncrypted);
    const valid = verifyTotpCode(secret, String(body.code || ''));
    if (!valid) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'Código de 6 dígitos inválido. Verifique o horário do celular.' },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({ totpEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userRow.id));

    const recoveryCodes = Array.from({ length: 4 }, () =>
      `NORTE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
    );

    await recordAuditLog({
      actorUserId: userRow.id,
      action: 'SECURITY_2FA_ENABLED'
    });

    return NextResponse.json({
      success: true,
      totpEnabled: true,
      recoveryCodes
    });
  }

  if (action === 'disable') {
    const password = String(body.password || '');
    const validPwd = await bcrypt.compare(password, userRow.passwordHash);
    if (!validPwd) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'Senha atual incorreta.' },
        { status: 401 }
      );
    }

    await db
      .update(users)
      .set({ totpEnabled: false, totpSecretEncrypted: null, updatedAt: new Date() })
      .where(eq(users.id, userRow.id));

    await recordAuditLog({
      actorUserId: userRow.id,
      action: 'SECURITY_2FA_DISABLED'
    });

    return NextResponse.json({ success: true, totpEnabled: false });
  }

  return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
}
