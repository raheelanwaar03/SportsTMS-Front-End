const isLiveServer = ['5500', '5501', '5502'].includes(globalThis.location?.port);

const proxiedBases = {
    auth: '/api',
    tournaments: '/api/tournaments',
    teams: '/api/teams',
    matches: '/api/matches',
    standings: '/api/standings',
    announcements: '/api/announcements'
};

const dockerHostBases = {
    auth: 'http://127.0.0.1:5000/api',
    tournaments: 'http://127.0.0.1:6000/api/tournaments',
    teams: 'http://127.0.0.1:7000/api/teams',
    matches: 'http://127.0.0.1:8000/api/matches',
    standings: 'http://127.0.0.1:9000/api/standings',
    announcements: 'http://127.0.0.1:10000/api/announcements'
};

const apiBases = {
    ...(isLiveServer ? dockerHostBases : proxiedBases),
    ...(globalThis.SPORT_TMS_API_BASES || {})
};

export const AUTH_TOKEN_KEY = 'authToken';
export const AUTH_USER_KEY = 'authUser';

// Authentication API
export const AUTHENTICATION_API = {
    BASE_URL: apiBases.auth,
    LOGIN: '/users/login',
    REGISTER: '/users/register'
};

// Tournament API
export const TOURNAMENT_API = {
    BASE_URL: apiBases.tournaments,
    CREATE_TOURNAMENT: '',
    GET_ALL_TOURNAMENTS: '',
    GET_TOURNAMENT: '/:id',
    UPDATE_TOURNAMENT: '/:id',
    DELETE_TOURNAMENT: '/:id'
};

// Team API
export const TEAM_API = {
    BASE_URL: apiBases.teams,
    REGISTER_TEAM: '',
    GET_ALL_TEAMS: '',
    GET_TEAM: '/:id',
    UPDATE_TEAM: '/:id',
    DELETE_TEAM: '/:id',
    ADD_PLAYER: '/:id/players'
};

// Match API
export const MATCH_API = {
    BASE_URL: apiBases.matches,
    SCHEDULE_MATCH: '',
    GET_ALL_MATCHES: '',
    GET_MATCH: '/:id',
    UPDATE_MATCH_RESULT: '/:id/result'
};

// Standings API
export const STANDINGS_API = {
    BASE_URL: apiBases.standings,
    GET_TOURNAMENT_STANDINGS: '/:tournamentId'
};

// Announcements API
export const ANNOUNCEMENTS_API = {
    BASE_URL: apiBases.announcements,
    CREATE_ANNOUNCEMENT: '',
    GET_ALL_ANNOUNCEMENTS: '',
    GET_ANNOUNCEMENT: '/:id'
};

export class ApiError extends Error {
    constructor(message, status = 0, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export async function requestJson(url, options = {}) {
    const {
        method = 'GET',
        body,
        token = getAuthToken(),
        headers = {}
    } = options;

    const requestHeaders = {
        Accept: 'application/json',
        ...headers
    };

    const requestOptions = {
        method,
        headers: requestHeaders
    };

    if (body !== undefined && body !== null) {
        requestHeaders['Content-Type'] = 'application/json';
        requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(url, requestOptions);
    } catch (error) {
        throw new ApiError('Could not connect to the service. Check that the API is running.', 0, error);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    const data = parseResponseBody(rawText, contentType);

    if (!response.ok) {
        throw new ApiError(resolveErrorMessage(data, rawText, response.status), response.status, data);
    }

    return data;
}

export function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveAuthSession(data) {
    if (data?.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    }

    if (data?.user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    }
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
    } catch {
        return null;
    }
}

export function getCurrentUser() {
    const storedUser = getStoredUser();
    const tokenUser = getUserFromToken(getAuthToken());
    return {
        ...(tokenUser || {}),
        ...(storedUser || {})
    };
}

export function getUserFromToken(token) {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    if (payload.user && typeof payload.user === 'object') {
        return payload.user;
    }

    return payload;
}

export function decodeJwtPayload(token) {
    if (!token || !token.includes('.')) return null;

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const jsonPayload = decodeURIComponent(
            atob(padded)
                .split('')
                .map((character) => `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`)
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function normalizeCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.tournaments)) return data.tournaments;
    if (Array.isArray(data?.teams)) return data.teams;
    if (Array.isArray(data?.matches)) return data.matches;
    if (Array.isArray(data?.announcements)) return data.announcements;
    return [];
}

export function buildUrl(baseUrl, path = '', params = {}) {
    return `${baseUrl}${replacePathParams(path, params)}`;
}

export function replacePathParams(path, params) {
    return Object.entries(params).reduce(
        (currentPath, [key, value]) => currentPath.replace(`:${key}`, encodeURIComponent(value)),
        path
    );
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    if (error instanceof ApiError) return error.message;
    return error?.message || fallback;
}

function parseResponseBody(rawText, contentType) {
    if (!rawText) return null;

    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(rawText);
        } catch {
            return rawText;
        }
    }

    return rawText;
}

function resolveErrorMessage(data, rawText, status) {
    if (typeof data === 'string' && data.trim()) {
        return stripHtml(data).trim() || `Request failed with status ${status}.`;
    }

    return (
        data?.message ||
        data?.msg ||
        data?.error ||
        data?.errors?.[0]?.message ||
        `Request failed with status ${status}.`
    );
}

function stripHtml(value) {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}
