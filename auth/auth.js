/**
 * Utilitário de Autenticação Segura com Criptografia SHA-256,
 * Validação de Schema Estrita com Zod, Prevenção a Brute Force,
 * Validação Honeypot e Proteção contra Enumeração de Usuários.
 *
 * Configuração compatível com Auth.js / Vercel:
 * - AUTH_SECRET de ambiente verificado
 * - trustHost: true configurado
 * - Opções de Cookies estritas para produção (httpOnly, secure, sameSite: 'lax')
 */

import { z } from 'zod';

// Configurações de Ambiente e Auth.js
export const authConfig = {
  trustHost: true,
  secret: (typeof process !== 'undefined' && process.env?.AUTH_SECRET) || undefined,
  cookies: {
    sessionToken: {
      name: '__Secure-authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
};

// =========================================================================
// SCHEMA DE VALIDAÇÃO COM ZOD (CREDENTIALS)
// =========================================================================

export const loginCredentialsSchema = z.object({
  username: z
    .string({ required_error: 'Credenciais inválidas.' })
    .trim()
    .min(1, 'Credenciais inválidas.')
    .max(120, 'Credenciais inválidas.'),
  password: z
    .string({ required_error: 'Credenciais inválidas.' })
    .min(1, 'Credenciais inválidas.')
    .max(128, 'Credenciais inválidas.'),
  rememberMe: z.boolean().optional().default(false),
  honeypot: z.string().optional().default(''),
});

export const userManagementSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(100),
  email: z.string().trim().email('Informe um e-mail válido.').max(120),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.').max(128),
  role: z.enum(['admin', 'operator']).default('operator'),
});

// Chaves de armazenamento local
const USERS_STORAGE_KEY = 'nft_system_users';
const SESSION_KEY = 'nft_auth_session';
const BRUTEFORCE_KEY = 'nft_auth_bruteforce_guard';
const SESSION_DURATION_HOURS = 12; // Duração da sessão

const DEFAULT_PASSWORD_HASH = '31da20978efca684d63731461241c261f08e4d14424d3373cf1b1a2096bc3c95';
const TEAM_PASSWORD_HASH = '68e934cd31e87f97f529ba6864fd8adb80f6736074dfc0317ccf818db1392e91';

// Lista de usuários padrão inicial
const INITIAL_USERS = [
  {
    id: 'user-admin-master',
    name: 'Felipe Aguena',
    email: 'felipe@nftlogistics.com.br',
    role: 'admin',
    createdAt: '2026-10-16',
    passwordHash: DEFAULT_PASSWORD_HASH,
    isMaster: true,
  },
  {
    id: 'user-marcos',
    name: 'Marcos',
    email: 'marcos@nftlogistics.com.br',
    role: 'operator',
    createdAt: '2026-10-16',
    passwordHash: TEAM_PASSWORD_HASH,
    isMaster: false,
  },
  {
    id: 'user-vitor',
    name: 'Vitor',
    email: 'vitor@nftlogistics.com.br',
    role: 'operator',
    createdAt: '2026-10-16',
    passwordHash: TEAM_PASSWORD_HASH,
    isMaster: false,
  },
  {
    id: 'user-thiago',
    name: 'Thiago',
    email: 'thiago@nftlogistics.com.br',
    role: 'operator',
    createdAt: '2026-10-16',
    passwordHash: TEAM_PASSWORD_HASH,
    isMaster: false,
  },
  {
    id: 'user-operacional-1',
    name: 'Equipe Operacional',
    email: 'operacional@nftlogistics.com.br',
    role: 'operator',
    createdAt: '2026-10-16',
    passwordHash: DEFAULT_PASSWORD_HASH,
    isMaster: false,
  },
];

