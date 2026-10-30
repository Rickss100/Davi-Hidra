/**
 * DevSecOps Security Middleware — Norte Invest (DAVI & Hydra)
 * - Assinatura e verificação criptográfica de tokens (JWT HMAC-SHA256 via Node crypto nativo)
 * - Isolamento estrito de carteira (Anti-IDOR / Multi-tenant Isolation) com suporte auditado a Admin/Colaborador
 * - Cabeçalhos HTTP de segurança (Equivalente Helmet / OWASP)
 * - Rate Limiting em memória contra ataques de força bruta e abuso de API
 */

import crypto from 'crypto';
import fs from 'fs';
import { getUserById } from '../services/database.service.js';

if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

/**
 * Obtém o segredo HMAC-SHA256 de forma determinística entre deploys no Render
 */
function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  if (process.env.TURSO_AUTH_TOKEN) {
    return crypto
      .createHash('sha256')
      .update(`${process.env.TURSO_AUTH_TOKEN}:norte-invest-devsecops-v1`)
      .digest('hex');
  }
  return 'norte-invest-local-dev-secret-change-in-prod-2026';
}

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let b64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

/**
 * Gera um token JWT assinado com HMAC-SHA256 (expiração padrão: 7 dias)
 */
export function signAuthToken(user, expiresInSeconds = 7 * 24 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.uuid || String(user.id),
    uid: Number(user.id),
    role: user.role || 'user',
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(signingInput)
    .digest();
  const encodedSig = base64UrlEncode(signature);

  return `${signingInput}.${encodedSig}`;
}

/**
 * Verifica a assinatura em tempo constante (timingSafeEqual) e validade temporal do token
 */
export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', getJwtSecret()).update(signingInput).digest()
  );

  const a = Buffer.from(encodedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extrai e valida o usuário autenticado a partir do header Authorization: Bearer <token>
 */
export function authenticateRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const rawToken = authHeader.slice(7).trim();
  const payload = verifyAuthToken(rawToken);
  if (!payload || !payload.uid) return null;

  const liveUser = getUserById(payload.uid);
  if (!liveUser) return null;

  return liveUser;
}

/**
 * Middleware: Exige usuário autenticado com token válido e conta não-inativa
 */
export function requireAuth(req, res, next) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Sessão expirada ou não autenticada. Faça login novamente.'
    });
  }

  if (authUser.status === 'inactive') {
    return res.status(403).json({
      error: 'ACCOUNT_INACTIVE',
      message: 'Sua conta está inativa. Entre em contato com o suporte.'
    });
  }

  req.authUser = authUser;
  next();
}

/**
 * Middleware: Exige perfil Administrador ou Colaborador autenticado criptograficamente
 */
export function requireAdminOrCollab(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.authUser.role !== 'admin' && req.authUser.role !== 'collaborator') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Acesso negado. Permissão restrita à equipe de gestão.'
      });
    }
    next();
  });
}

/**
 * Resolve com segurança o userId alvo da operação (Anti-IDOR / Isolamento de Carteira):
 * - Investidor comum ('user'): SÓ pode acessar o próprio ID/UUID. Tentativas de acessar outro ID retornam null (403).
 * - Admin / Colaborador: Pode acessar o próprio ID ou auditar a carteira de outro cliente solicitado.
 */
export function resolveAuthorizedUserId(req, requestedIdOrUuid = null) {
  const authUser = req.authUser || authenticateRequest(req);
  if (!authUser) return { userId: null, status: 401, message: 'Não autenticado.' };

  const candidate =
    requestedIdOrUuid !== null && requestedIdOrUuid !== undefined && requestedIdOrUuid !== ''
      ? requestedIdOrUuid
      : req.headers['x-user-id'];

  if (!candidate) {
    return { userId: Number(authUser.id), status: 200 };
  }

  // Resolver caso o candidato seja um UUID ou um ID numérico
  let targetNumericId = Number(candidate);
  if (Number.isNaN(targetNumericId)) {
    const resolved = getUserById(String(candidate));
    if (!resolved) {
      return { userId: null, status: 404, message: 'Usuário alvo não encontrado.' };
    }
    targetNumericId = Number(resolved.id);
  }

  const isPrivileged = authUser.role === 'admin' || authUser.role === 'collaborator';
  if (!isPrivileged && targetNumericId !== Number(authUser.id)) {
    return {
      userId: null,
      status: 403,
      message: 'Acesso negado: você só tem permissão para acessar os dados da sua própria carteira.'
    };
  }

  return { userId: targetNumericId, status: 200 };
}

/**
 * Cabeçalhos HTTP de Segurança (Padrão OWASP)
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  next();
}

/**
 * Rate Limiter em memória contra força bruta (Login / Recuperação de Senha / Abuso de API)
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  keyPrefix = 'rl',
  message = 'Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.'
} = {}) {
  const hits = new Map();

  // Limpeza periódica para evitar vazamento de memória
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of hits.entries()) {
      if (now > entry.resetAt) hits.delete(k);
    }
  }, Math.min(windowMs, 60 * 1000));
  if (cleanupTimer.unref) cleanupTimer.unref();

  function getClientKey(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? String(forwarded).split(',')[0].trim()
      : req.ip || req.socket?.remoteAddress || 'unknown';
    return `${keyPrefix}:${ip}`;
  }

  const middleware = (req, res, next) => {
    const key = getClientKey(req);
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message
      });
    }

    next();
  };

  middleware.resetKey = (req) => {
    hits.delete(getClientKey(req));
  };

  return middleware;
}
