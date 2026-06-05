import { PublicClientApplication, type AccountInfo } from '@azure/msal-browser';
import type { User } from '../types/user';

const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string;
const APP_URL = import.meta.env.VITE_APP_URL as string;

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: `${APP_URL}/auth/microsoft/callback`,
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: false,
  },
};

// Mail read + send + modify (needed for trash and permanent delete)
const loginScopes = ['openid', 'profile', 'email', 'Mail.Read', 'Mail.Send', 'Mail.ReadWrite'];

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  return msalInstance;
}

export async function initiateMicrosoftLogin(): Promise<void> {
  const msal = await getMsalInstance();
  await msal.loginRedirect({ scopes: loginScopes });
}

export async function handleMicrosoftCallback(): Promise<User | null> {
  const msal = await getMsalInstance();

  try {
    const result = await msal.handleRedirectPromise();
    if (!result) return null;

    const account: AccountInfo = result.account;

    const user: User = {
      id: account.homeAccountId,
      email: account.username,
      name: account.name || account.username,
      provider: 'microsoft',
      accessToken: result.accessToken,
      tokenExpiry: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600 * 1000,
      tone: 'friendly',
    };

    return user;
  } catch {
    return null;
  }
}

export async function refreshMicrosoftToken(_user: User): Promise<{ accessToken: string; tokenExpiry: number }> {
  const msal = await getMsalInstance();
  const accounts = msal.getAllAccounts();

  if (accounts.length === 0) throw new Error('No Microsoft account found. Please sign in again.');

  const result = await msal.acquireTokenSilent({
    scopes: loginScopes,
    account: accounts[0],
  });

  return {
    accessToken: result.accessToken,
    tokenExpiry: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600 * 1000,
  };
}