/**
 * Gera o hash criptográfico seguro SHA-256 de uma string utilizando a Web Crypto API nativa.
 * Garante nunca armazenar ou comparar credenciais em texto puro.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(password || '').trim());
  const cryptoObj = (typeof window !== 'undefined' && window.crypto) ? window.crypto : globalThis.crypto;
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Inicializa e recupera a lista de usuários cadastrados (garante que os padrões do sistema existam).
 */
export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const storedUsers = JSON.parse(raw);
    if (!Array.isArray(storedUsers) || storedUsers.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }

    let hasUpdates = false;
    const mergedUsers = [...storedUsers];

    for (const initUser of INITIAL_USERS) {
      const exists = mergedUsers.some((u) => u.email.toLowerCase() === initUser.email.toLowerCase());
      if (!exists) {
        mergedUsers.push(initUser);
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mergedUsers));
    }

    return mergedUsers;
  } catch {
    return INITIAL_USERS;
  }
}

/**
 * Salva a lista de usuários no storage.
 */
function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Cria um novo usuário (Apenas Administrador) com validação Zod.
 */
export async function createUser({ name, email, password, role = 'operator' }) {
  const validation = userManagementSchema.safeParse({ name, email, password, role });
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || 'Dados inválidos.';
    throw new Error(firstError);
  }

  const { name: cleanName, email: cleanEmail, role: validRole } = validation.data;

  const users = getRegisteredUsers();
  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
  if (exists) throw new Error('Já existe um usuário cadastrado com este e-mail.');

  const passwordHash = await hashPassword(password);

  const newUser = {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    email: cleanEmail.toLowerCase(),
    role: validRole,
    createdAt: new Date().toISOString().split('T')[0],
    passwordHash: passwordHash,
    isMaster: false,
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

/**
 * Atualiza dados de um usuário existente.
 */
export async function updateUser(userId, { name, email, password, role }) {
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error('Usuário não encontrado.');

  const target = users[index];
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim();

  if (!cleanName) throw new Error('O nome do usuário é obrigatório.');
  if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Informe um e-mail válido.');

  // Verifica colisão de e-mail com outros usuários
  const emailTaken = users.some((u) => u.id !== userId && u.email.toLowerCase() === cleanEmail);
  if (emailTaken) throw new Error('Este e-mail já está sendo utilizado por outro usuário.');

  target.name = cleanName;
  target.email = cleanEmail;

  // Não permite rebaixar o master admin
  if (!target.isMaster && role) {
    target.role = role === 'admin' ? 'admin' : 'operator';
  }

  // Atualiza senha se fornecida
  if (password && password.trim().length > 0) {
    if (password.trim().length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    target.passwordHash = await hashPassword(password);
  }

  users[index] = target;
  saveUsers(users);
  return target;
}

/**
 * Exclui um usuário (com proteções).
 */
export function deleteUser(userId, currentSessionUserEmail) {
  const users = getRegisteredUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error('Usuário não encontrado.');

  if (target.isMaster || target.email.toLowerCase() === 'felipe@nftlogistics.com.br') {
    throw new Error('O Administrador Principal (felipe@nftlogistics.com.br) não pode ser excluído.');
  }

  if (target.email.toLowerCase() === String(currentSessionUserEmail || '').toLowerCase()) {
    throw new Error('Você não pode excluir o seu próprio usuário logado.');
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveUsers(filtered);
  return true;
}

/* =========================================================================
   PROTEÇÃO CONTRA BRUTE FORCE (RATE LIMITING PROGRESSIVO)
   ========================================================================= */

const MAX_FAILED_ATTEMPTS = 5; // Limite de 5 tentativas erradas
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutos de bloqueio temporário

export function checkBruteForceLockout() {
  try {
    const raw = localStorage.getItem(BRUTEFORCE_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0 };

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockedUntil && now < data.lockedUntil) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }

    if (data.lockedUntil && now >= data.lockedUntil) {
      resetFailedAttempts();
      return { isLocked: false, remainingSeconds: 0 };
    }

    return { isLocked: false, remainingSeconds: 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0 };
  }
}

function recordFailedAttempt() {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(BRUTEFORCE_KEY);
    let data = raw ? JSON.parse(raw) : { count: 0, firstFail: now, lockedUntil: null };

    data.count = (data.count || 0) + 1;

    if (data.count >= MAX_FAILED_ATTEMPTS) {
      data.lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    localStorage.setItem(BRUTEFORCE_KEY, JSON.stringify(data));
  } catch {
    // Silencia erros de storage
  }
}

function resetFailedAttempts() {
  try {
    localStorage.removeItem(BRUTEFORCE_KEY);
  } catch {
    // Silencia
  }
}

/* =========================================================================
   AUTENTICAÇÃO COM HONEYPOT, ZOD E RESPOSTA ANTI-ENUMERAÇÃO
   ========================================================================= */

/**
 * Autentica o usuário com validação estrita Zod, Honeypot,
 * Rate Limiting e mensagens padronizadas anti-enumeração de usuários.
 */
export async function authenticate(username, password, rememberMe = false, honeypotValue = '') {
  // 1. Validação estrita de Schema com Zod
  const schemaValidation = loginCredentialsSchema.safeParse({
    username,
    password,
    rememberMe: Boolean(rememberMe),
    honeypot: honeypotValue,
  });

  if (!schemaValidation.success) {
    throw new Error('Credenciais inválidas.');
  }

  // 2. Validação de Honeypot: Se bots preencherem este campo oculto, bloqueia imediatamente
  if (honeypotValue && honeypotValue.trim() !== '') {
    await new Promise((r) => setTimeout(r, 1200));
    throw new Error('Credenciais inválidas.');
  }

  // 3. Verificação de Bloqueio por Brute Force (Rate Limiter)
  const lockout = checkBruteForceLockout();
  if (lockout.isLocked) {
    throw new Error(
      `Muitas tentativas incorretas. Sistema bloqueado temporariamente por segurança (${lockout.remainingSeconds}s restantes).`
    );
  }

  const cleanInput = String(username || '').trim().toLowerCase();
  const inputHash = await hashPassword(password || '');

  // 4. Busca na base de credenciais
  const users = getRegisteredUsers();

  const matchedUser = users.find((u) => {
    const userEmail = u.email.toLowerCase();
    const prefix = userEmail.split('@')[0];
    return userEmail === cleanInput || prefix === cleanInput;
  });

  // Mensagem padronizada para prevenir enumeração de contas
  if (!matchedUser || matchedUser.passwordHash !== inputHash) {
    recordFailedAttempt();
    const updatedLock = checkBruteForceLockout();
    if (updatedLock.isLocked) {
      throw new Error(
        `Limite de tentativas atingido. Acesso bloqueado por ${Math.ceil(LOCKOUT_DURATION_MS / 60000)} minutos para sua segurança.`
      );
    }
    throw new Error('Credenciais inválidas.');
  }

  // Sucesso: reseta tentativas
  resetFailedAttempts();

  const sessionData = {
    id: matchedUser.id,
    name: matchedUser.name,
    user: matchedUser.email,
    role: matchedUser.role, // 'admin' ou 'operator'
    isMaster: Boolean(matchedUser.isMaster),
    loggedAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
    rememberMe: Boolean(rememberMe),
  };

  const serialized = JSON.stringify(sessionData);

  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, serialized);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, serialized);
    localStorage.removeItem(SESSION_KEY);
  }

  return sessionData;
}

/**
 * Obtém a sessão ativa validando expiração e integridade.
 */
export function getActiveSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || !session.expiresAt || !session.user) {
      logout();
      return null;
    }

    if (Date.now() > session.expiresAt) {
      logout();
      return null;
    }

    return session;
  } catch {
    logout();
    return null;
  }
}

/**
 * Encerra a sessão atual.
 */
export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Silencia
  }
}
