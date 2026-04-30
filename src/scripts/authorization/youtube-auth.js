import { BrowserWindow } from 'electron';
import { Innertube } from 'youtubei.js';
import Logger from '../logging/logger';
import { injectDefaults } from '../store/defaults';

const { youtubeAccountsConfig } = injectDefaults();

const YOUTUBE_SIGN_IN_URL =
  'https://accounts.google.com/ServiceLogin?service=youtube&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2F';
const YOUTUBE_COOKIE_REFRESH_TIMEOUT_MS = 5 * 60 * 1000;
const YOUTUBE_AUTH_COOKIE_NAMES = ['SAPISID', '__Secure-1PAPISID', '__Secure-3PAPISID'];

const cookieRefreshPromises = new Map();

function getStoredYoutubeCookies(accountType) {
  return youtubeAccountsConfig.get(`${accountType}.cookies`) || '';
}

function getYoutubeAuthPartition(accountType) {
  return `persist:youtube-auth-${accountType}`;
}

function isYoutubeCookie(cookie) {
  return cookie?.domain === 'youtube.com' || cookie?.domain?.endsWith('.youtube.com');
}

function normalizeCookieString(cookieString) {
  return cookieString
    .split(';')
    .map((cookiePart) => cookiePart.trim())
    .filter(Boolean)
    .sort()
    .join('; ');
}

async function getYoutubeSessionCookies(session) {
  const cookies = await session.cookies.get({});
  return cookies.filter(isYoutubeCookie);
}

async function buildYoutubeCookieString(session) {
  const youtubeCookies = await getYoutubeSessionCookies(session);

  return youtubeCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

async function hasYoutubeAuthCookies(session) {
  const youtubeCookies = await getYoutubeSessionCookies(session);
  const cookieNames = new Set(youtubeCookies.map((cookie) => cookie.name));

  return YOUTUBE_AUTH_COOKIE_NAMES.some((cookieName) => cookieNames.has(cookieName));
}

function createYoutubeReauthError(message, cause) {
  const error = new Error(message);
  error.code = 'YOUTUBE_REAUTH_REQUIRED';

  if (cause) {
    error.cause = cause;
  }

  return error;
}

export function isYoutubeReauthRequiredError(error) {
  return error?.code === 'YOUTUBE_REAUTH_REQUIRED';
}

export function isYoutubeAuthError(error) {
  const status = error?.response?.status || error?.status || error?.status_code;
  const message = String(error?.message || '').toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    message.includes('request failed with status code 400') ||
    message.includes('bad request') ||
    message.includes('login_required') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid cookie') ||
    message.includes('credentials') ||
    message.includes('authorization') ||
    message.includes('sapisid') ||
    message.includes('sapisidhash')
  );
}

export async function withYoutubeRetry(accountType, actionName, actionFn) {
  const executeAction = async () => {
    const cookies = getStoredYoutubeCookies(accountType);

    if (!cookies) {
      throw createYoutubeReauthError(`No cookies found for YouTube ${accountType} account.`);
    }

    const yt = await Innertube.create({ cookie: cookies });
    return await actionFn(yt);
  };

  try {
    return await executeAction();
  } catch (error) {
    if (isYoutubeReauthRequiredError(error) || !isYoutubeAuthError(error)) {
      throw error;
    }

    Logger.warn(
      `YouTube ${actionName} failed with an auth error. Refreshing ${accountType} cookies.`
    );

    const refreshResult = await refreshYoutubeCookiesOnce(accountType, {
      allowExistingCookies: false
    });

    if (!refreshResult.success) {
      throw createYoutubeReauthError(
        refreshResult.error || `Failed to refresh YouTube ${accountType} cookies.`,
        error
      );
    }

    try {
      return await executeAction();
    } catch (retryError) {
      if (isYoutubeAuthError(retryError)) {
        throw createYoutubeReauthError(
          `Refreshed YouTube ${accountType} cookies, but ${actionName} is still unauthorized.`,
          retryError
        );
      }

      throw retryError;
    }
  }
}

export async function refreshYoutubeCookiesOnce(accountType, options = {}) {
  if (!cookieRefreshPromises.has(accountType)) {
    cookieRefreshPromises.set(
      accountType,
      (async () => {
        try {
          return await refreshYoutubeCookies(accountType, options);
        } finally {
          cookieRefreshPromises.delete(accountType);
        }
      })()
    );
  }

  return await cookieRefreshPromises.get(accountType);
}

export function refreshYoutubeCookies(accountType = 'broadcaster', options = {}) {
  const existingCookies = normalizeCookieString(getStoredYoutubeCookies(accountType));
  const allowExistingCookies = options.allowExistingCookies !== false;
  const authWindow = new BrowserWindow({
    width: 600,
    height: 800,
    autoHideMenuBar: true,
    title: 'YouTube Authentication',
    webPreferences: {
      nodeIntegration: false,
      partition: getYoutubeAuthPartition(accountType)
    }
  });
  const authWebContents = authWindow.webContents;
  const authSession = authWebContents.session;

  return new Promise((resolve) => {
    let settled = false;

    const attemptCookieCapture = async () => {
      try {
        const hasAuthCookies = await hasYoutubeAuthCookies(authSession);
        if (!hasAuthCookies) {
          return;
        }

        const youtubeCookies = await buildYoutubeCookieString(authSession);
        if (!youtubeCookies) {
          return;
        }

        if (
          !allowExistingCookies &&
          existingCookies &&
          normalizeCookieString(youtubeCookies) === existingCookies
        ) {
          return;
        }

        youtubeAccountsConfig.set(`${accountType}.cookies`, youtubeCookies);
        Logger.log(`Stored refreshed YouTube cookies for ${accountType}`);
        finish({ success: true, data: youtubeCookies });
      } catch (error) {
        Logger.error(`Failed to capture YouTube cookies: ${error.message}`);
      }
    };

    const handleCookieChange = () => {
      void attemptCookieCapture();
    };

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      authWebContents.removeListener('did-finish-load', handlePageLoad);
      authWebContents.removeListener('did-navigate', handlePageLoad);
      authSession.cookies.removeListener('changed', handleCookieChange);

      if (!authWindow.isDestroyed()) {
        authWindow.close();
      }

      resolve(result);
    };

    const handlePageLoad = () => {
      void attemptCookieCapture();
    };

    const timeoutId = setTimeout(() => {
      finish({
        success: false,
        error: 'Timed out waiting for refreshed YouTube cookies. Please sign in again.'
      });
    }, YOUTUBE_COOKIE_REFRESH_TIMEOUT_MS);

    authWindow.on('closed', () => {
      if (!settled) {
        finish({
          success: false,
          error: 'YouTube authentication was cancelled before cookies were refreshed.'
        });
      }
    });

    authWebContents.on('did-finish-load', handlePageLoad);
    authWebContents.on('did-navigate', handlePageLoad);
    authSession.cookies.on('changed', handleCookieChange);

    authWindow.loadURL(options.url || YOUTUBE_SIGN_IN_URL);
  });
}
