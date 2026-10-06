(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // node_modules/gotrue-js/lib/index.js
  var HTTPError = class extends Error {
    constructor(response) {
      super(response.statusText);
      this.name = "HTTPError";
      this.status = response.status;
    }
  };
  var TextHTTPError = class extends HTTPError {
    constructor(response, data) {
      super(response);
      this.name = "TextHTTPError";
      this.data = data;
    }
  };
  var JSONHTTPError = class extends HTTPError {
    constructor(response, json) {
      super(response);
      this.name = "JSONHTTPError";
      this.json = json;
    }
  };
  var API = class _API {
    constructor(apiURL, options) {
      this.apiURL = apiURL || "";
      this._sameOrigin = /^\/(?!\/)/.test(this.apiURL);
      this.defaultHeaders = options?.defaultHeaders || {};
    }
    headers(headers = {}) {
      return {
        ...this.defaultHeaders,
        "Content-Type": "application/json",
        ...headers
      };
    }
    static async parseJsonResponse(response) {
      const json = await response.json();
      if (!response.ok) {
        throw new JSONHTTPError(response, json);
      }
      return json;
    }
    async request(path, options = {}) {
      const headers = this.headers(options.headers || {});
      if (!options.body) {
        delete headers["Content-Type"];
      }
      const fetchOptions = {
        ...options,
        headers
      };
      if (this._sameOrigin) {
        fetchOptions.credentials = options.credentials || "same-origin";
      }
      const response = await fetch(this.apiURL + path, fetchOptions);
      const contentType = response.headers.get("Content-Type");
      if (contentType?.includes("json")) {
        return _API.parseJsonResponse(response);
      }
      const data = await response.text();
      if (!response.ok) {
        throw new TextHTTPError(response, data);
      }
      return data;
    }
  };
  var Admin = class {
    constructor(user) {
      this.user = user;
    }
    listUsers(aud) {
      return this.user._request("/admin/users", {
        method: "GET",
        audience: aud
      });
    }
    getUser(user) {
      return this.user._request(`/admin/users/${user.id}`);
    }
    updateUser(user, attributes = {}) {
      return this.user._request(`/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(attributes)
      });
    }
    createUser(email, password, attributes = {}) {
      attributes.email = email;
      attributes.password = password;
      return this.user._request("/admin/users", {
        method: "POST",
        body: JSON.stringify(attributes)
      });
    }
    deleteUser(user) {
      return this.user._request(`/admin/users/${user.id}`, {
        method: "DELETE"
      });
    }
  };
  var ExpiryMargin = 60 * 1e3;
  var storageKey = "gotrue.user";
  var refreshPromises = {};
  var currentUser = null;
  var forbiddenUpdateAttributes = { api: 1, token: 1, audience: 1, url: 1 };
  var forbiddenSaveAttributes = { api: 1 };
  var isBrowser = () => typeof window !== "undefined";
  var storageListenerActive = false;
  function ensureStorageListener() {
    if (!storageListenerActive && isBrowser()) {
      storageListenerActive = true;
      window.addEventListener("storage", (event) => {
        if (event.key === storageKey) {
          currentUser = null;
        }
      });
    }
  }
  var User = class _User {
    constructor(api, tokenResponse, audience) {
      this.token = null;
      this.api = api;
      this.url = api.apiURL;
      this.audience = audience;
      this._processTokenResponse(tokenResponse);
      currentUser = this;
      ensureStorageListener();
    }
    static removeSavedSession() {
      isBrowser() && localStorage.removeItem(storageKey);
    }
    static recoverSession(apiInstance) {
      ensureStorageListener();
      if (currentUser) {
        return currentUser;
      }
      const json = isBrowser() && localStorage.getItem(storageKey);
      if (json) {
        try {
          const data = JSON.parse(json);
          const { url, token, audience } = data;
          if (!url || !token) {
            return null;
          }
          const api = apiInstance || new API(url, {});
          return new _User(api, token, audience)._saveUserData(data, true);
        } catch (error) {
          console.error(new Error(`Gotrue-js: Error recovering session: ${error}`));
          return null;
        }
      }
      return null;
    }
    get admin() {
      return new Admin(this);
    }
    async update(attributes) {
      const response = await this._request("/user", {
        method: "PUT",
        body: JSON.stringify(attributes)
      });
      return this._saveUserData(response)._refreshSavedSession();
    }
    jwt(forceRefresh) {
      const token = this.tokenDetails();
      if (token === null || token === void 0) {
        return Promise.reject(new Error(`Gotrue-js: failed getting jwt access token`));
      }
      const { expires_at, refresh_token, access_token } = token;
      if (forceRefresh || expires_at - ExpiryMargin < Date.now()) {
        return this._refreshToken(refresh_token);
      }
      return Promise.resolve(access_token);
    }
    logout() {
      return this._request("/logout", { method: "POST" }).then(this.clearSession.bind(this)).catch(this.clearSession.bind(this));
    }
    _refreshToken(refresh_token) {
      const existingPromise = refreshPromises[refresh_token];
      if (existingPromise) {
        return existingPromise;
      }
      const refreshRequest = this.api.request("/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`
      });
      const timeoutPromise = new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error("Token refresh timeout")), 3e4);
      });
      const promise = Promise.race([refreshRequest, timeoutPromise]).then((response) => {
        delete refreshPromises[refresh_token];
        this._processTokenResponse(response);
        this._refreshSavedSession();
        if (!this.token) {
          throw new Error("Gotrue-js: Token not set after refresh");
        }
        return this.token.access_token;
      }).catch((error) => {
        delete refreshPromises[refresh_token];
        this.clearSession();
        throw error;
      });
      refreshPromises[refresh_token] = promise;
      return promise;
    }
    async _request(path, options = {}) {
      options.headers = options.headers || {};
      const aud = options.audience || this.audience;
      if (aud) {
        options.headers["X-JWT-AUD"] = aud;
      }
      try {
        const token = await this.jwt();
        return await this.api.request(path, {
          headers: Object.assign(options.headers, {
            Authorization: `Bearer ${token}`
          }),
          ...options
        });
      } catch (error) {
        if (error instanceof JSONHTTPError && error.json) {
          if (error.json.msg) {
            error.message = error.json.msg;
          } else if (error.json.error) {
            error.message = `${error.json.error}: ${error.json.error_description}`;
          }
        }
        throw error;
      }
    }
    async getUserData() {
      const response = await this._request("/user");
      return this._saveUserData(response)._refreshSavedSession();
    }
    _saveUserData(attributes, fromStorage) {
      for (const key in attributes) {
        if (key in _User.prototype || key in forbiddenUpdateAttributes) {
          continue;
        }
        this[key] = attributes[key];
      }
      if (fromStorage) {
        this._fromStorage = true;
      }
      return this;
    }
    _processTokenResponse(tokenResponse) {
      this.token = tokenResponse;
      try {
        const claims = JSON.parse(urlBase64Decode(tokenResponse.access_token.split(".")[1]));
        this.token.expires_at = claims.exp * 1e3;
      } catch (error) {
        console.error(new Error(`Gotrue-js: Failed to parse tokenResponse claims: ${error}`));
      }
    }
    _refreshSavedSession() {
      if (isBrowser() && localStorage.getItem(storageKey)) {
        this._saveSession();
      }
      return this;
    }
    get _details() {
      const userCopy = {};
      for (const key in this) {
        if (key in _User.prototype || key in forbiddenSaveAttributes) {
          continue;
        }
        userCopy[key] = this[key];
      }
      return userCopy;
    }
    _saveSession() {
      isBrowser() && localStorage.setItem(storageKey, JSON.stringify(this._details));
      return this;
    }
    tokenDetails() {
      return this.token;
    }
    clearSession() {
      _User.removeSavedSession();
      this.token = null;
      currentUser = null;
    }
  };
  function base64Decode(base64) {
    if (typeof atob === "function") {
      return atob(base64);
    }
    return Buffer.from(base64, "base64").toString("binary");
  }
  function urlBase64Decode(str) {
    let output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += "==";
        break;
      case 3:
        output += "=";
        break;
      default:
        throw new Error("Illegal base64url string!");
    }
    const binaryString = base64Decode(output);
    try {
      const bytes = Uint8Array.from(binaryString, (char) => char.codePointAt(0) ?? 0);
      return new TextDecoder().decode(bytes);
    } catch {
      return binaryString;
    }
  }
  var HTTPRegexp = /^http:\/\//;
  var defaultApiURL = `/.netlify/identity`;
  var GoTrue = class {
    constructor({
      APIUrl = defaultApiURL,
      audience = "",
      setCookie = false,
      clientName = "gotrue-js"
    } = {}) {
      if (HTTPRegexp.test(APIUrl)) {
        console.warn(
          "Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely."
        );
      }
      if (audience) {
        this.audience = audience;
      }
      this.setCookie = setCookie;
      this.api = new API(APIUrl, { defaultHeaders: { "X-Nf-Client": clientName } });
    }
    async _request(path, options = {}) {
      options.headers = options.headers || {};
      const aud = options.audience || this.audience;
      if (aud) {
        options.headers["X-JWT-AUD"] = aud;
      }
      try {
        return await this.api.request(path, options);
      } catch (error) {
        if (error instanceof JSONHTTPError && error.json) {
          if (error.json.msg) {
            error.message = error.json.msg;
          } else if (error.json.error) {
            error.message = `${error.json.error}: ${error.json.error_description}`;
          }
        }
        throw error;
      }
    }
    settings() {
      return this._request("/settings");
    }
    signup(email, password, data) {
      return this._request("/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, data })
      });
    }
    login(email, password, remember) {
      this._setRememberHeaders(remember);
      return this._request("/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=password&username=${encodeURIComponent(
          email
        )}&password=${encodeURIComponent(password)}`
      }).then((response) => {
        User.removeSavedSession();
        return this.createUser(response, remember);
      });
    }
    loginExternalUrl(provider) {
      return `${this.api.apiURL}/authorize?provider=${provider}`;
    }
    confirm(token, remember) {
      this._setRememberHeaders(remember);
      return this.verify("signup", token, remember);
    }
    requestPasswordRecovery(email) {
      return this._request("/recover", {
        method: "POST",
        body: JSON.stringify({ email })
      });
    }
    recover(token, remember) {
      this._setRememberHeaders(remember);
      return this.verify("recovery", token, remember);
    }
    acceptInvite(token, password, remember) {
      this._setRememberHeaders(remember);
      return this._request("/verify", {
        method: "POST",
        body: JSON.stringify({ token, password, type: "signup" })
      }).then((response) => this.createUser(response, remember));
    }
    acceptInviteExternalUrl(provider, token) {
      return `${this.api.apiURL}/authorize?provider=${provider}&invite_token=${token}`;
    }
    createUser(tokenResponse, remember = false) {
      this._setRememberHeaders(remember);
      const user = new User(this.api, tokenResponse, this.audience || "");
      return user.getUserData().then((userData) => {
        if (remember) {
          userData._saveSession();
        }
        return userData;
      });
    }
    currentUser() {
      const user = User.recoverSession(this.api);
      user && this._setRememberHeaders(user._fromStorage);
      return user;
    }
    async validateCurrentSession() {
      const user = this.currentUser();
      if (!user) {
        return null;
      }
      try {
        return await user.getUserData();
      } catch {
        user.clearSession();
        return null;
      }
    }
    verify(type, token, remember) {
      this._setRememberHeaders(remember);
      return this._request("/verify", {
        method: "POST",
        body: JSON.stringify({ token, type })
      }).then((response) => this.createUser(response, remember));
    }
    _setRememberHeaders(remember) {
      if (this.setCookie) {
        this.api.defaultHeaders = this.api.defaultHeaders || {};
        this.api.defaultHeaders["X-Use-Cookie"] = remember ? "1" : "session";
      }
    }
  };
  if (typeof window !== "undefined") {
    window.GoTrue = GoTrue;
  }

  // node_modules/@netlify/identity/dist/main.js
  var __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof __require !== "undefined" ? __require : a)[b]
  }) : x)(function(x) {
    if (typeof __require !== "undefined") return __require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var AUTH_PROVIDERS = ["google", "github", "gitlab", "bitbucket", "facebook", "email"];
  var AuthError = class _AuthError extends Error {
    constructor(message, status, options) {
      super(message);
      this.name = "AuthError";
      this.status = status;
      if (options && "cause" in options) {
        this.cause = options.cause;
      }
    }
    static from(error) {
      if (error instanceof _AuthError) return error;
      const message = error instanceof Error ? error.message : String(error);
      return new _AuthError(message, void 0, { cause: error });
    }
  };
  var MissingIdentityError = class extends Error {
    constructor(message = "Netlify Identity is not available.") {
      super(message);
      this.name = "MissingIdentityError";
    }
  };
  var IDENTITY_PATH = "/.netlify/identity";
  var goTrueClient = null;
  var cachedApiUrl;
  var warnedMissingUrl = false;
  var isBrowser2 = () => typeof window !== "undefined" && typeof window.location !== "undefined";
  var discoverApiUrl = () => {
    if (cachedApiUrl !== void 0) return cachedApiUrl;
    if (isBrowser2()) {
      cachedApiUrl = `${window.location.origin}${IDENTITY_PATH}`;
    } else {
      const identityContext = getIdentityContext();
      if (identityContext?.url) {
        cachedApiUrl = identityContext.url;
      } else if (globalThis.Netlify?.context?.url) {
        cachedApiUrl = new URL(IDENTITY_PATH, globalThis.Netlify.context.url).href;
      } else if (typeof process !== "undefined" && process.env?.URL) {
        cachedApiUrl = new URL(IDENTITY_PATH, process.env.URL).href;
      }
    }
    return cachedApiUrl ?? null;
  };
  var getGoTrueClient = () => {
    if (goTrueClient) return goTrueClient;
    const apiUrl = discoverApiUrl();
    if (!apiUrl) {
      if (!warnedMissingUrl) {
        console.warn(
          "@netlify/identity: Could not determine the Identity endpoint URL. Make sure your site has Netlify Identity enabled, or run your app with `netlify dev`."
        );
        warnedMissingUrl = true;
      }
      return null;
    }
    goTrueClient = new GoTrue({ APIUrl: apiUrl, setCookie: false });
    return goTrueClient;
  };
  var getClient = () => {
    const client = getGoTrueClient();
    if (!client) throw new MissingIdentityError();
    return client;
  };
  var getIdentityContext = () => {
    const identityContext = globalThis.netlifyIdentityContext;
    if (identityContext?.url) {
      return {
        url: identityContext.url,
        token: identityContext.token
      };
    }
    if (globalThis.Netlify?.context?.url) {
      return { url: new URL(IDENTITY_PATH, globalThis.Netlify.context.url).href };
    }
    const siteUrl = typeof process !== "undefined" ? process.env?.URL : void 0;
    if (siteUrl) {
      return { url: new URL(IDENTITY_PATH, siteUrl).href };
    }
    return null;
  };
  var NF_JWT_COOKIE = "nf_jwt";
  var NF_REFRESH_COOKIE = "nf_refresh";
  var getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const match = new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`).exec(document.cookie);
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  };
  var setAuthCookies = (cookies, accessToken, refreshToken) => {
    cookies.set({
      name: NF_JWT_COOKIE,
      value: accessToken,
      httpOnly: false,
      secure: true,
      path: "/",
      sameSite: "Lax"
    });
    if (refreshToken) {
      cookies.set({
        name: NF_REFRESH_COOKIE,
        value: refreshToken,
        httpOnly: false,
        secure: true,
        path: "/",
        sameSite: "Lax"
      });
    }
  };
  var deleteAuthCookies = (cookies) => {
    cookies.delete(NF_JWT_COOKIE);
    cookies.delete(NF_REFRESH_COOKIE);
  };
  var setBrowserAuthCookies = (accessToken, refreshToken) => {
    if (typeof document === "undefined") return;
    document.cookie = `${NF_JWT_COOKIE}=${encodeURIComponent(accessToken)}; path=/; secure; samesite=lax`;
    if (refreshToken) {
      document.cookie = `${NF_REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; path=/; secure; samesite=lax`;
    }
  };
  var deleteBrowserAuthCookies = () => {
    if (typeof document === "undefined") return;
    document.cookie = `${NF_JWT_COOKIE}=; path=/; secure; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${NF_REFRESH_COOKIE}=; path=/; secure; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };
  var getServerCookie = (name) => {
    const cookies = globalThis.Netlify?.context?.cookies;
    if (!cookies || typeof cookies.get !== "function") return null;
    return cookies.get(name) ?? null;
  };
  var nextHeadersFn;
  var triggerNextjsDynamic = () => {
    if (nextHeadersFn === null) return;
    if (nextHeadersFn === void 0) {
      try {
        if (typeof __require2 === "undefined") {
          nextHeadersFn = null;
          return;
        }
        const mod = __require2("next/headers");
        nextHeadersFn = mod.headers;
      } catch {
        nextHeadersFn = null;
        return;
      }
    }
    const fn = nextHeadersFn;
    if (!fn) return;
    try {
      fn();
    } catch (e) {
      if (e instanceof Error && ("digest" in e || /bail\s*out.*prerende/i.test(e.message))) {
        throw e;
      }
    }
  };
  var DEFAULT_TIMEOUT_MS = 5e3;
  var fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const pathname = new URL(url).pathname;
        throw new AuthError(`Identity request to ${pathname} timed out after ${String(timeoutMs)}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
  var AUTH_EVENTS = {
    LOGIN: "login",
    LOGOUT: "logout",
    TOKEN_REFRESH: "token_refresh",
    USER_UPDATED: "user_updated",
    RECOVERY: "recovery"
  };
  var listeners = /* @__PURE__ */ new Set();
  var emitAuthEvent = (event, user) => {
    for (const listener of listeners) {
      try {
        listener(event, user);
      } catch {
      }
    }
  };
  var REFRESH_MARGIN_S = 60;
  var refreshTimer = null;
  var startTokenRefresh = () => {
    if (!isBrowser2()) return;
    stopTokenRefresh();
    const client = getGoTrueClient();
    const user = client?.currentUser();
    if (!user) return;
    const token = user.tokenDetails();
    if (!token?.expires_at) return;
    const nowS = Math.floor(Date.now() / 1e3);
    const expiresAtS = typeof token.expires_at === "number" && token.expires_at > 1e12 ? Math.floor(token.expires_at / 1e3) : token.expires_at;
    const delayMs = Math.max(0, expiresAtS - nowS - REFRESH_MARGIN_S) * 1e3;
    refreshTimer = setTimeout(() => {
      void (async () => {
        try {
          const freshJwt = await user.jwt(true);
          const freshDetails = user.tokenDetails();
          setBrowserAuthCookies(freshJwt, freshDetails?.refresh_token);
          emitAuthEvent(AUTH_EVENTS.TOKEN_REFRESH, toUser(user));
          startTokenRefresh();
        } catch {
          stopTokenRefresh();
        }
      })();
    }, delayMs);
  };
  var stopTokenRefresh = () => {
    if (refreshTimer !== null) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  };
  var getCookies = () => {
    const cookies = globalThis.Netlify?.context?.cookies;
    if (!cookies) {
      throw new AuthError("Server-side auth requires Netlify Functions runtime");
    }
    return cookies;
  };
  var getServerIdentityUrl = () => {
    const ctx = getIdentityContext();
    if (!ctx?.url) {
      throw new AuthError("Could not determine the Identity endpoint URL on the server");
    }
    return ctx.url;
  };
  var persistSession = true;
  var login = async (email, password) => {
    if (!isBrowser2()) {
      const identityUrl = getServerIdentityUrl();
      const cookies = getCookies();
      const body = new URLSearchParams({
        grant_type: "password",
        username: email,
        password
      });
      let res;
      try {
        res = await fetchWithTimeout(`${identityUrl}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString()
        });
      } catch (error) {
        throw AuthError.from(error);
      }
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new AuthError(
          errorBody.msg ?? errorBody.error_description ?? `Login failed (${String(res.status)})`,
          res.status
        );
      }
      const data = await res.json();
      const accessToken = data.access_token;
      let userRes;
      try {
        userRes = await fetchWithTimeout(`${identityUrl}/user`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch (error) {
        throw AuthError.from(error);
      }
      if (!userRes.ok) {
        const errorBody = await userRes.json().catch(() => ({}));
        throw new AuthError(errorBody.msg ?? `Failed to fetch user data (${String(userRes.status)})`, userRes.status);
      }
      const userData = await userRes.json();
      const user = toUser(userData);
      setAuthCookies(cookies, accessToken, data.refresh_token);
      return user;
    }
    const client = getClient();
    try {
      const gotrueUser = await client.login(email, password, persistSession);
      const jwt = await gotrueUser.jwt();
      setBrowserAuthCookies(jwt, gotrueUser.tokenDetails()?.refresh_token);
      const user = toUser(gotrueUser);
      startTokenRefresh();
      emitAuthEvent(AUTH_EVENTS.LOGIN, user);
      return user;
    } catch (error) {
      throw AuthError.from(error);
    }
  };
  var logout = async () => {
    if (!isBrowser2()) {
      const identityUrl = getServerIdentityUrl();
      const cookies = getCookies();
      const jwt = cookies.get(NF_JWT_COOKIE);
      if (jwt) {
        try {
          await fetchWithTimeout(`${identityUrl}/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${jwt}` }
          });
        } catch {
        }
      }
      deleteAuthCookies(cookies);
      return;
    }
    const client = getClient();
    try {
      const currentUser2 = client.currentUser();
      if (currentUser2) {
        await currentUser2.logout();
      }
      deleteBrowserAuthCookies();
      stopTokenRefresh();
      emitAuthEvent(AUTH_EVENTS.LOGOUT, null);
    } catch (error) {
      throw AuthError.from(error);
    }
  };
  var handleAuthCallback = async () => {
    if (!isBrowser2()) return null;
    const hash = window.location.hash.substring(1);
    if (!hash) return null;
    const client = getClient();
    const params = new URLSearchParams(hash);
    try {
      const accessToken = params.get("access_token");
      if (accessToken) return await handleOAuthCallback(client, params, accessToken);
      const confirmationToken = params.get("confirmation_token");
      if (confirmationToken) return await handleConfirmationCallback(client, confirmationToken);
      const recoveryToken = params.get("recovery_token");
      if (recoveryToken) return await handleRecoveryCallback(client, recoveryToken);
      const inviteToken = params.get("invite_token");
      if (inviteToken) return handleInviteCallback(inviteToken);
      const emailChangeToken = params.get("email_change_token");
      if (emailChangeToken) return await handleEmailChangeCallback(client, emailChangeToken);
      return null;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw AuthError.from(error);
    }
  };
  var handleOAuthCallback = async (client, params, accessToken) => {
    const refreshToken = params.get("refresh_token") ?? "";
    const expiresIn = parseInt(params.get("expires_in") ?? "", 10);
    const expiresAt = parseInt(params.get("expires_at") ?? "", 10);
    const gotrueUser = await client.createUser(
      {
        access_token: accessToken,
        token_type: params.get("token_type") ?? "bearer",
        expires_in: isFinite(expiresIn) ? expiresIn : 3600,
        expires_at: isFinite(expiresAt) ? expiresAt : Math.floor(Date.now() / 1e3) + 3600,
        refresh_token: refreshToken
      },
      persistSession
    );
    setBrowserAuthCookies(accessToken, refreshToken || void 0);
    const user = toUser(gotrueUser);
    startTokenRefresh();
    clearHash();
    emitAuthEvent(AUTH_EVENTS.LOGIN, user);
    return { type: "oauth", user };
  };
  var handleConfirmationCallback = async (client, token) => {
    const gotrueUser = await client.confirm(token, persistSession);
    const jwt = await gotrueUser.jwt();
    setBrowserAuthCookies(jwt, gotrueUser.tokenDetails()?.refresh_token);
    const user = toUser(gotrueUser);
    startTokenRefresh();
    clearHash();
    emitAuthEvent(AUTH_EVENTS.LOGIN, user);
    return { type: "confirmation", user };
  };
  var handleRecoveryCallback = async (client, token) => {
    const gotrueUser = await client.recover(token, persistSession);
    const jwt = await gotrueUser.jwt();
    setBrowserAuthCookies(jwt, gotrueUser.tokenDetails()?.refresh_token);
    const user = toUser(gotrueUser);
    startTokenRefresh();
    clearHash();
    emitAuthEvent(AUTH_EVENTS.RECOVERY, user);
    return { type: "recovery", user };
  };
  var handleInviteCallback = (token) => {
    clearHash();
    return { type: "invite", user: null, token };
  };
  var handleEmailChangeCallback = async (client, emailChangeToken) => {
    const currentUser2 = client.currentUser();
    if (!currentUser2) {
      throw new AuthError("Email change verification requires an active browser session");
    }
    const jwt = await currentUser2.jwt();
    const identityUrl = `${window.location.origin}${IDENTITY_PATH}`;
    const emailChangeRes = await fetch(`${identityUrl}/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({ email_change_token: emailChangeToken })
    });
    if (!emailChangeRes.ok) {
      const errorBody = await emailChangeRes.json().catch(() => ({}));
      throw new AuthError(
        errorBody.msg ?? `Email change verification failed (${String(emailChangeRes.status)})`,
        emailChangeRes.status
      );
    }
    const emailChangeData = await emailChangeRes.json();
    const user = toUser(emailChangeData);
    clearHash();
    emitAuthEvent(AUTH_EVENTS.USER_UPDATED, user);
    return { type: "email_change", user };
  };
  var clearHash = () => {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };
  var hydrateSession = async () => {
    if (!isBrowser2()) return null;
    const client = getClient();
    const currentUser2 = client.currentUser();
    if (currentUser2) {
      startTokenRefresh();
      return toUser(currentUser2);
    }
    const accessToken = getCookie(NF_JWT_COOKIE);
    if (!accessToken) return null;
    const refreshToken = getCookie(NF_REFRESH_COOKIE) ?? "";
    const decoded = decodeJwtPayload(accessToken);
    const expiresAt = decoded?.exp ?? Math.floor(Date.now() / 1e3) + 3600;
    const expiresIn = Math.max(0, expiresAt - Math.floor(Date.now() / 1e3));
    let gotrueUser;
    try {
      gotrueUser = await client.createUser(
        {
          access_token: accessToken,
          token_type: "bearer",
          expires_in: expiresIn,
          expires_at: expiresAt,
          refresh_token: refreshToken
        },
        persistSession
      );
    } catch {
      deleteBrowserAuthCookies();
      return null;
    }
    const user = toUser(gotrueUser);
    startTokenRefresh();
    emitAuthEvent(AUTH_EVENTS.LOGIN, user);
    return user;
  };
  var toAuthProvider = (value) => typeof value === "string" && AUTH_PROVIDERS.includes(value) ? value : void 0;
  var toOptionalString = (value) => typeof value === "string" && value !== "" ? value : void 0;
  var toRoles = (appMeta) => {
    const roles2 = appMeta.roles;
    if (Array.isArray(roles2) && roles2.every((r) => typeof r === "string")) {
      return roles2;
    }
    return void 0;
  };
  var toUser = (userData) => {
    const userMeta = userData.user_metadata ?? {};
    const appMeta = userData.app_metadata ?? {};
    const name = userMeta.full_name ?? userMeta.name;
    const pictureUrl = userMeta.avatar_url;
    return {
      id: userData.id,
      email: userData.email,
      confirmedAt: toOptionalString(userData.confirmed_at),
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      role: toOptionalString(userData.role),
      provider: toAuthProvider(appMeta.provider),
      name: typeof name === "string" ? name : void 0,
      pictureUrl: typeof pictureUrl === "string" ? pictureUrl : void 0,
      roles: toRoles(appMeta),
      invitedAt: toOptionalString(userData.invited_at),
      confirmationSentAt: toOptionalString(userData.confirmation_sent_at),
      recoverySentAt: toOptionalString(userData.recovery_sent_at),
      pendingEmail: toOptionalString(userData.new_email),
      emailChangeSentAt: toOptionalString(userData.email_change_sent_at),
      lastSignInAt: toOptionalString(userData.last_sign_in_at),
      userMetadata: userMeta,
      appMetadata: appMeta
    };
  };
  var claimsToUser = (claims) => {
    const appMeta = claims.app_metadata ?? {};
    const userMeta = claims.user_metadata ?? {};
    const name = userMeta.full_name ?? userMeta.name;
    const pictureUrl = userMeta.avatar_url;
    return {
      id: claims.sub ?? "",
      email: claims.email,
      provider: toAuthProvider(appMeta.provider),
      name: typeof name === "string" ? name : void 0,
      pictureUrl: typeof pictureUrl === "string" ? pictureUrl : void 0,
      roles: toRoles(appMeta),
      userMetadata: userMeta,
      appMetadata: appMeta
    };
  };
  var decodeJwtPayload = (token) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(payload);
    } catch {
      return null;
    }
  };
  var fetchFullUser = async (identityUrl, jwt) => {
    try {
      const res = await fetchWithTimeout(`${identityUrl}/user`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (!res.ok) return null;
      const userData = await res.json();
      return toUser(userData);
    } catch {
      return null;
    }
  };
  var resolveIdentityUrl = () => {
    const identityContext = getIdentityContext();
    if (identityContext?.url) return identityContext.url;
    if (globalThis.Netlify?.context?.url) {
      return new URL(IDENTITY_PATH, globalThis.Netlify.context.url).href;
    }
    const siteUrl = typeof process !== "undefined" ? process.env?.URL : void 0;
    if (siteUrl) {
      return new URL(IDENTITY_PATH, siteUrl).href;
    }
    return null;
  };
  var getUser = async () => {
    if (isBrowser2()) {
      const client = getGoTrueClient();
      const currentUser2 = client?.currentUser() ?? null;
      if (currentUser2) {
        const jwt2 = getCookie(NF_JWT_COOKIE);
        if (!jwt2) {
          try {
            currentUser2.clearSession();
          } catch {
          }
          return null;
        }
        startTokenRefresh();
        return toUser(currentUser2);
      }
      const jwt = getCookie(NF_JWT_COOKIE);
      if (!jwt) return null;
      const claims2 = decodeJwtPayload(jwt);
      if (!claims2) return null;
      const hydrated = await hydrateSession();
      return hydrated ?? null;
    }
    triggerNextjsDynamic();
    const identityContext = globalThis.netlifyIdentityContext;
    const serverJwt = identityContext?.token ?? getServerCookie(NF_JWT_COOKIE);
    if (serverJwt) {
      const identityUrl = resolveIdentityUrl();
      if (identityUrl) {
        const fullUser = await fetchFullUser(identityUrl, serverJwt);
        if (fullUser) return fullUser;
      }
    }
    const claims = identityContext?.user ?? null;
    return claims ? claimsToUser(claims) : null;
  };
  var resolveCurrentUser = async () => {
    const client = getClient();
    let currentUser2 = client.currentUser();
    if (!currentUser2 && isBrowser2()) {
      try {
        await hydrateSession();
      } catch {
      }
      currentUser2 = client.currentUser();
    }
    if (!currentUser2) throw new AuthError("No user is currently logged in");
    return currentUser2;
  };
  var requestPasswordRecovery = async (email) => {
    const client = getClient();
    try {
      await client.requestPasswordRecovery(email);
    } catch (error) {
      throw AuthError.from(error);
    }
  };
  var acceptInvite = async (token, password) => {
    const client = getClient();
    try {
      const gotrueUser = await client.acceptInvite(token, password, persistSession);
      const user = toUser(gotrueUser);
      startTokenRefresh();
      emitAuthEvent(AUTH_EVENTS.LOGIN, user);
      return user;
    } catch (error) {
      throw AuthError.from(error);
    }
  };
  var updateUser = async (updates) => {
    const currentUser2 = await resolveCurrentUser();
    try {
      const updatedUser = await currentUser2.update(updates);
      const user = toUser(updatedUser);
      emitAuthEvent(AUTH_EVENTS.USER_UPDATED, user);
      return user;
    } catch (error) {
      throw AuthError.from(error);
    }
  };

  // src/i18n.js
  var i18n = {
    en: {},
    vi: {
      "KODA EUDR WORKSPACE": "KODA EUDR WORKSPACE",
      "Structured evidence for transparent human review": "B\u1EB1ng ch\u1EE9ng c\xF3 c\u1EA5u tr\xFAc cho quy tr\xECnh r\xE0 so\xE1t minh b\u1EA1ch",
      "OPERATIONS": "V\u1EACN H\xC0NH",
      "STAGING \xB7 2.1": "B\u1EA2N TH\u1EEC \xB7 2.1",
      "Dashboard": "T\u1ED5ng quan",
      "Orders": "\u0110\u01A1n h\xE0ng",
      "My Tasks": "C\xF4ng vi\u1EC7c c\u1EE7a t\xF4i",
      "Calendar": "L\u1ECBch",
      "AI Assistant": "Tr\u1EE3 l\xFD AI",
      "Export": "Xu\u1EA5t h\u1ED3 s\u01A1",
      "Audit Trail": "Nh\u1EADt k\xFD ki\u1EC3m tra",
      "Suppliers": "Nh\xE0 cung c\u1EA5p",
      "Users": "Ng\u01B0\u1EDDi d\xF9ng",
      "Settings": "C\xE0i \u0111\u1EB7t",
      "Workspace": "Kh\xF4ng gian l\xE0m vi\u1EC7c",
      "Order workspace": "Kh\xF4ng gian \u0111\u01A1n h\xE0ng",
      "Secure access": "Truy c\u1EADp b\u1EA3o m\u1EADt",
      "Your evidence workspace": "Kh\xF4ng gian qu\u1EA3n l\xFD b\u1EB1ng ch\u1EE9ng",
      "Sign in with your invited account.": "\u0110\u0103ng nh\u1EADp b\u1EB1ng t\xE0i kho\u1EA3n \u0111\u01B0\u1EE3c m\u1EDDi.",
      "Email": "Email",
      "Password": "M\u1EADt kh\u1EA9u",
      "Sign In": "\u0110\u0103ng nh\u1EADp",
      "Sign out": "\u0110\u0103ng xu\u1EA5t",
      "Forgot password?": "Qu\xEAn m\u1EADt kh\u1EA9u?",
      "Reset password": "\u0110\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u",
      "Send reset link": "G\u1EEDi li\xEAn k\u1EBFt \u0111\u1EB7t l\u1EA1i",
      "Change password": "\u0110\u1ED5i m\u1EADt kh\u1EA9u",
      "New password": "M\u1EADt kh\u1EA9u m\u1EDBi",
      "Save password": "L\u01B0u m\u1EADt kh\u1EA9u",
      "Access follows your assigned orders and role.": "Quy\u1EC1n truy c\u1EADp theo vai tr\xF2 v\xE0 \u0111\u01A1n h\xE0ng \u0111\u01B0\u1EE3c giao.",
      "Evidence control center": "Trung t\xE2m qu\u1EA3n l\xFD b\u1EB1ng ch\u1EE9ng",
      "Active orders": "\u0110\u01A1n h\xE0ng \u0111ang x\u1EED l\xFD",
      "Overdue orders": "\u0110\u01A1n h\xE0ng qu\xE1 h\u1EA1n",
      "In review": "\u0110ang r\xE0 so\xE1t",
      "Missing evidence": "Thi\u1EBFu b\u1EB1ng ch\u1EE9ng",
      "Human review remains required": "C\u1EA7n ng\u01B0\u1EDDi c\xF3 th\u1EA9m quy\u1EC1n r\xE0 so\xE1t",
      "EVIDENCE PROGRESS": "TI\u1EBEN \u0110\u1ED8 B\u1EB0NG CH\u1EE8NG",
      "TODAY\u2019S PRIORITIES": "\u01AFU TI\xCAN H\xD4M NAY",
      "GET STARTED": "B\u1EAET \u0110\u1EA6U",
      "Every order starts with clear evidence.": "M\u1ED7i \u0111\u01A1n h\xE0ng b\u1EAFt \u0111\u1EA7u b\u1EB1ng b\u1EB1ng ch\u1EE9ng r\xF5 r\xE0ng.",
      "Create a Sales Order, confirm its materials, then assign evidence to the right people and suppliers.": "Ghi nh\u1EADn \u0111\u01A1n h\xE0ng, x\xE1c nh\u1EADn v\u1EADt li\u1EC7u, r\u1ED3i ph\xE2n c\xF4ng b\u1EB1ng ch\u1EE9ng cho ng\u01B0\u1EDDi v\xE0 nh\xE0 cung c\u1EA5p ph\xF9 h\u1EE3p.",
      "No evidence tasks registered yet": "Ch\u01B0a c\xF3 c\xF4ng vi\u1EC7c b\u1EB1ng ch\u1EE9ng",
      "Approved tasks": "C\xF4ng vi\u1EC7c \u0111\xE3 duy\u1EC7t",
      "Needs attention": "C\u1EA7n x\u1EED l\xFD",
      "No urgent tasks": "Kh\xF4ng c\xF3 vi\u1EC7c kh\u1EA9n c\u1EA5p",
      "Recent orders": "\u0110\u01A1n h\xE0ng g\u1EA7n \u0111\xE2y",
      "Notifications": "Th\xF4ng b\xE1o",
      "\uFF0B New order": "\uFF0B T\u1EA1o \u0111\u01A1n h\xE0ng",
      "Create first order \u2192": "T\u1EA1o \u0111\u01A1n h\xE0ng \u0111\u1EA7u ti\xEAn \u2192",
      "Create another order \u2192": "T\u1EA1o th\xEAm \u0111\u01A1n h\xE0ng \u2192",
      "View my tasks \u2192": "Xem c\xF4ng vi\u1EC7c \u2192",
      "All tasks \u2192": "T\u1EA5t c\u1EA3 c\xF4ng vi\u1EC7c \u2192",
      "View all \u2192": "Xem t\u1EA5t c\u1EA3 \u2192",
      "Open": "M\u1EDF",
      "Open \u2192": "M\u1EDF \u2192",
      "No orders registered yet": "Ch\u01B0a c\xF3 \u0111\u01A1n h\xE0ng",
      "Register a Sales Order to begin the evidence workflow.": "Ghi nh\u1EADn Sales Order \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u quy tr\xECnh b\u1EB1ng ch\u1EE9ng.",
      "No orders found": "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng",
      "Adjust the search or filters to see matching orders.": "\u0110i\u1EC1u ch\u1EC9nh t\xECm ki\u1EBFm ho\u1EB7c b\u1ED9 l\u1ECDc.",
      "Advanced filters": "B\u1ED9 l\u1ECDc n\xE2ng cao",
      "Global search": "T\xECm ki\u1EBFm to\xE0n h\u1EC7 th\u1ED1ng",
      "Stage": "Giai \u0111o\u1EA1n",
      "Supplier": "Nh\xE0 cung c\u1EA5p",
      "Assigned user": "Ng\u01B0\u1EDDi \u0111\u01B0\u1EE3c giao",
      "Material": "V\u1EADt li\u1EC7u",
      "Evidence block": "Nh\xF3m b\u1EB1ng ch\u1EE9ng",
      "GEO status": "Tr\u1EA1ng th\xE1i GEO",
      "Due status": "T\xECnh tr\u1EA1ng h\u1EA1n",
      "Created from": "T\u1EA1o t\u1EEB ng\xE0y",
      "Created to": "T\u1EA1o \u0111\u1EBFn ng\xE0y",
      "Apply filters": "\xC1p d\u1EE5ng b\u1ED9 l\u1ECDc",
      "Clear": "X\xF3a b\u1ED9 l\u1ECDc",
      "All": "T\u1EA5t c\u1EA3",
      "Overdue": "Qu\xE1 h\u1EA1n",
      "Due today": "\u0110\u1EBFn h\u1EA1n h\xF4m nay",
      "No due date": "Ch\u01B0a c\xF3 h\u1EA1n",
      "Closed": "\u0110\xE3 \u0111\xF3ng",
      "Approved": "\u0110\xE3 duy\u1EC7t",
      "MISSING": "Thi\u1EBFu",
      "IN_REVIEW": "\u0110ang r\xE0 so\xE1t",
      "REJECTED": "B\u1ECB t\u1EEB ch\u1ED1i",
      "APPROVED": "\u0110\xE3 duy\u1EC7t",
      "UPLOADED": "\u0110\xE3 t\u1EA3i l\xEAn",
      "SUBMITTED": "\u0110\xE3 g\u1EEDi r\xE0 so\xE1t",
      "MORE_INFO_REQUIRED": "C\u1EA7n th\xEAm th\xF4ng tin",
      "New Order": "T\u1EA1o \u0111\u01A1n h\xE0ng",
      "Order No.": "S\u1ED1 \u0111\u01A1n h\xE0ng",
      "Customer": "Kh\xE1ch h\xE0ng",
      "Product": "S\u1EA3n ph\u1EA9m",
      "Customer PO": "PO kh\xE1ch h\xE0ng",
      "Evidence due date": "H\u1EA1n b\u1EB1ng ch\u1EE9ng",
      "Sales Order PDF": "PDF Sales Order",
      "Product image (optional)": "\u1EA2nh s\u1EA3n ph\u1EA9m (kh\xF4ng b\u1EAFt bu\u1ED9c)",
      "Create Order": "T\u1EA1o \u0111\u01A1n h\xE0ng",
      "Creating your order": "\u0110ang t\u1EA1o \u0111\u01A1n h\xE0ng",
      "Please keep this window open while KODA EUDR WORKSPACE prepares the order.": "Vui l\xF2ng gi\u1EEF c\u1EEDa s\u1ED5 n\xE0y m\u1EDF trong khi KODA EUDR WORKSPACE chu\u1EA9n b\u1ECB \u0111\u01A1n h\xE0ng.",
      "Validating order information": "Ki\u1EC3m tra th\xF4ng tin \u0111\u01A1n h\xE0ng",
      "Preparing Sales Order file": "Chu\u1EA9n b\u1ECB file Sales Order",
      "Creating order workspace": "T\u1EA1o workspace cho \u0111\u01A1n h\xE0ng",
      "Registering the document": "Ghi nh\u1EADn t\xE0i li\u1EC7u",
      "Finalizing": "Ho\xE0n t\u1EA5t",
      "Order created successfully": "T\u1EA1o \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng",
      "What would you like to do next?": "B\u1EA1n mu\u1ED1n l\xE0m g\xEC ti\u1EBFp theo?",
      "Open Order Workspace": "M\u1EDF Workspace",
      "Upload More Documents": "T\u1EA3i th\xEAm t\xE0i li\u1EC7u",
      "Create Another Order": "T\u1EA1o \u0111\u01A1n h\xE0ng kh\xE1c",
      "We could not finish creating this order.": "Kh\xF4ng th\u1EC3 ho\xE0n t\u1EA5t vi\u1EC7c t\u1EA1o \u0111\u01A1n h\xE0ng.",
      "Your information has not been intentionally discarded.": "Th\xF4ng tin b\u1EA1n nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i.",
      "Request ID:": "M\xE3 y\xEAu c\u1EA7u:",
      "Try Again": "Th\u1EED l\u1EA1i",
      "Back to Form": "Quay l\u1EA1i bi\u1EC3u m\u1EABu",
      "This order already exists. Open it from Orders.": "\u0110\u01A1n h\xE0ng \u0111\xE3 t\u1ED3n t\u1EA1i. H\xE3y m\u1EDF trong m\u1EE5c \u0110\u01A1n h\xE0ng.",
      "Confirm materials first, then choose an evidence task and its document destination.": "H\xE3y x\xE1c nh\u1EADn v\u1EADt li\u1EC7u, r\u1ED3i ch\u1ECDn c\xF4ng vi\u1EC7c b\u1EB1ng ch\u1EE9ng v\xE0 n\u01A1i l\u01B0u t\xE0i li\u1EC7u.",
      "ORDER WORKSPACE": "KH\xD4NG GIAN \u0110\u01A0N H\xC0NG",
      "Owner": "Ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch",
      "Due": "H\u1EA1n",
      "Last update": "C\u1EADp nh\u1EADt l\u1EA7n cu\u1ED1i",
      "Evidence readiness is a workflow measure. Regulatory decisions remain with the authorized operator.": "Ti\u1EBFn \u0111\u1ED9 b\u1EB1ng ch\u1EE9ng l\xE0 ch\u1EC9 s\u1ED1 quy tr\xECnh. Quy\u1EBFt \u0111\u1ECBnh ph\xE1p l\xFD thu\u1ED9c ng\u01B0\u1EDDi c\xF3 th\u1EA9m quy\u1EC1n.",
      "View Sales Order": "Xem Sales Order",
      "Product Image": "\u1EA2nh s\u1EA3n ph\u1EA9m",
      "Extract / Import Materials": "Tr\xEDch xu\u1EA5t / nh\u1EADp v\u1EADt li\u1EC7u",
      "Supply Chain": "Chu\u1ED7i cung \u1EE9ng",
      "GEO Review": "R\xE0 so\xE1t GEO",
      "Material Information": "Th\xF4ng tin v\u1EADt li\u1EC7u",
      "Close Internal Workflow": "Ho\xE0n t\u1EA5t quy tr\xECnh n\u1ED9i b\u1ED9",
      "Confirm the material list from the Sales Order to generate evidence items.": "X\xE1c nh\u1EADn danh s\xE1ch v\u1EADt li\u1EC7u t\u1EEB Sales Order \u0111\u1EC3 t\u1EA1o c\xF4ng vi\u1EC7c b\u1EB1ng ch\u1EE9ng.",
      "Upload": "T\u1EA3i l\xEAn",
      "View": "Xem",
      "Assign": "Ph\xE2n c\xF4ng",
      "Order": "\u0110\u01A1n h\xE0ng",
      "Status": "Tr\u1EA1ng th\xE1i",
      "Actions": "Thao t\xE1c",
      "Source": "Ngu\u1ED3n",
      "Category": "Nh\xF3m",
      "Scientific name": "T\xEAn khoa h\u1ECDc",
      "Assignment": "Ph\xE2n c\xF4ng",
      "Unassigned": "Ch\u01B0a ph\xE2n c\xF4ng",
      "Internal": "N\u1ED9i b\u1ED9",
      "Reviewer": "Ng\u01B0\u1EDDi r\xE0 so\xE1t",
      "Due date": "Ng\xE0y \u0111\u1EBFn h\u1EA1n",
      "Priority": "\u01AFu ti\xEAn",
      "Save assignment": "L\u01B0u ph\xE2n c\xF4ng",
      "Materials \xB7 human confirmation": "V\u1EADt li\u1EC7u \xB7 ng\u01B0\u1EDDi x\xE1c nh\u1EADn",
      "Generate the material extraction prompt, attach the SO in ChatGPT, then paste the JSON result here.": "T\u1EA1o prompt tr\xEDch xu\u1EA5t, m\u1EDF Sales Order trong ChatGPT r\u1ED3i d\xE1n k\u1EBFt qu\u1EA3 JSON t\u1EA1i \u0111\xE2y.",
      "Generate extraction prompt": "T\u1EA1o prompt tr\xEDch xu\u1EA5t",
      "Material JSON": "JSON v\u1EADt li\u1EC7u",
      "Validate & Preview": "Ki\u1EC3m tra & xem tr\u01B0\u1EDBc",
      "Confirm that these materials and references match the SO.": "X\xE1c nh\u1EADn v\u1EADt li\u1EC7u v\xE0 d\u1EABn ch\u1EE9ng kh\u1EDBp v\u1EDBi Sales Order.",
      "Confirm Materials & Create Folders": "X\xE1c nh\u1EADn v\u1EADt li\u1EC7u v\xE0 t\u1EA1o th\u01B0 m\u1EE5c",
      "PROMPT STUDIO": "T\u1EA0O PROMPT",
      "Function": "Ch\u1EE9c n\u0103ng",
      "Document": "T\xE0i li\u1EC7u",
      "Action mode": "Ch\u1EBF \u0111\u1ED9 h\xE0nh \u0111\u1ED9ng",
      "Generate Prompt": "T\u1EA1o prompt",
      "Generated prompt": "Prompt \u0111\xE3 t\u1EA1o",
      "Copy Prompt": "Sao ch\xE9p prompt",
      "Open ChatGPT": "M\u1EDF ChatGPT",
      "Structured result JSON": "JSON k\u1EBFt qu\u1EA3 c\xF3 c\u1EA5u tr\xFAc",
      "Import AI Result": "Nh\u1EADp k\u1EBFt qu\u1EA3 AI",
      "Sales Order / collection": "Sales Order / b\u1ED9 h\u1ED3 s\u01A1",
      "Inspect actual source documents in connected ChatGPT Work. Drive links alone are not file access.": "Ki\u1EC3m tra t\xE0i li\u1EC7u ngu\u1ED3n th\u1EF1c t\u1EBF trong ChatGPT Work \u0111\xE3 k\u1EBFt n\u1ED1i. Li\xEAn k\u1EBFt Drive kh\xF4ng t\u1EF1 c\u1EA5p quy\u1EC1n \u0111\u1ECDc file.",
      "Inspect actual documents in a connected ChatGPT Work session. Links and metadata alone are insufficient.": "Ki\u1EC3m tra t\xE0i li\u1EC7u th\u1EF1c t\u1EBF trong ChatGPT Work \u0111\xE3 k\u1EBFt n\u1ED1i. Li\xEAn k\u1EBFt v\xE0 metadata l\xE0 ch\u01B0a \u0111\u1EE7.",
      "I explicitly authorize updates through existing controlled workflows. Human approval remains required.": "T\xF4i cho ph\xE9p chu\u1EA9n b\u1ECB c\u1EADp nh\u1EADt qua quy tr\xECnh hi\u1EC7n c\xF3. V\u1EABn c\u1EA7n ng\u01B0\u1EDDi c\xF3 th\u1EA9m quy\u1EC1n ph\xEA duy\u1EC7t.",
      "Settings \xB7 Legal freshness": "C\xE0i \u0111\u1EB7t \xB7 hi\u1EC7u l\u1EF1c ngu\u1ED3n ph\xE1p l\xFD",
      "Record the exact official versions checked and the responsible human reviewer. A version label alone does not validate evidence.": "Ghi phi\xEAn b\u1EA3n ngu\u1ED3n ch\xEDnh th\u1EE9c v\xE0 ng\u01B0\u1EDDi r\xE0 so\xE1t. Nh\xE3n phi\xEAn b\u1EA3n kh\xF4ng x\xE1c th\u1EF1c b\u1EB1ng ch\u1EE9ng.",
      "Save Settings": "L\u01B0u c\xE0i \u0111\u1EB7t",
      "Production country risk": "R\u1EE7i ro qu\u1ED1c gia s\u1EA3n xu\u1EA5t",
      "Record Human Review": "Ghi nh\u1EADn r\xE0 so\xE1t",
      "Legal rule review is due. Evidence completeness does not establish legal compliance.": "\u0110\u1EBFn h\u1EA1n r\xE0 so\xE1t quy t\u1EAFc ph\xE1p l\xFD. H\u1ED3 s\u01A1 \u0111\u1EE7 kh\xF4ng ch\u1EE9ng minh tu\xE2n th\u1EE7 ph\xE1p lu\u1EADt.",
      "Close dialog": "\u0110\xF3ng h\u1ED9p tho\u1EA1i",
      "Close": "\u0110\xF3ng",
      "Download": "T\u1EA3i xu\u1ED1ng",
      "Submit for review": "G\u1EEDi r\xE0 so\xE1t",
      "Review / Comment": "R\xE0 so\xE1t / ghi ch\xFA",
      "Add Comment": "Th\xEAm b\xECnh lu\u1EADn",
      "Comments": "B\xECnh lu\u1EADn",
      "Version history": "L\u1ECBch s\u1EED phi\xEAn b\u1EA3n",
      "Active": "\u0110ang d\xF9ng",
      "Save": "L\u01B0u",
      "Cancel": "H\u1EE7y",
      "Loading your workspace\u2026": "\u0110ang t\u1EA3i workspace\u2026",
      "Saving\u2026": "\u0110ang l\u01B0u\u2026",
      "Saved.": "\u0110\xE3 l\u01B0u.",
      "Accept invitation": "Ch\u1EA5p nh\u1EADn l\u1EDDi m\u1EDDi",
      "Create account": "T\u1EA1o t\xE0i kho\u1EA3n",
      "Action": "H\xE0nh \u0111\u1ED9ng",
      "Actor": "Ng\u01B0\u1EDDi th\u1EF1c hi\u1EC7n",
      "Add Supplier": "Th\xEAm nh\xE0 cung c\u1EA5p",
      "Add User": "Th\xEAm ng\u01B0\u1EDDi d\xF9ng",
      "Add relationship": "Th\xEAm li\xEAn k\u1EBFt",
      "All assigned evidence": "To\xE0n b\u1ED9 b\u1EB1ng ch\u1EE9ng \u0111\u01B0\u1EE3c giao",
      "Append-only history. Latest 250 entries in assigned scope.": "L\u1ECBch s\u1EED ch\u1EC9 th\xEAm m\u1EDBi. Hi\u1EC3n th\u1ECB 250 m\u1EE5c g\u1EA7n nh\u1EA5t trong ph\u1EA1m vi \u0111\u01B0\u1EE3c giao.",
      "Assigned evidence deadlines \xB7 Vietnam time. Completed events are retained.": "H\u1EA1n b\u1EB1ng ch\u1EE9ng theo gi\u1EDD Vi\u1EC7t Nam. S\u1EF1 ki\u1EC7n ho\xE0n t\u1EA5t v\u1EABn \u0111\u01B0\u1EE3c l\u01B0u.",
      "Certificate Metadata": "Th\xF4ng tin ch\u1EE9ng ch\u1EC9",
      "Certificate holder": "Ch\u1EE7 ch\u1EE9ng ch\u1EC9",
      "Certificate metadata": "Th\xF4ng tin ch\u1EE9ng ch\u1EC9",
      "Certificate number": "S\u1ED1 ch\u1EE9ng ch\u1EC9",
      "Change": "Thay \u0111\u1ED5i",
      "Checked Annex I version": "Phi\xEAn b\u1EA3n Annex I \u0111\xE3 ki\u1EC3m tra",
      "Checked date": "Ng\xE0y ki\u1EC3m tra",
      "Close internal evidence workflow": "Ho\xE0n t\u1EA5t quy tr\xECnh b\u1EB1ng ch\u1EE9ng n\u1ED9i b\u1ED9",
      "Comment visibility": "Ph\u1EA1m vi hi\u1EC3n th\u1ECB b\xECnh lu\u1EADn",
      "Commodity production country (ISO code)": "Qu\u1ED1c gia s\u1EA3n xu\u1EA5t h\xE0ng h\xF3a (m\xE3 ISO)",
      "Confirm Internal Closure": "X\xE1c nh\u1EADn ho\xE0n t\u1EA5t n\u1ED9i b\u1ED9",
      "Contact email": "Email li\xEAn h\u1EC7",
      "Decision": "Quy\u1EBFt \u0111\u1ECBnh",
      "Deforestation evidence IDs (comma separated)": "ID b\u1EB1ng ch\u1EE9ng ph\xE1 r\u1EEBng (c\xE1ch nhau b\u1EB1ng d\u1EA5u ph\u1EA9y)",
      "Edit": "S\u1EEDa",
      "English Subtitle Prompt": "Prompt ph\u1EE5 \u0111\u1EC1 ti\u1EBFng Anh",
      "Exact Plot ID": "ID l\xF4 \u0111\u1EA5t ch\xEDnh x\xE1c",
      "Expiry date": "Ng\xE0y h\u1EBFt h\u1EA1n",
      "Export Center": "Trung t\xE2m xu\u1EA5t h\u1ED3 s\u01A1",
      "Full Name": "H\u1ECD t\xEAn",
      "Full Package": "To\xE0n b\u1ED9 h\u1ED3 s\u01A1",
      "Function / Department": "B\u1ED9 ph\u1EADn",
      "GEO review": "R\xE0 so\xE1t GEO",
      "Human scope assessment": "\u0110\xE1nh gi\xE1 ph\u1EA1m vi b\u1EDFi con ng\u01B0\u1EDDi",
      "ISO country code": "M\xE3 qu\u1ED1c gia ISO",
      "Issue date": "Ng\xE0y c\u1EA5p",
      "Legality evidence IDs (comma separated)": "ID b\u1EB1ng ch\u1EE9ng h\u1EE3p ph\xE1p (c\xE1ch nhau b\u1EB1ng d\u1EA5u ph\u1EA9y)",
      "Mark read": "\u0110\xE1nh d\u1EA5u \u0111\xE3 \u0111\u1ECDc",
      "Name / Email": "T\xEAn / Email",
      "Next": "Ti\u1EBFp",
      "Notes": "Ghi ch\xFA",
      "Official EU source URL": "URL ngu\u1ED3n EU ch\xEDnh th\u1EE9c",
      "Official version": "Phi\xEAn b\u1EA3n ch\xEDnh th\u1EE9c",
      "Order / Evidence": "\u0110\u01A1n h\xE0ng / B\u1EB1ng ch\u1EE9ng",
      "Order / Object": "\u0110\u01A1n h\xE0ng / \u0110\u1ED1i t\u01B0\u1EE3ng",
      "Owner / Due": "Ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch / H\u1EA1n",
      "Parent relationship": "Li\xEAn k\u1EBFt c\u1EA5p tr\xEAn",
      "Plot ID (for plot nodes)": "ID l\xF4 \u0111\u1EA5t",
      "Plot area (ha)": "Di\u1EC7n t\xEDch l\xF4 \u0111\u1EA5t (ha)",
      "Plot relationship": "Quan h\u1EC7 l\xF4 \u0111\u1EA5t",
      "Previous": "Tr\u01B0\u1EDBc",
      "Price Redaction Prompt": "Prompt x\xF3a gi\xE1",
      "Processed copies": "B\u1EA3n sao \u0111\xE3 x\u1EED l\xFD",
      "Production countries (ISO codes, comma separated)": "Qu\u1ED1c gia s\u1EA3n xu\u1EA5t (m\xE3 ISO, c\xE1ch nhau b\u1EB1ng d\u1EA5u ph\u1EA9y)",
      "Production date / range": "Ng\xE0y / kho\u1EA3ng s\u1EA3n xu\u1EA5t",
      "Record review": "Ghi nh\u1EADn r\xE0 so\xE1t",
      "Record verified fields": "Ghi tr\u01B0\u1EDDng \u0111\xE3 ki\u1EC3m tra",
      "Register plot": "Ghi nh\u1EADn l\xF4 \u0111\u1EA5t",
      "Review GEO": "R\xE0 so\xE1t GEO",
      "Risk": "R\u1EE7i ro",
      "Role": "Vai tr\xF2",
      "Save Supplier": "L\u01B0u nh\xE0 cung c\u1EA5p",
      "Save User": "L\u01B0u ng\u01B0\u1EDDi d\xF9ng",
      "Save source-backed information": "L\u01B0u th\xF4ng tin c\xF3 ngu\u1ED3n",
      "Scope": "Ph\u1EA1m vi",
      "Security Role": "Vai tr\xF2 truy c\u1EADp",
      "Selected Package": "H\u1ED3 s\u01A1 \u0111\xE3 ch\u1ECDn",
      "Source document": "T\xE0i li\u1EC7u ngu\u1ED3n",
      "Source evidence": "B\u1EB1ng ch\u1EE9ng ngu\u1ED3n",
      "Source for metadata": "Ngu\u1ED3n c\u1EE7a metadata",
      "Source page and fields": "Trang v\xE0 tr\u01B0\u1EDDng ngu\u1ED3n",
      "Source precision (decimal digits, 6\u201312)": "\u0110\u1ED9 ch\xEDnh x\xE1c t\u1ECDa \u0111\u1ED9 (6\u201312 ch\u1EEF s\u1ED1 th\u1EADp ph\xE2n)",
      "Supplier / Company": "Nh\xE0 cung c\u1EA5p / C\xF4ng ty",
      "Supplier legal name": "T\xEAn ph\xE1p l\xFD nh\xE0 cung c\u1EA5p",
      "Sync configured Calendar": "\u0110\u1ED3ng b\u1ED9 L\u1ECBch \u0111\xE3 c\u1EA5u h\xECnh",
      "Time": "Th\u1EDDi gian",
      "Type": "Lo\u1EA1i",
      "Upload English Subtitle PDF": "T\u1EA3i PDF ph\u1EE5 \u0111\u1EC1 ti\u1EBFng Anh",
      "Upload Redacted PDF": "T\u1EA3i PDF \u0111\xE3 x\xF3a gi\xE1",
      "User access": "Quy\u1EC1n truy c\u1EADp",
      "Validate & Register": "Ki\u1EC3m tra & ghi nh\u1EADn",
      "Verification does not certify deforestation-free status or legal compliance.": "X\xE1c minh kh\xF4ng ch\u1EE9ng nh\u1EADn t\xECnh tr\u1EA1ng kh\xF4ng ph\xE1 r\u1EEBng hay tu\xE2n th\u1EE7 ph\xE1p lu\u1EADt.",
      "Verify processed copy": "X\xE1c minh b\u1EA3n sao \u0111\xE3 x\u1EED l\xFD",
      "Add the SO PDF, customer and evidence due date.": "Th\xEAm PDF Sales Order, kh\xE1ch h\xE0ng v\xE0 h\u1EA1n b\u1EB1ng ch\u1EE9ng.",
      "Review the extracted list before generating folders and evidence tasks.": "R\xE0 so\xE1t danh s\xE1ch tr\xEDch xu\u1EA5t tr\u01B0\u1EDBc khi t\u1EA1o th\u01B0 m\u1EE5c v\xE0 c\xF4ng vi\u1EC7c.",
      "Assign owners, receive original files and record human decisions.": "Ph\xE2n c\xF4ng ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch, nh\u1EADn file g\u1ED1c v\xE0 ghi quy\u1EBFt \u0111\u1ECBnh c\u1EE7a ng\u01B0\u1EDDi r\xE0 so\xE1t.",
      "Assigned work and due dates will appear here.": "C\xF4ng vi\u1EC7c v\xE0 h\u1EA1n \u0111\u01B0\u1EE3c giao s\u1EBD hi\u1EC3n th\u1ECB \u1EDF \u0111\xE2y.",
      "Default: approved active evidence only. Processed copies require explicit human verification.": "M\u1EB7c \u0111\u1ECBnh ch\u1EC9 g\u1ED3m b\u1EB1ng ch\u1EE9ng c\xF2n hi\u1EC7u l\u1EF1c \u0111\xE3 duy\u1EC7t. B\u1EA3n x\u1EED l\xFD c\u1EA7n ng\u01B0\u1EDDi x\xE1c minh r\xF5 r\xE0ng.",
      "Geometry review is separate from legality and deforestation assessment.": "R\xE0 so\xE1t h\xECnh h\u1ECDc t\xE1ch bi\u1EC7t v\u1EDBi \u0111\xE1nh gi\xE1 t\xEDnh h\u1EE3p ph\xE1p v\xE0 ph\xE1 r\u1EEBng.",
      "Internal evidence approval only.": "Ch\u1EC9 ph\xEA duy\u1EC7t b\u1EB1ng ch\u1EE9ng n\u1ED9i b\u1ED9.",
      "Link each upstream processor/supplier through to every production plot. Every node needs source evidence.": "Li\xEAn k\u1EBFt t\u1EEBng b\xEAn x\u1EED l\xFD/nh\xE0 cung c\u1EA5p ng\u01B0\u1EE3c d\xF2ng \u0111\u1EBFn c\xE1c l\xF4 \u0111\u1EA5t s\u1EA3n xu\u1EA5t. M\u1ED7i n\xFAt c\u1EA7n b\u1EB1ng ch\u1EE9ng ngu\u1ED3n.",
      "This records workflow closure. It does not certify EUDR compliance or submit a declaration.": "Vi\u1EC7c n\xE0y ghi nh\u1EADn ho\xE0n t\u1EA5t quy tr\xECnh, kh\xF4ng ch\u1EE9ng nh\u1EADn tu\xE2n th\u1EE7 EUDR hay n\u1ED9p t\u1EDD khai.",
      "COLLECTING_EVIDENCE": "\u0110ang thu th\u1EADp b\u1EB1ng ch\u1EE9ng",
      "READY_FOR_OPERATOR_REVIEW": "S\u1EB5n s\xE0ng \u0111\u1EC3 ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch r\xE0 so\xE1t",
      "ACTION_REQUIRED": "C\u1EA7n x\u1EED l\xFD",
      "NOT_STARTED": "Ch\u01B0a b\u1EAFt \u0111\u1EA7u",
      "CLOSED": "\u0110\xE3 ho\xE0n t\u1EA5t n\u1ED9i b\u1ED9",
      "REQUESTED": "\u0110\xE3 y\xEAu c\u1EA7u",
      "SUPERSEDED": "\u0110\xE3 thay th\u1EBF",
      "NOT_PROVIDED": "Ch\u01B0a cung c\u1EA5p",
      "REVIEW_REQUIRED": "C\u1EA7n r\xE0 so\xE1t",
      "VERIFIED": "\u0110\xE3 x\xE1c minh",
      "PASS": "\u0110\u1EA1t ki\u1EC3m tra",
      "WARNING": "C\u1EA3nh b\xE1o",
      "MISMATCH": "Kh\xF4ng kh\u1EDBp",
      "NOT_VERIFIABLE": "Kh\xF4ng x\xE1c minh \u0111\u01B0\u1EE3c",
      "ANALYZE_ONLY": "Ch\u1EC9 ph\xE2n t\xEDch",
      "PREPARE_UPDATE": "Chu\u1EA9n b\u1ECB c\u1EADp nh\u1EADt",
      "AUTHORIZED_UPDATE": "C\u1EADp nh\u1EADt \u0111\u01B0\u1EE3c \u1EE7y quy\u1EC1n"
    }
  };
  var preference = "koda_eudr_language";
  var language = localStorage.getItem(preference) === "vi" ? "vi" : "en";
  var remembered = /* @__PURE__ */ new WeakMap();
  function errorLabel(code, message) {
    if (language !== "vi") return message;
    const labels = {
      AUTH_REQUIRED: "C\u1EA7n \u0111\u0103ng nh\u1EADp l\u1EA1i.",
      PERMISSION_DENIED: "B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n th\u1EF1c hi\u1EC7n thao t\xE1c n\xE0y.",
      INVALID_INPUT: "Th\xF4ng tin nh\u1EADp kh\xF4ng h\u1EE3p l\u1EC7. H\xE3y ki\u1EC3m tra c\xE1c tr\u01B0\u1EDDng v\xE0 th\u1EED l\u1EA1i.",
      INVALID_FILE: "File kh\xF4ng h\u1EE3p l\u1EC7. H\xE3y ki\u1EC3m tra \u0111\u1ECBnh d\u1EA1ng v\xE0 dung l\u01B0\u1EE3ng.",
      ORDER_NOT_FOUND: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng.",
      DUPLICATE_ORDER: "\u0110\u01A1n h\xE0ng \u0111\xE3 t\u1ED3n t\u1EA1i.",
      VERSION_CONFLICT: "D\u1EEF li\u1EC7u \u0111\xE3 thay \u0111\u1ED5i ho\u1EB7c kh\xF4ng kh\u1EDBp. H\xE3y t\u1EA3i l\u1EA1i v\xE0 ki\u1EC3m tra.",
      UPSTREAM_UNAVAILABLE: "Kh\xF4ng k\u1EBFt n\u1ED1i \u0111\u01B0\u1EE3c v\u1EDBi Apps Script. H\xE3y th\u1EED l\u1EA1i v\u1EDBi c\xF9ng y\xEAu c\u1EA7u.",
      CONFIG_REQUIRED: "H\u1EC7 th\u1ED1ng ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\xECnh \u0111\u1EA7y \u0111\u1EE7.",
      EVIDENCE_INCOMPLETE: "B\u1EB1ng ch\u1EE9ng ch\u01B0a \u0111\u1EA7y \u0111\u1EE7 \u0111\u1EC3 ho\xE0n t\u1EA5t.",
      SOURCE_NOT_FOUND: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i li\u1EC7u ngu\u1ED3n. C\u1EA7n ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch ki\u1EC3m tra.",
      REQUEST_TOO_LARGE: "Y\xEAu c\u1EA7u v\u01B0\u1EE3t gi\u1EDBi h\u1EA1n dung l\u01B0\u1EE3ng.",
      ORIGIN_DENIED: "Ngu\u1ED3n truy c\u1EADp kh\xF4ng \u0111\u01B0\u1EE3c ph\xE9p."
    };
    return labels[code] || message;
  }
  function setLanguage(next) {
    if (!["vi", "en"].includes(next)) return;
    language = next;
    localStorage.setItem(preference, next);
    translateUI();
  }
  function translated(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    const direct = i18n[language][trimmed];
    if (direct) return raw.replace(trimmed, direct);
    if (language === "vi") {
      const m = trimmed.match(/^(.+) has been registered and its workspace is ready\.$/);
      if (m) return raw.replace(trimmed, m[1] + " \u0111\xE3 \u0111\u01B0\u1EE3c ghi nh\u1EADn v\xE0 workspace c\u1EE7a \u0111\u01A1n h\xE0ng \u0111\xE3 s\u1EB5n s\xE0ng.");
    }
    return raw;
  }
  function translateText(node) {
    const current = node.nodeValue, previous = remembered.get(node);
    const raw = previous && current === previous.last ? previous.raw : current;
    const output = translated(raw);
    remembered.set(node, { raw, last: output });
    if (current !== output) node.nodeValue = output;
  }
  function translateUI() {
    document.documentElement.lang = language;
    document.querySelectorAll("[data-language]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.language === language));
    });
    const root = document.body, walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while (n = walker.nextNode()) {
      if (n.parentElement?.closest("script,style,textarea,pre,code")) continue;
      translateText(n);
    }
    for (const el of root.querySelectorAll("[placeholder],[aria-label],[title]")) for (const attr of ["placeholder", "aria-label", "title"]) if (el.hasAttribute(attr)) {
      const key = "i18nRaw" + attr, lastKey = "i18nLast" + attr, current = el.getAttribute(attr), prior = el.dataset[key];
      const raw = prior && current === el.dataset[lastKey] ? prior : current;
      el.dataset[key] = raw;
      const value = translated(raw);
      el.dataset[lastKey] = value;
      if (current !== value) el.setAttribute(attr, value);
    }
  }
  function watchTranslations() {
    new MutationObserver(() => translateUI()).observe(document.body, { childList: true, subtree: true, characterData: true });
    translateUI();
  }

  // src/app.js
  var state;
  var view = "Dashboard";
  var selected = "";
  var material = "";
  var busy = false;
  var month = /* @__PURE__ */ new Date();
  var calendarMode = "Month";
  var documentUrl = "";
  var $ = (id) => document.getElementById(id);
  var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var roles = (...rs) => rs.includes(state?.user.role);
  var manage = () => roles("ADMIN", "MARKETING");
  var review = () => roles("ADMIN", "EUDR_REVIEWER");
  var supplier = () => roles("SUPPLIER_USER");
  var write = () => !roles("VIEWER");
  var today = () => {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(/* @__PURE__ */ new Date());
    return ["year", "month", "day"].map((k) => p.find((x) => x.type === k).value).join("-");
  };
  var retryKeys = /* @__PURE__ */ new Map();
  var filter = { q: "", status: "", supplier: "", owner: "", material: "", block: "", geo: "", due: "", from: "", to: "" };
  async function call(action, ...args) {
    const fingerprint = JSON.stringify({ action, args }), requestKey = retryKeys.get(fingerprint) || crypto.randomUUID();
    retryKeys.set(fingerprint, requestKey);
    const response = await fetch("/api/call", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, args, requestKey }) });
    let result;
    try {
      result = await response.json();
    } catch {
      throw Error("Invalid server response; retry the same action");
    }
    if (!response.ok || !result.ok) {
      const code = result.error?.code, message = result.error?.message || result.error || "Request failed";
      const e = Error(errorLabel(code, message));
      e.status = response.status;
      e.code = code;
      e.requestId = result.requestId;
      if (response.status < 500) retryKeys.delete(fingerprint);
      throw e;
    }
    retryKeys.delete(fingerprint);
    return result.data;
  }
  function signIn(message = "") {
    state = null;
    $("identity").textContent = "";
    $("pageTitle").textContent = "Secure access";
    $("logout").hidden = true;
    $("changePassword").hidden = true;
    $("nav").replaceChildren();
    $("msg").textContent = message;
    $("main").innerHTML = '<div class="card login"><p class="eyebrow">KODA EUDR WORKSPACE</p><h2>Your evidence workspace</h2><p>Sign in with your invited account.</p><form id="loginForm"><label>Email<input id="loginEmail" type="email" autocomplete="username" required></label><label>Password<input id="loginPassword" type="password" autocomplete="current-password" required></label><button>Sign In</button></form><button id="forgotPassword" class="quiet-button">Forgot password?</button><small class="muted">Access follows your assigned orders and role.</small></div>';
    $("loginForm").onsubmit = async (e) => {
      e.preventDefault();
      const b = e.target.querySelector("button");
      b.disabled = true;
      try {
        await login($("loginEmail").value.trim(), $("loginPassword").value);
        $("loginPassword").value = "";
        await call("recordLogin");
        await load();
      } catch (error) {
        $("loginPassword").value = "";
        $("msg").textContent = error.message;
        b.disabled = false;
      }
    };
    $("forgotPassword").onclick = () => {
      drawer('<h2>Reset password</h2><form id="recoveryForm"><label>Email<input type="email" name="email" required autocomplete="email"></label><button>Send reset link</button></form>');
      $("recoveryForm").onsubmit = async (e) => {
        e.preventDefault();
        try {
          await requestPasswordRecovery(new FormData(e.target).get("email"));
          closeDrawer();
          $("msg").textContent = "If the account exists, a reset link has been sent.";
        } catch (error) {
          $("msg").textContent = error.message;
        }
      };
    };
    translateUI();
  }
  async function load() {
    try {
      if (!await getUser()) return signIn();
      state = await call("bootstrap");
      $("identity").textContent = state.user.name + " \xB7 " + state.user.role;
      $("logout").hidden = false;
      $("changePassword").hidden = false;
      if (selected && !state.cases.some((c) => c.id === selected)) {
        selected = "";
        view = "Orders";
      }
      const taskId = new URLSearchParams(location.hash.slice(1)).get("task");
      if (taskId) {
        const t = state.tasks.find((t2) => t2.id === taskId);
        if (t) {
          selected = t.case_id;
          view = "Workspace";
        }
      }
      render();
    } catch (e) {
      if (e.status === 401 || e.code === "AUTH_REQUIRED") signIn(e.code === "AUTH_REQUIRED" ? "This account is inactive in KODA or the session has expired." : "Your session has expired. Please sign in.");
      else if (e.status === 403) signIn("This account does not have access to this workspace.");
      else $("main").textContent = e.message + (e.requestId ? " \xB7 Request ID: " + e.requestId : "");
    }
  }
  async function act(action, ...args) {
    if (busy) return;
    busy = true;
    $("msg").textContent = "Saving\u2026";
    const buttons = [...document.querySelectorAll("button")].map((b) => [b, b.disabled]);
    buttons.forEach(([b]) => b.disabled = true);
    try {
      const result = await call(action, ...args);
      closeDrawer();
      await load();
      $("msg").textContent = result?.calendar && !["SYNCED", "NOT_SCHEDULED"].includes(result.calendar.status) ? "Saved. Calendar synchronization needs review: " + result.calendar.status : "Saved.";
      return result;
    } catch (e) {
      $("msg").textContent = e.message;
    } finally {
      busy = false;
      buttons.forEach(([b, disabled]) => {
        if (b.isConnected) b.disabled = disabled;
      });
    }
  }
  function go(v, id = "") {
    view = v;
    if (id) selected = id;
    render();
  }
  function closeDrawer() {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      documentUrl = "";
    }
    $("drawer").close();
  }
  function drawer(html) {
    closeDrawer();
    $("drawerContent").innerHTML = html;
    $("drawer").showModal();
    translateUI();
    $("closeDrawer").focus();
  }
  $("closeDrawer").onclick = closeDrawer;
  $("drawer").addEventListener("close", () => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      documentUrl = "";
    }
  });
  $("logout").onclick = async () => {
    try {
      await call("recordLogout");
    } catch {
    } finally {
      await logout();
      retryKeys.clear();
      closeDrawer();
      signIn();
    }
  };
  $("changePassword").onclick = () => passwordDialog("Change password");
  function passwordDialog(title) {
    drawer("<h2>" + esc(title) + '</h2><form id="passwordForm"><label>New password<input type="password" name="password" required minlength="12" autocomplete="new-password"></label><button>Save password</button></form>');
    $("passwordForm").onsubmit = async (e) => {
      e.preventDefault();
      try {
        await updateUser({ password: new FormData(e.target).get("password") });
        closeDrawer();
        $("msg").textContent = "Password updated.";
        await load();
      } catch (error) {
        $("msg").textContent = error.message;
      }
    };
  }
  document.querySelectorAll("[data-language]").forEach((b) => b.onclick = () => setLanguage(b.dataset.language));
  function button(label, action, id = "", disabled = false) {
    return `<button data-action="${action}" data-id="${esc(id)}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
  }
  function field(name, label, type = "text", value = "", required = false) {
    return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""} maxlength="2000"></label>`;
  }
  function select(name, label, options, value = "") {
    return `<label>${esc(label)}<select name="${name}">${options.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(l)}</option>`;
    }).join("")}</select></label>`;
  }
  function render() {
    let tabs = supplier() ? ["Orders", "My Tasks", "Calendar"] : ["Dashboard", "Orders", "My Tasks", "Calendar"];
    if (!supplier() && !roles("VIEWER")) tabs.push("AI Assistant");
    if (roles("ADMIN", "EUDR_REVIEWER", "VIEWER")) tabs.push("Export");
    if (!supplier()) tabs.push("Audit Trail");
    if (roles("ADMIN")) tabs.push("Suppliers", "Users", "Settings");
    if (supplier() && !["Workspace", ...tabs].includes(view)) view = "My Tasks";
    $("pageTitle").textContent = view === "Workspace" ? "Order workspace" : view;
    $("nav").innerHTML = tabs.map((t) => `<button data-view="${t}" class="${view === t ? "active" : ""}" ${view === t ? 'aria-current="page"' : ""}>${t}</button>`).join("");
    $("nav").querySelectorAll("button").forEach((b) => b.onclick = () => go(b.dataset.view));
    const screens = { Dashboard: dashboard, Orders: orders, "My Tasks": myTasks, Calendar: calendar, "AI Assistant": promptStudio, Export: exports, "Audit Trail": audit, Workspace: workspace, Users: users, Suppliers: suppliers, Settings: settings };
    (screens[view] || orders)();
    bind();
    translateUI();
  }
  function filtered() {
    return state.cases.filter((c) => {
      const mats = state.materials.filter((m) => m.case_id === c.id), tasks = state.tasks.filter((t) => t.case_id === c.id), docs = state.docs.filter((d) => d.case_id === c.id), supIds = new Set(tasks.map((t) => t.supplier_id)), supNames = state.suppliers.filter((s) => supIds.has(s.id)).map((s) => s.name), geos = state.geo.filter((g) => g.case_id === c.id);
      const search = [c.so, c.customer, c.product, ...mats.map((m) => m.material), ...supNames, ...docs.map((d) => d.name), ...tasks.map((t) => t.assigned_reviewer)].join(" ").toLowerCase();
      return (!filter.q || search.includes(filter.q.toLowerCase())) && (!filter.status || c.status === filter.status) && (!filter.supplier || supIds.has(filter.supplier)) && (!filter.owner || tasks.some((t) => t.owner === filter.owner) || c.owner === filter.owner) && (!filter.material || mats.some((m) => m.material === filter.material)) && (!filter.block || tasks.some((t) => t.evidence_block === filter.block)) && (!filter.geo || geos.some((g) => g.verification_status === filter.geo)) && (!filter.from || String(c.created_at).slice(0, 10) >= filter.from) && (!filter.to || String(c.created_at).slice(0, 10) <= filter.to) && (!filter.due || filter.due === "OVERDUE" && c.due && c.due < today() || filter.due === "DUE_TODAY" && c.due === today());
    });
  }
  function filters() {
    return `<div class="card filters"><label>Global search<input id="f-q" value="${esc(filter.q)}" placeholder="Order, product, supplier, material, document, reviewer"></label>${select("f-status", "Stage", [["", "All"], ...new Set(state.cases.map((c) => c.status))], filter.status)}${select("f-supplier", "Supplier", [["", "All"], ...state.suppliers.map((s) => [s.id, s.name])], filter.supplier)}${select("f-owner", "Assigned user", [["", "All"], ...new Set(state.tasks.map((t) => t.owner).filter(Boolean))], filter.owner)}${select("f-material", "Material", [["", "All"], ...new Set(state.materials.map((m) => m.material))], filter.material)}${select("f-block", "Evidence block", [["", "All"], ...new Set(state.tasks.map((t) => t.evidence_block).filter(Boolean))], filter.block)}${select("f-geo", "GEO status", [["", "All"], "REVIEW_REQUIRED", "VERIFIED", "REJECTED"], filter.geo)}${select("f-due", "Due status", [["", "All"], ["OVERDUE", "Overdue"], ["DUE_TODAY", "Due today"]], filter.due)}${field("f-from", "Created from", "date", filter.from)}${field("f-to", "Created to", "date", filter.to)}<button id="applyFilters">Apply filters</button><button id="clearFilters">Clear</button></div>`;
  }
  function bindFilters(draw) {
    $("applyFilters").onclick = () => {
      Object.keys(filter).forEach((k) => filter[k] = k === "q" ? $("f-q").value : document.querySelector(`[name="f-${k}"]`).value);
      draw();
      bind();
    };
    $("clearFilters").onclick = () => {
      Object.keys(filter).forEach((k) => filter[k] = "");
      draw();
      bind();
    };
  }
  function orderTable(cases) {
    if (!cases.length) return '<div class="empty-state order-empty"><div class="empty-icon">\u25C7</div><h3>No orders found</h3><p>Adjust the search or filters to see matching orders.</p></div>';
    return '<div class="order-board">' + cases.map((c) => {
      const mats = state.materials.filter((m) => m.case_id === c.id), ts = state.tasks.filter((t) => t.case_id === c.id), ss = state.suppliers.filter((s) => ts.some((t) => t.supplier_id === s.id));
      const pct = Math.max(0, Math.min(100, Number(c.readiness) || 0));
      const issues = (c.issues || []).length, missing = ts.filter((t) => t.status === "MISSING").length;
      const label = c.status === "CLOSED" ? "Closed" : issues || missing ? "Needs attention" : String(c.status || "In progress").replace(/_/g, " ");
      return `<div class="order-item"><div class="order-mark">SO</div><div class="order-copy"><strong>${esc(c.so)} \xB7 ${esc(c.product || c.customer)}</strong><small>${esc(c.customer)} \xB7 ${mats.length} material${mats.length === 1 ? "" : "s"} \xB7 ${ss.length} supplier${ss.length === 1 ? "" : "s"}</small><div class="order-progress" aria-label="${pct}% evidence approved"><span style="width:${pct}%"></span></div></div><div class="order-meta"><span class="status-pill ${issues || missing ? "warning" : ""}">${esc(label)}</span><strong>${esc(c.accepted)}/${esc(c.total)} approved</strong><span class="${c.due && c.due < today() && c.status !== "CLOSED" ? "overdue" : ""}">${esc(c.due || "No due date")}</span></div>${button("Open \u2192", "open", c.id)}</div>`;
    }).join("") + "</div>";
  }
  function dashboard() {
    const cases = state.cases, active = cases.filter((c) => c.status !== "CLOSED"), ids = new Set(cases.map((c) => c.id));
    const tasks = state.tasks.filter((t) => ids.has(t.case_id)), docs = state.docs.filter((d) => ids.has(d.case_id));
    const overdue = active.filter((c) => c.due && c.due < today());
    const missing = tasks.filter((t) => t.status === "MISSING");
    const reviewing = tasks.filter((t) => ["UPLOADED", "SUBMITTED", "IN_REVIEW"].includes(t.status));
    const actionTasks = tasks.filter((t) => t.status !== "APPROVED" && (t.due && t.due < today() || ["MISSING", "REJECTED", "MORE_INFO_REQUIRED", "SUBMITTED", "UPLOADED"].includes(t.status))).sort((a, b) => Number(!!b.due && b.due < today()) - Number(!!a.due && a.due < today()) || String(a.due || "9999").localeCompare(String(b.due || "9999"))).slice(0, 4);
    const approved = docs.filter((d) => d.kind === "EVIDENCE" && d.status === "APPROVED" && d.active_version === "YES").length;
    const total = tasks.length, pct = total ? Math.round(tasks.filter((t) => t.status === "APPROVED").length / total * 100) : 0;
    const notices = (state.notifications || []).filter((n) => n.read !== "YES").slice(0, 3);
    const date = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(/* @__PURE__ */ new Date());
    $("main").innerHTML = `<div class="dashboard-heading"><div><p class="eyebrow">KODA / EUDR OPERATIONS</p><h1>Evidence control center</h1><p>Operational picture \xB7 ${esc(date)} \xB7 Vietnam time</p></div>${manage() && cases.length ? button("\uFF0B New order", "newOrder") : ""}</div>` + (state.legal?.reviewDue ? '<p class="warn">Legal rule review is due. Evidence completeness does not establish legal compliance.</p>' : "") + `<div class="hero-grid"><section class="hero-panel"><div><p class="eyebrow">${cases.length ? "TODAY\u2019S PRIORITIES" : "GET STARTED"}</p><h2>${cases.length ? `${overdue.length + missing.length + reviewing.length} items across your evidence workflow` : "Every order starts with clear evidence."}</h2><p>${cases.length ? "Review deadlines, missing files and submissions in one place. Open an order to follow its materials and evidence." : "Create a Sales Order, confirm its materials, then assign evidence to the right people and suppliers."}</p></div><div class="hero-bottom">${manage() ? button(cases.length ? "Create another order \u2192" : "Create first order \u2192", "newOrder") : button("View my tasks \u2192", "openTasks")}<span class="hero-footnote">Human review remains required</span></div></section><section class="readiness-panel"><div><p class="eyebrow">EVIDENCE PROGRESS</p><div class="readiness-value">${total ? pct : "\u2014"}${total ? "<small>%</small>" : ""}</div><p>${total ? `${approved} approved active files \xB7 ${total} evidence tasks` : "No evidence tasks registered yet"}</p></div><div><div class="readiness-bar"><span style="width:${pct}%"></span></div><div class="subline"><span>Approved tasks</span><span>${tasks.filter((t) => t.status === "APPROVED").length} / ${total}</span></div></div></section></div><div class="kpi-grid"><div class="kpi"><span>Active orders</span><strong>${active.length}</strong></div><div class="kpi alert"><span>Overdue orders</span><strong>${overdue.length}</strong></div><div class="kpi review"><span>In review</span><strong>${reviewing.length}</strong></div><div class="kpi"><span>Missing evidence</span><strong>${missing.length}</strong></div></div>` + (!cases.length ? `<div class="onboarding"><div class="onboarding-step"><span>01 / ORDER</span><strong>Register the Sales Order</strong><p>Add the SO PDF, customer and evidence due date.</p></div><div class="onboarding-step"><span>02 / MATERIALS</span><strong>Confirm materials</strong><p>Review the extracted list before generating folders and evidence tasks.</p></div><div class="onboarding-step"><span>03 / EVIDENCE</span><strong>Collect and review</strong><p>Assign owners, receive original files and record human decisions.</p></div></div>` : `<div class="dashboard-columns"><section class="card"><div class="section-title"><h2>Needs attention</h2>${button("All tasks \u2192", "openTasks")}</div>${actionTasks.length ? actionTasks.map((t, i) => {
      const c = cases.find((c2) => c2.id === t.case_id), m = state.materials.find((m2) => m2.id === t.material_id);
      return `<div class="attention-item"><span class="attention-number">${String(i + 1).padStart(2, "0")}</span><div class="attention-copy"><strong>${esc(c?.so)} \xB7 ${esc(t.evidence)}</strong><small>${esc(m?.material || "Material pending")} \xB7 ${esc(t.due || "No due date")} \xB7 ${esc(t.status)}</small></div>${button("Open", "open", t.case_id)}</div>`;
    }).join("") : '<div class="empty-state"><div class="empty-icon">\u2713</div><h3>No urgent tasks</h3><p>Assigned work and due dates will appear here.</p></div>'}</section><section class="card"><div class="section-title"><h2>Recent orders</h2>${button("View all \u2192", "openOrders")}</div>${cases.slice().sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))).slice(0, 4).map((c) => `<div class="order-item"><div class="order-mark">SO</div><div class="order-copy"><strong>${esc(c.so)}</strong><small>${esc(c.customer)} \xB7 ${esc(c.status)}</small></div>${button("Open", "open", c.id)}</div>`).join("")}${notices.length ? `<h3 class="notice-heading">Notifications</h3>${notices.map((n) => `<div class="attention-item"><div class="attention-copy"><small>${esc(n.message)}</small></div>${button("Mark read", "readNotification", n.id)}</div>`).join("")}` : ""}</section></div>`);
  }
  function orders() {
    const cases = filtered();
    $("main").innerHTML = `<div class="pagehead"><div><p class="eyebrow">CASE REGISTER</p><h2>Orders</h2><p class="muted">Follow each Sales Order from materials through evidence review.</p></div>${manage() ? button("\uFF0B New order", "newOrder") : ""}</div><div class="orders-toolbar"><input id="quickSearch" aria-label="Search orders" value="${esc(filter.q)}" placeholder="Search order, customer, product, supplier\u2026"><span class="muted">${cases.length} of ${state.cases.length} orders</span></div><details class="filter-panel"><summary>Advanced filters</summary>${filters()}</details><div id="orderResults">${state.cases.length ? orderTable(cases) : `<div class="empty-state order-empty"><div class="empty-icon">\u25C7</div><h3>No orders registered yet</h3><p>Register a Sales Order to begin the evidence workflow.</p>${manage() ? button("Create first order \u2192", "newOrder") : ""}</div>`}</div>`;
    $("quickSearch").oninput = (e) => {
      filter.q = e.target.value;
      $("f-q").value = filter.q;
      const list = filtered();
      $("orderResults").innerHTML = orderTable(list);
      $("orderResults").querySelectorAll("[data-action]").forEach((b) => b.onclick = () => go("Workspace", b.dataset.id));
    };
    bindFilters(orders);
  }
  function taskTable(tasks) {
    return '<div class="scroll"><table><thead><tr><th>Order / Evidence</th><th>Owner / Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + tasks.map((t) => {
      const c = state.cases.find((c2) => c2.id === t.case_id), m = state.materials.find((m2) => m2.id === t.material_id);
      return `<tr><td><b>${esc(c?.so)} \xB7 ${esc(m?.material)}</b><br>${esc(t.evidence)}</td><td>${esc(t.owner || "Unassigned")}<br><span class="${t.due && t.due < today() && t.status !== "APPROVED" ? "overdue" : ""}">${esc(t.due)}</span></td><td>${esc(t.status)}</td><td><div class="row">${t.document_id ? button("View", "document", t.document_id) : ""}${write() && t.status !== "APPROVED" ? button("Upload", "upload", t.id) : ""}${roles("ADMIN", "MARKETING", "EUDR_REVIEWER") ? button("Assign", "assign", t.id) : ""}${button("Order", "open", t.case_id)}</div></td></tr>`;
    }).join("") + "</tbody></table></div>";
  }
  function myTasks() {
    const own = state.tasks.filter((t) => t.owner === state.user.email || t.assigned_reviewer === state.user.email || supplier() && t.supplier_id === state.user.supplier_id), end = /* @__PURE__ */ new Date(today() + "T12:00:00Z");
    end.setUTCDate(end.getUTCDate() + 7);
    const sections = [["Overdue", (t) => t.due && t.due < today() && t.status !== "APPROVED"], ["Due Today", (t) => t.due === today() && t.status !== "APPROVED"], ["Due This Week", (t) => t.due > today() && t.due <= end.toISOString().slice(0, 10) && t.status !== "APPROVED"], ["Awaiting My Review", (t) => t.assigned_reviewer === state.user.email && ["SUBMITTED", "IN_REVIEW", "UPLOADED"].includes(t.status)], ["Waiting for Supplier", (t) => !!t.supplier_id && ["MISSING", "REQUESTED", "MORE_INFO_REQUIRED", "REJECTED"].includes(t.status)], ["Completed", (t) => t.status === "APPROVED"]];
    $("main").innerHTML = "<h2>My Tasks</h2>" + sections.map(([name, fn]) => `<section class="card"><h3>${name}</h3>${taskTable(own.filter(fn))}</section>`).join("") + '<section class="card"><h3>All assigned evidence</h3>' + taskTable(own) + "</section>";
  }
  function workspace() {
    const c = state.cases.find((c2) => c2.id === selected);
    if (!c) return orders();
    const mats = state.materials.filter((m) => m.case_id === selected);
    if (!mats.some((m) => m.id === material)) material = mats[0]?.id || "";
    const ts = state.tasks.filter((t) => t.case_id === selected && (!material || t.material_id === material)), blocks = [...new Set(ts.map((t) => t.evidence_block || "Evidence"))];
    $("main").innerHTML = `<div class="workspace-summary"><p class="eyebrow">ORDER WORKSPACE</p><h2>${esc(c.so)} \xB7 ${esc(c.product || c.customer)}</h2><p>${esc(c.customer)} \xB7 Owner ${esc(c.owner)} \xB7 Due ${esc(c.due)} \xB7 Last update ${esc(c.updated_at)}</p><progress value="${c.readiness}" max="100"></progress> ${c.accepted}/${c.total} required items approved<p class="muted">Evidence readiness is a workflow measure. Regulatory decisions remain with the authorized operator.</p><div class="row">${c.so_document_id ? button("View Sales Order", "document", c.so_document_id) : ""}${c.product_image_id ? button("Product Image", "document", c.product_image_id) : ""}${manage() ? button("Extract / Import Materials", "materials", selected) : ""}${!supplier() ? button("Supply Chain", "chain", material) : ""}${button("GEO Review", "geo", material)}${!supplier() ? button("Material Information", "materialInfo", material) : ""}${review() ? button("Close Internal Workflow", "closeOrder", selected) : ""}</div></div>` + (c.issues.length ? '<div class="warn">Attention required: ' + esc(c.issues.join(" \xB7 ")) + "</div>" : "") + '<div class="row materialnav">' + mats.map((m) => `<button data-material="${esc(m.id)}" class="${material === m.id ? "active" : ""}">${esc(m.material)} \xB7 ${state.tasks.filter((t) => t.material_id === m.id && t.status === "APPROVED").length}/${state.tasks.filter((t) => t.material_id === m.id).length}</button>`).join("") + "</div>" + blocks.map((block) => `<section class="card"><h3>${esc(block.replace(/^\d+_/, "").replace(/_/g, " "))}</h3>${taskTable(ts.filter((t) => (t.evidence_block || "Evidence") === block))}</section>`).join("") + (!mats.length ? '<div class="card">Confirm the material list from the Sales Order to generate evidence items.</div>' : "");
    document.querySelectorAll("[data-material]").forEach((b) => b.onclick = () => {
      material = b.dataset.material;
      workspace();
      bind();
    });
  }
  async function fileData(file) {
    if (!file || !file.size || file.size > 3 * 1024 * 1024) throw Error("Select a file of up to 3 MB");
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(Error("Cannot read file"));
      r.onload = () => resolve({ name: file.name, type: file.type || (/\.pdf$/i.test(file.name) ? "application/pdf" : /\.png$/i.test(file.name) ? "image/png" : /\.jpe?g$/i.test(file.name) ? "image/jpeg" : /\.geojson$/i.test(file.name) ? "application/geo+json" : "application/json"), data: String(r.result).split(",")[1] });
      r.readAsDataURL(file);
    });
  }
  function newOrder() {
    drawer('<h2>New Order</h2><form id="orderForm">' + field("so", "Order No.", "text", "", true) + field("customer", "Customer") + field("product", "Product") + field("po", "Customer PO") + field("due", "Evidence due date", "date") + '<label>Sales Order PDF<input name="soFile" type="file" accept="application/pdf" required></label><label>Product image (optional)<input name="image" type="file" accept="image/png,image/jpeg"></label><button type="submit">Create Order</button></form><section id="orderProgress" role="status" aria-live="polite" hidden></section>');
    $("orderForm").onsubmit = async (e) => {
      e.preventDefault();
      if (busy) return;
      busy = true;
      const form = e.target, submit = form.querySelector('[type="submit"]'), progress = $("orderProgress"), controls = [...form.elements];
      submit.disabled = true;
      const stages = ["Validating order information", "Preparing Sales Order file", "Creating order workspace", "Registering the document", "Finalizing"];
      const show = (heading, active) => {
        progress.hidden = false;
        progress.innerHTML = "<h3>" + esc(heading) + '</h3><p>Please keep this window open while KODA EUDR WORKSPACE prepares the order.</p><ol class="progress-list">' + stages.map((s, i) => '<li class="' + (i < active ? "done" : i === active ? "current" : "pending") + '">' + esc(s) + "</li>").join("") + "</ol>";
        translateUI();
      };
      try {
        show("Creating your order", 0);
        const input = Object.fromEntries(new FormData(form));
        delete input.soFile;
        delete input.image;
        controls.forEach((control) => control.disabled = true);
        input.file = await fileData(form.elements.soFile.files[0]);
        if (form.elements.image.files[0]) input.image = await fileData(form.elements.image.files[0]);
        show("Creating your order", 2);
        const result = await call("createOrder", input);
        await load();
        selected = result.id;
        form.hidden = true;
        progress.innerHTML = "<h3>Order created successfully</h3><p>" + esc(input.so) + ' has been registered and its workspace is ready.</p><p>What would you like to do next?</p><div class="row"><button id="openCreated">Open Order Workspace</button><button id="uploadCreated">Upload More Documents</button><button id="anotherOrder">Create Another Order</button></div>';
        $("openCreated").onclick = () => {
          closeDrawer();
          go("Workspace", result.id);
        };
        $("uploadCreated").onclick = () => {
          closeDrawer();
          go("Workspace", result.id);
          $("msg").textContent = "Confirm materials first, then choose an evidence task and its document destination.";
        };
        $("anotherOrder").onclick = () => newOrder();
        translateUI();
      } catch (error) {
        const message = error.code === "DUPLICATE_ORDER" ? "This order already exists. Open it from Orders." : error.message;
        progress.innerHTML = "<h3>We could not finish creating this order.</h3><p>Your information has not been intentionally discarded.</p><p>" + esc(message) + "</p>" + (error.requestId ? "<p>Request ID: " + esc(error.requestId) + "</p>" : "") + '<button id="retryCreate">Try Again</button> <button id="backCreate">Back to Form</button>';
        $("retryCreate").onclick = () => form.requestSubmit();
        $("backCreate").onclick = () => {
          progress.hidden = true;
          form.elements.so.focus();
        };
        translateUI();
      } finally {
        busy = false;
        controls.forEach((control) => control.disabled = false);
      }
    };
  }
  function materialsDialog(id) {
    drawer("<h2>Materials \xB7 human confirmation</h2><p>Generate the material extraction prompt, attach the SO in ChatGPT, then paste the JSON result here.</p>" + button("Generate extraction prompt", "materialPrompt", id) + '<label>Material JSON<textarea id="materialsJson" rows="12"></textarea></label><button id="previewMaterials">Validate & Preview</button><div id="materialsPreview"></div>');
    $("previewMaterials").onclick = async () => {
      try {
        const json = $("materialsJson").value, preview = await call("previewMaterials", id, json);
        $("materialsPreview").innerHTML = "<table><tr><th>Material</th><th>Category</th><th>Scientific name</th><th>Source</th></tr>" + preview.materials.map((m) => `<tr><td>${esc(m.material)}</td><td>${esc(m.category)}</td><td>${esc(m.scientific_name)}</td><td>${esc(m.source_reference)}</td></tr>`).join("") + '</table><p>Confirm that these materials and references match the SO.</p><button id="confirmMaterials">Confirm Materials & Create Folders</button>';
        $("confirmMaterials").onclick = () => act("confirmMaterials", id, json, { confirmed: true, preview_hash: preview.preview_hash });
      } catch (e) {
        $("msg").textContent = e.message;
      }
    };
    bind();
  }
  function assignDialog(id) {
    const t = state.tasks.find((t2) => t2.id === id);
    drawer('<h2>Assignment</h2><form id="assignForm">' + select("owner", "Assigned user", [["", "Unassigned"], ...state.owners.map((u) => [u.email, u.name || u.email])], t.owner) + select("supplier_id", "Supplier", [["", "Internal"], ...state.suppliers.map((s) => [s.id, s.name])], t.supplier_id) + select("assigned_reviewer", "Reviewer", [["", "Unassigned"], ...state.owners.filter((u) => ["ADMIN", "EUDR_REVIEWER"].includes(u.role)).map((u) => [u.email, u.name || u.email])], t.assigned_reviewer) + field("due", "Due date", "date", t.due) + select("priority", "Priority", ["LOW", "NORMAL", "HIGH", "URGENT"], t.priority || "NORMAL") + "<button>Save assignment</button></form>");
    $("assignForm").onsubmit = (e) => {
      e.preventDefault();
      act("updateTask", id, Object.fromEntries(new FormData(e.target)));
    };
  }
  async function fileBytes(f, id) {
    if (!f.download_chunked) return Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0));
    const out = new Uint8Array(f.size);
    for (let i = 0; i < Math.ceil(f.size / 1048576); i++) {
      $("msg").textContent = "Loading document " + Math.round(i * 1048576 / f.size * 100) + "%";
      const part = await call("getDocumentChunk", id, i), bytes = Uint8Array.from(atob(part.data), (c) => c.charCodeAt(0));
      if (part.index !== i || part.size !== f.size || bytes.length !== Math.min(1048576, f.size - i * 1048576)) throw Error("Download integrity error");
      out.set(bytes, i * 1048576);
    }
    $("msg").textContent = "Document loaded.";
    return out;
  }
  async function download(id) {
    try {
      const f = await call("getDocument", id), url = URL.createObjectURL(new Blob([await fileBytes(f, id)], { type: f.type })), a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1e4);
    } catch (e) {
      $("msg").textContent = e.message;
    }
  }
  async function documentView(id) {
    try {
      const f = await call("getDocument", id), metadata = state.docs.find((d) => d.id === id), processed = ["REDACTED", "EN_SUBTITLE"].includes(metadata?.kind), original = metadata?.kind === "EVIDENCE";
      drawer(`<h2>${esc(f.name)} \xB7 v${f.version}</h2><div class="viewer-layout"><div id="preview"></div><div><span class="badge">${esc(f.status)}</span><p>Internal evidence approval only.</p><div class="row">${button("Download", "download", id)}${write() && f.status === "UPLOADED" && original ? button("Submit for review", "submit", id) : ""}${review() && original ? ["IN_REVIEW", "APPROVED", "REJECTED", "MORE_INFO_REQUIRED"].map((status) => button(status.replace(/_/g, " "), "review:" + status, id, f.active !== "YES" || !["SUBMITTED", "IN_REVIEW", "APPROVED"].includes(f.status))).join("") : ""}${review() && processed ? button("Verify processed copy", "verifyProcessed", id) : ""}${review() && original && /FSC/i.test(metadata?.document_type || "") ? button("Certificate Metadata", "certificate", id) : ""}</div><label>Review / Comment<textarea id="reviewNote" rows="3"></textarea></label>${write() ? select("visibility", "Comment visibility", supplier() ? ["SHARED_WITH_SUPPLIER"] : ["SHARED_WITH_SUPPLIER", "INTERNAL_ONLY"]) + button("Add Comment", "comment", id) : ""}<h3>Comments</h3>${f.comments.map((c) => `<p><b>${esc(c.author)} \xB7 ${esc(c.visibility)}</b><br>${esc(c.comment)}<br><small>${esc(c.created_at)}</small></p>`).join("")}<h3>Version history</h3>${f.versions.map((v) => `<p>${button("v" + v.version + " \xB7 " + v.status, "document", v.id)} ${v.active_version === "YES" ? "Active" : ""}</p>`).join("")}${review() && original && f.status === "APPROVED" && f.active === "YES" ? "<h3>Processed copies</h3>" + button("Price Redaction Prompt", "prompt:PRICE_REDACTION", id) + button("English Subtitle Prompt", "prompt:ENGLISH_SUBTITLE", id) + button("Upload Redacted PDF", "processed:REDACTED", id) + button("Upload English Subtitle PDF", "processed:EN_SUBTITLE", id) : ""}</div></div>`);
      const documentBytes = await fileBytes(f, id);
      documentUrl = URL.createObjectURL(new Blob([documentBytes], { type: f.type }));
      if (f.type === "application/pdf") {
        const iframe = document.createElement("iframe");
        iframe.title = "Document preview";
        iframe.src = documentUrl;
        $("preview").append(iframe);
      } else if (["image/png", "image/jpeg"].includes(f.type)) {
        const img = document.createElement("img");
        img.alt = f.name;
        img.src = documentUrl;
        $("preview").append(img);
      } else {
        const pre = document.createElement("pre");
        pre.textContent = new TextDecoder().decode(documentBytes);
        $("preview").append(pre);
      }
      bind();
    } catch (e) {
      $("msg").textContent = e.message;
    }
  }
  function upload(id, kind) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind ? "application/pdf" : ".pdf,.png,.jpg,.jpeg,.json,.geojson";
    input.onchange = async () => {
      try {
        const selectedFile = input.files[0];
        if (selectedFile?.size > 3 * 1024 * 1024) {
          const result = await largeUpload(id, kind, selectedFile);
          if (result) {
            closeDrawer();
            await load();
            $("msg").textContent = "File uploaded.";
          }
          return;
        }
        const file = await fileData(selectedFile);
        if (!kind) file.expected_document_id = state.tasks.find((t) => t.id === id)?.document_id || "";
        await act(kind ? "uploadProcessed" : "uploadEvidence", id, ...kind ? [kind, file] : [file]);
      } catch (e) {
        $("msg").textContent = e.message;
      }
    };
    input.click();
  }
  async function largeUpload(id, kind, file) {
    if (file.size > 25 * 1024 * 1024) throw Error("Maximum file size: 25 MiB");
    const task = kind ? state.tasks.find((t) => t.id === state.docs.find((d) => d.id === id)?.task_id) : state.tasks.find((t) => t.id === id);
    if (!task) throw Error("Upload task not found");
    const buffer = await file.arrayBuffer(), sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))].map((v) => v.toString(16).padStart(2, "0")).join(""), storageKey2 = "eudr_upload_" + state.user.email + "_" + task.id + "_" + sha256 + "_" + (kind || "EVIDENCE");
    let sessionId = sessionStorage.getItem(storageKey2);
    if (!sessionId) {
      const metadata = { name: file.name, type: file.type || "application/geo+json", size: file.size, sha256, expected_document_id: task.document_id || "" };
      if (kind) {
        metadata.kind = kind;
        metadata.source_document_id = id;
      }
      const session = await call("beginUpload", task.id, metadata);
      sessionId = session.id;
      sessionStorage.setItem(storageKey2, sessionId);
    }
    for (let index = 0; index < Math.ceil(file.size / 1048576); index++) {
      const bytes = new Uint8Array(buffer, index * 1048576, Math.min(1048576, file.size - index * 1048576));
      let text = "";
      for (let j = 0; j < bytes.length; j += 8192) text += String.fromCharCode(...bytes.subarray(j, j + 8192));
      $("msg").textContent = "Uploading " + Math.round(index * 1048576 / file.size * 100) + "%";
      await call("uploadChunk", sessionId, index, btoa(text));
    }
    const result = await call("finishUpload", sessionId);
    sessionStorage.removeItem(storageKey2);
    return result;
  }
  function promptStudio() {
    const caseId = selected && state.cases.some((c) => c.id === selected) ? selected : state.cases[0]?.id || "";
    $("main").innerHTML = '<div class="card"><p class="eyebrow">PROMPT STUDIO</p><h2>AI Assistant</h2><p>Inspect actual source documents in connected ChatGPT Work. Drive links alone are not file access.</p>' + select("promptOrder", "Order", state.cases.map((c) => [c.id, c.so]), caseId) + select("promptFunction", "Function", ["MATERIAL_EXTRACTION", "DOCUMENT_REVIEW", "PRICE_REDACTION", "ENGLISH_SUBTITLE"]) + select("promptDocument", "Document", []) + select("actionMode", "Action mode", ["ANALYZE_ONLY", "PREPARE_UPDATE", "AUTHORIZED_UPDATE"], "PREPARE_UPDATE") + '<label class="check" id="authorizeRow" hidden><input type="checkbox" id="authorizePrompt"> I explicitly authorize updates through existing controlled workflows. Human approval remains required.</label><button id="generatePrompt">Generate Prompt</button></div>';
    const orderSelect = document.querySelector('[name="promptOrder"]'), docSelect = document.querySelector('[name="promptDocument"]'), modeSelect = document.querySelector('[name="actionMode"]');
    const refreshDocs = () => {
      docSelect.innerHTML = '<option value="">Sales Order / collection</option>' + state.docs.filter((d) => d.case_id === orderSelect.value).map((d) => '<option value="' + esc(d.id) + '">' + esc(d.name + " \xB7 " + d.status) + "</option>").join("");
    };
    refreshDocs();
    orderSelect.onchange = refreshDocs;
    modeSelect.onchange = () => {
      $("authorizeRow").hidden = modeSelect.value !== "AUTHORIZED_UPDATE";
      $("authorizePrompt").checked = false;
    };
    $("generatePrompt").onclick = () => {
      if (modeSelect.value === "AUTHORIZED_UPDATE" && !$("authorizePrompt").checked) {
        $("msg").textContent = "Confirm the specific authorized action first.";
        return;
      }
      showPrompt(orderSelect.value, document.querySelector('[name="promptFunction"]').value, docSelect.value, modeSelect.value);
    };
  }
  async function showPrompt(caseId, fn, id = "", actionMode = "PREPARE_UPDATE") {
    try {
      const r = await call("getAiPrompt", caseId, fn, { documentId: id, actionMode });
      drawer("<h2>" + esc(fn.replace(/_/g, " ")) + "</h2><p>Action mode: " + esc(r.actionMode) + '</p><label>Generated prompt<textarea id="promptText" rows="15"></textarea></label><div class="row"><button id="copyPrompt">Copy Prompt</button><a class="link" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT</a></div><p>Inspect actual documents in a connected ChatGPT Work session. Links and metadata alone are insufficient.</p><label>Structured result JSON<textarea id="aiJson" rows="6"></textarea></label><button id="importAi">Import AI Result</button><div id="importResult"></div>');
      $("promptText").value = r.prompt;
      $("copyPrompt").onclick = async () => {
        try {
          await navigator.clipboard.writeText(r.prompt);
          $("msg").textContent = "Copied.";
        } catch {
          $("promptText").select();
          $("msg").textContent = "Select and copy the prompt.";
        }
      };
      $("importAi").onclick = async () => {
        try {
          const data = await call("importAiResult", r.id, $("aiJson").value);
          $("importResult").textContent = JSON.stringify(data, null, 2);
          if (fn === "MATERIAL_EXTRACTION") {
            $("importResult").append(document.createElement("br"));
            const b = document.createElement("button");
            b.textContent = "Confirm Materials & Create Folders";
            const json = $("aiJson").value;
            b.onclick = () => act("confirmMaterials", caseId, json, { confirmed: true, preview_hash: data.preview_hash });
            $("importResult").append(b);
          }
        } catch (e) {
          $("msg").textContent = e.message;
        }
      };
    } catch (e) {
      $("msg").textContent = e.message;
    }
  }
  function chainDialog(id) {
    const m = state.materials.find((m2) => m2.id === id);
    if (!m) return;
    $("msg").textContent = "";
    const nodes = state.chain.filter((n) => n.material_id === id);
    drawer("<h2>Supply Chain \xB7 " + esc(m.material) + '</h2><p>Link each upstream processor/supplier through to every production plot. Every node needs source evidence.</p><div class="chainlist">' + nodes.map((n) => `<div class="card"><b>${esc(state.suppliers.find((s) => s.id === n.supplier_id)?.name)}</b> \xB7 ${esc(n.node_type)}<br>Parent: ${esc(n.parent_id || "KODA")}<br>Plot: ${esc(n.plot_id || "\u2014")}<br>Evidence: ${esc(n.source_document_id || "Missing")}</div>`).join("") + "</div>" + (roles("ADMIN", "EUDR_REVIEWER", "MARKETING") ? '<form id="chainForm">' + select("supplier_id", "Supplier", state.suppliers.map((s) => [s.id, s.name])) + select("parent_id", "Parent relationship", [["", "KODA / direct root"], ...nodes.map((n) => [n.id, (state.suppliers.find((s) => s.id === n.supplier_id)?.name || n.id) + " \xB7 " + n.node_type])]) + select("node_type", "Type", ["SUPPLIER", "PROCESSOR", "LOG_SUPPLIER", "PLOT"]) + field("plot_id", "Plot ID (for plot nodes)") + select("source_document_id", "Source evidence", [["", "Missing"], ...state.docs.filter((d) => d.case_id === m.case_id).map((d) => [d.id, d.name])]) + "<button>Add relationship</button></form>" : ""));
    if ($("chainForm")) $("chainForm").onsubmit = (e) => {
      e.preventDefault();
      act("addChainNode", m.case_id, { ...Object.fromEntries(new FormData(e.target)), material_id: id });
    };
  }
  function geometryMap(geometry) {
    const points = geometry.type === "Point" ? [geometry.coordinates] : geometry.coordinates[0];
    if (points.some((p) => Math.abs(p[1]) > 85)) return "<p>High-latitude plot: use the coordinates below; Web Mercator basemap is unavailable above 85\xB0.</p>";
    const merc = (p) => [(p[0] + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + p[1] * Math.PI / 360)) / Math.PI) / 2], coords = points.map(merc), minX = Math.min(...coords.map((p) => p[0])), maxX = Math.max(...coords.map((p) => p[0])), minY = Math.min(...coords.map((p) => p[1])), maxY = Math.max(...coords.map((p) => p[1])), zoom = geometry.type === "Point" ? 13 : Math.max(1, Math.min(18, Math.floor(Math.log2(Math.min(500 / Math.max((maxX - minX) * 256, 1e-3), 300 / Math.max((maxY - minY) * 256, 1e-3)))))), scale = 256 * 2 ** zoom, cx = (minX + maxX) / 2 * scale, cy = (minY + maxY) / 2 * scale, left = cx - 320, top = cy - 200, toLocal = (p) => [(p[0] * scale - left).toFixed(3), (p[1] * scale - top).toFixed(3)];
    let tiles = "";
    for (let x = Math.floor(left / 256); x <= Math.floor((left + 640) / 256); x++) for (let y = Math.floor(top / 256); y <= Math.floor((top + 400) / 256); y++) {
      if (y < 0 || y >= 2 ** zoom) continue;
      const tileX = (x % 2 ** zoom + 2 ** zoom) % 2 ** zoom;
      tiles += `<image href="https://tile.openstreetmap.org/${zoom}/${tileX}/${y}.png" x="${x * 256 - left}" y="${y * 256 - top}" width="256" height="256"/>`;
    }
    const shape = geometry.type === "Point" ? `<circle cx="${toLocal(coords[0])[0]}" cy="${toLocal(coords[0])[1]}" r="7" class="plotpoint"/>` : `<polygon points="${coords.map((p) => toLocal(p).join(",")).join(" ")}" class="plotpolygon"/>`;
    return `<svg class="geomap" viewBox="0 0 640 400" role="img" aria-label="${geometry.type} geolocation plot on OpenStreetMap"><rect width="640" height="400" fill="#eef0e6"/>${tiles}${shape}</svg><p class="muted">\xA9 OpenStreetMap contributors \xB7 Plot geometry remains visible if tiles cannot load.</p>`;
  }
  function geoDialog(id) {
    const m = state.materials.find((m2) => m2.id === id);
    if (!m) return;
    const gs = state.geo.filter((g) => g.material_id === id), nodes = state.chain.filter((n) => n.material_id === id && n.node_type === "PLOT");
    drawer("<h2>GEO \xB7 " + esc(m.material) + "</h2><p>Geometry review is separate from legality and deforestation assessment.</p>" + gs.map((g) => {
      let geometry;
      try {
        geometry = JSON.parse(g.geometry_json);
      } catch {
        return "<p>Malformed stored geometry. Review required.</p>";
      }
      const p = geometry.type === "Point" ? geometry.coordinates : geometry.coordinates[0][0];
      return `<section class="card"><h3>${esc(g.plot_id)} \xB7 ${esc(g.country_of_production)}</h3><p>${esc(g.verification_status)} \xB7 ${esc(g.area_ha)} ha \xB7 ${esc(g.production_range)}</p>${geometryMap(geometry)}<p>Coordinates: ${esc(JSON.stringify(geometry))}</p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p[1] + "," + p[0])}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a><p>${button("Source evidence", "document", g.source_document_id)}${review() ? button("Review GEO", "reviewGeo", g.id) : ""}</p></section>`;
    }).join("") + (write() ? '<form id="geoForm"><h3>Register plot</h3>' + select("chain_node_id", "Plot relationship", nodes.map((n) => [n.id, n.plot_id])) + field("plot_id", "Exact Plot ID", "text", "", true) + field("country_of_production", "Commodity production country (ISO code)", "text", "", true) + field("production_range", "Production date / range", "text", "", true) + field("area_ha", "Plot area (ha)", "number", "", true) + field("coordinate_precision_digits", "Source precision (decimal digits, 6\u201312)", "number", "", true) + select("source_document_id", "Source document", state.docs.filter((d) => d.material_id === id).map((d) => [d.id, d.name])) + '<label>GeoJSON Geometry (Point or single-ring Polygon)<textarea name="geometry" rows="6" required></textarea></label>' + field("notes", "Notes") + "<button>Validate & Register</button></form>" : ""));
    if ($("geoForm")) {
      $("geoForm").elements.area_ha.step = "any";
      $("geoForm").onsubmit = (e) => {
        e.preventDefault();
        try {
          const input = Object.fromEntries(new FormData(e.target));
          input.geometry = JSON.parse(input.geometry);
          input.material_id = id;
          act("saveGeo", m.case_id, input);
        } catch (e2) {
          $("msg").textContent = e2.message;
        }
      };
    }
    bind();
  }
  function calendar() {
    const y = month.getFullYear(), m = month.getMonth(), date = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, open = state.tasks.filter((t) => t.status !== "APPROVED" && t.due);
    let html = '<div class="card"><div class="pagehead"><h2>Calendar \xB7 ' + month.toLocaleDateString("en", { month: "long", year: "numeric" }) + '</h2><div class="row"><button id="prevMonth">Previous</button><button id="nextMonth">Next</button></div></div><div class="row">' + ["Month", "Week", "List", "My Tasks"].map((mode) => `<button data-calendar-mode="${mode}">${mode}</button>`).join("") + (roles("ADMIN", "MARKETING", "EUDR_REVIEWER") ? button("Sync configured Calendar", "syncCalendar") : "") + "</div><p>Assigned evidence deadlines \xB7 Vietnam time. Completed events are retained.</p>";
    if (calendarMode === "Month") {
      html += '<div class="scroll"><div class="calendar">' + ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => "<b>" + d + "</b>").join("") + "<div></div>".repeat((new Date(y, m, 1).getDay() + 6) % 7);
      for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) html += `<div class="day">${day}` + open.filter((t) => t.due === date(day)).map((t) => `<button class="event" data-action="open" data-id="${esc(t.case_id)}">${esc(state.cases.find((c) => c.id === t.case_id)?.so)}<br>${esc(t.evidence)}</button>`).join("") + "</div>";
      html += "</div></div>";
    } else {
      let ts = open;
      if (calendarMode === "My Tasks") ts = ts.filter((t) => t.owner === state.user.email || t.assigned_reviewer === state.user.email);
      if (calendarMode === "Week") {
        const start2 = new Date(month.getFullYear(), month.getMonth(), month.getDate(), 12);
        start2.setDate(start2.getDate() - (start2.getDay() + 6) % 7);
        const end = new Date(start2);
        end.setDate(end.getDate() + 6);
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        ts = ts.filter((t) => t.due >= fmt(start2) && t.due <= fmt(end));
      }
      html += taskTable(ts.sort((a, b) => a.due.localeCompare(b.due)));
    }
    $("main").innerHTML = html + "</div>";
    $("prevMonth").onclick = () => {
      month = new Date(y, m - 1, 1);
      calendar();
      bind();
    };
    $("nextMonth").onclick = () => {
      month = new Date(y, m + 1, 1);
      calendar();
      bind();
    };
    document.querySelectorAll("[data-calendar-mode]").forEach((b) => b.onclick = () => {
      calendarMode = b.dataset.calendarMode;
      calendar();
      bind();
    });
  }
  function users() {
    $("main").innerHTML = '<div class="pagehead"><h2>Users</h2>' + button("Add User", "userForm") + '</div><div class="card scroll"><table><tr><th>Name / Email</th><th>Function</th><th>Role</th><th>Supplier</th><th>Active</th><th></th></tr>' + state.owners.map((u) => `<tr><td>${esc(u.name)}<br>${esc(u.email)}</td><td>${esc(u.department)}</td><td>${esc(u.role)}</td><td>${esc(state.suppliers.find((s) => s.id === u.supplier_id)?.name)}</td><td>${esc(u.active)}</td><td>${button("Edit", "userForm", u.email)}</td></tr>`).join("") + "</table></div><p>Add the user in 05_OWNER_MASTER, then invite the same email through Netlify Identity. Disabling a user revokes backend access immediately.</p>";
  }
  function userForm(email) {
    const u = state.owners.find((u2) => u2.email === email) || {}, orders2 = JSON.parse(u.assigned_orders || "[]");
    drawer('<h2>User access</h2><form id="userForm">' + field("name", "Full Name", "text", u.name || "", true) + field("email", "Email", "email", u.email || "", true) + field("department", "Function / Department", "text", u.department || "") + select("role", "Security Role", ["ADMIN", "MARKETING", "EUDR_REVIEWER", "INTERNAL_USER", "SUPPLIER_USER", "VIEWER"], u.role || "INTERNAL_USER") + select("supplier_id", "Supplier / Company", [["", "Internal"], ...state.suppliers.map((s) => [s.id, s.name])], u.supplier_id || "") + select("active", "Active", ["YES", "NO"], u.active || "YES") + "<fieldset><legend>Assigned Orders</legend>" + state.cases.map((c) => `<label class="check"><input type="checkbox" name="order" value="${esc(c.id)}" ${orders2.includes(c.id) ? "checked" : ""}>${esc(c.so)}</label>`).join("") + "</fieldset><button>Save User</button></form>");
    $("userForm").onsubmit = (e) => {
      e.preventDefault();
      const form = new FormData(e.target), input = Object.fromEntries(form);
      input.assigned_orders = form.getAll("order");
      delete input.order;
      act("manageUser", input);
    };
  }
  function suppliers() {
    $("main").innerHTML = '<div class="pagehead"><h2>Suppliers</h2>' + button("Add Supplier", "supplierForm") + "</div>" + state.suppliers.map((s) => `<div class="card"><h3>${esc(s.name)}</h3>${esc(s.email)} \xB7 ${s.active === "YES" ? "Active" : "Disabled"}<p>${button("Edit", "supplierForm", s.id)}</p></div>`).join("");
  }
  function supplierForm(id) {
    const s = state.suppliers.find((s2) => s2.id === id) || {};
    drawer('<h2>Supplier</h2><form id="supplierForm">' + field("name", "Supplier legal name", "text", s.name || "", true) + field("email", "Contact email", "email", s.email || "") + select("active", "Active", ["YES", "NO"], s.active || "YES") + "<button>Save Supplier</button></form>");
    $("supplierForm").onsubmit = (e) => {
      e.preventDefault();
      const input = Object.fromEntries(new FormData(e.target));
      if (s.id) input.id = s.id;
      act("manageSupplier", input);
    };
  }
  function settings() {
    const keys = ["RULES_CONFIRMED", "LEGAL_RULE_VERSION", "ANNEX_I_VERSION", "COUNTRY_RISK_VERSION", "LAST_LEGAL_REVIEW_DATE", "LEGAL_REVIEWED_BY", "LEGAL_REVIEW_MAX_DAYS"];
    $("main").innerHTML = '<div class="card"><h2>Settings \xB7 Legal freshness</h2><p>Record the exact official versions checked and the responsible human reviewer. A version label alone does not validate evidence.</p><form id="settingsForm">' + keys.map((k) => k === "RULES_CONFIRMED" ? select(k, k, ["NO", "YES"], state.settings.find((s) => s.key === k)?.value) : field(k, k, k === "LAST_LEGAL_REVIEW_DATE" ? "date" : "text", state.settings.find((s) => s.key === k)?.value || "")).join("") + '<button>Save Settings</button></form><h3>Production country risk</h3><p>Country risk applies to commodity production origin. Register only classifications checked against official EU sources.</p><form id="riskForm">' + field("country_code", "ISO country code", "text", "", true) + select("risk_level", "Risk", ["LOW", "STANDARD", "HIGH"]) + field("rule_version", "Official version", "text", "", true) + field("checked_at", "Checked date", "date", "", true) + field("source_url", "Official EU source URL", "url", "", true) + "<button>Record Human Review</button></form></div>";
    $("settingsForm").onsubmit = (e) => {
      e.preventDefault();
      act("saveSettings", Object.fromEntries(new FormData(e.target)));
    };
    $("riskForm").onsubmit = (e) => {
      e.preventDefault();
      act("saveCountryRisk", Object.fromEntries(new FormData(e.target)));
    };
  }
  function audit() {
    $("main").innerHTML = '<div class="card scroll"><h2>Audit Trail</h2><p>Append-only history. Latest 250 entries in assigned scope.</p><table><tr><th>Time</th><th>Actor</th><th>Action</th><th>Order / Object</th><th>Change</th></tr>' + state.audit.slice().reverse().map((a) => `<tr><td>${esc(a.timestamp)}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(state.cases.find((c) => c.id === a.case_id)?.so)}<br>${esc(a.entity_id)}</td><td>${esc(a.next)}</td></tr>`).join("") + "</table></div>";
  }
  function exports() {
    $("main").innerHTML = '<div class="card"><h2>Export Center</h2><p>Default: approved active evidence only. Processed copies require explicit human verification.</p>' + select("exportOrder", "Order", state.cases.map((c) => [c.id, c.so]), selected) + '<div id="exportList"></div></div>';
    const draw = () => {
      const id = document.querySelector('[name="exportOrder"]').value;
      selected = id;
      const docs = state.docs.filter((d) => d.case_id === id && ["EVIDENCE", "REDACTED", "EN_SUBTITLE"].includes(d.kind));
      $("exportList").innerHTML = "<fieldset><legend>Select evidence</legend>" + docs.map((d) => `<label class="check"><input name="exportDoc" type="checkbox" value="${esc(d.id)}" ${d.status === "APPROVED" && d.active_version === "YES" ? "checked" : ""}>${esc(d.name)} \xB7 v${d.version} \xB7 ${esc(d.status)} \xB7 ${d.active_version === "YES" ? "Active" : "History"}</label>`).join("") + "</fieldset>" + (roles("ADMIN") ? '<label class="check"><input id="includeHistory" type="checkbox">Include history</label>' : "") + '<div class="row"><button id="exportFull">Full Package</button><button id="exportSelected">Selected Package</button></div>';
      const run = async (full) => {
        const input = { include_history: !!$("includeHistory")?.checked };
        if (!full) input.document_ids = [...document.querySelectorAll('[name="exportDoc"]:checked')].map((i) => i.value);
        const result = await act("exportPackage", id, input);
        if (result) download(result.download_id);
      };
      $("exportFull").onclick = () => run(true);
      $("exportSelected").onclick = () => run(false);
    };
    document.querySelector('[name="exportOrder"]').onchange = draw;
    draw();
  }
  function materialInfo(id) {
    const m = state.materials.find((m2) => m2.id === id);
    if (!m) return;
    let countries = [];
    try {
      countries = JSON.parse(m.production_countries || "[]");
    } catch {
    }
    const risk = countries.map((code) => code + ": " + (state.countryRisk.find((r) => r.country_code === code)?.risk_level || "NOT REVIEWED")).join("; ");
    drawer("<h2>Material Information \xB7 " + esc(m.material) + "</h2><p>Production country risk: " + esc(risk || "Production origin not provided") + "</p>" + (roles("ADMIN", "MARKETING", "EUDR_REVIEWER") ? '<form id="materialInfoForm">' + ["commodity", "common_species", "scientific_name", "hs_cn_code", "quantity", "quantity_uom", "production_range"].map((k) => field(k, k.replace(/_/g, " "), "text", m[k] || "")).join("") + field("countries", "Production countries (ISO codes, comma separated)", "text", countries.join(",")) + select("scope_status", "Human scope assessment", ["NOT_PROVIDED", "REVIEW_REQUIRED", "IN_SCOPE", "OUT_OF_SCOPE"], m.scope_status || "NOT_PROVIDED") + field("scope_rule_version", "Checked Annex I version", "text", m.scope_rule_version || "") + select("metadata_source_document_id", "Source for metadata", state.docs.filter((d) => d.case_id === m.case_id).map((d) => [d.id, d.name]), m.metadata_source_document_id || "") + field("metadata_reference", "Source page and fields", "text", m.metadata_reference || "", true) + field("legality", "Legality evidence IDs (comma separated)", "text", JSON.parse(m.legality_evidence_ids || "[]").join(",")) + field("deforestation", "Deforestation evidence IDs (comma separated)", "text", JSON.parse(m.deforestation_evidence_ids || "[]").join(",")) + "<button>Save source-backed information</button></form>" : "<p>" + esc(m.scientific_name || "NOT PROVIDED") + "</p>"));
    if ($("materialInfoForm")) $("materialInfoForm").onsubmit = (e) => {
      e.preventDefault();
      const input = Object.fromEntries(new FormData(e.target)), list = (s) => s.split(",").map((s2) => s2.trim()).filter(Boolean);
      input.production_countries = list(input.countries);
      input.legality_evidence_ids = list(input.legality);
      input.deforestation_evidence_ids = list(input.deforestation);
      delete input.countries;
      delete input.legality;
      delete input.deforestation;
      act("updateMaterialInfo", id, input);
    };
  }
  function certificateForm(id) {
    drawer('<h2>Certificate metadata</h2><form id="certificateForm">' + field("holder", "Certificate holder", "text", "", true) + field("number", "Certificate number", "text", "", true) + field("scope", "Scope", "text", "", true) + field("issue_date", "Issue date", "date", "", true) + field("expiry_date", "Expiry date", "date", "", true) + "<button>Record verified fields</button></form>");
    $("certificateForm").onsubmit = (e) => {
      e.preventDefault();
      act("saveCertificate", id, Object.fromEntries(new FormData(e.target)));
    };
  }
  function bind() {
    document.querySelectorAll("[data-action]").forEach((b) => b.onclick = async () => {
      const action = b.dataset.action, id = b.dataset.id;
      try {
        if (action === "open") go("Workspace", id);
        else if (action === "newOrder") newOrder();
        else if (action === "openTasks") go("My Tasks");
        else if (action === "openOrders") go("Orders");
        else if (action === "document") await documentView(id);
        else if (action === "download") await download(id);
        else if (action === "upload") upload(id);
        else if (action === "assign") assignDialog(id);
        else if (action === "materials") materialsDialog(id);
        else if (action === "materialPrompt") await showPrompt(id, "MATERIAL_EXTRACTION");
        else if (action === "chain") chainDialog(id);
        else if (action === "geo") geoDialog(id);
        else if (action === "submit") await act("submitDocument", id);
        else if (action === "syncCalendar") {
          const r = await act("syncCalendar");
          if (r?.some((x) => x.status === "CALENDAR_ACCESS_REQUIRED")) $("msg").textContent = "Calendar access required; tasks remain saved.";
        } else if (action.startsWith("review:")) await act("reviewDocument", id, action.slice(7), $("reviewNote").value);
        else if (action === "comment") await act("addComment", id, { visibility: document.querySelector('[name="visibility"]').value, comment: $("reviewNote").value });
        else if (action.startsWith("prompt:")) await showPrompt(state.docs.find((d) => d.id === id).case_id, action.slice(7), id);
        else if (action.startsWith("processed:")) upload(id, action.slice(10));
        else if (action === "verifyProcessed") {
          const note = $("reviewNote").value;
          if (!note) throw Error("Record verification checks in the review note first");
          await act("verifyProcessed", id, { verified: true, notes: note });
        } else if (action === "reviewGeo") {
          drawer('<h2>GEO review</h2><form id="geoReviewForm">' + select("status", "Decision", ["VERIFIED", "REJECTED", "MORE_INFO_REQUIRED"]) + '<label>Review notes<textarea name="notes" required rows="4"></textarea></label><p>Verification does not certify deforestation-free status or legal compliance.</p><button>Record review</button></form>');
          $("geoReviewForm").onsubmit = (e) => {
            e.preventDefault();
            act("reviewGeo", id, Object.fromEntries(new FormData(e.target)));
          };
        } else if (action === "closeOrder") {
          drawer('<h2>Close internal evidence workflow</h2><p>This records workflow closure. It does not certify EUDR compliance or submit a declaration.</p><form id="closeOrderForm"><label>Human review notes<textarea name="comment" required rows="4"></textarea></label><button>Confirm Internal Closure</button></form>');
          $("closeOrderForm").onsubmit = (e) => {
            e.preventDefault();
            act("completeCase", id, { confirmed: true, comment: new FormData(e.target).get("comment") });
          };
        } else if (action === "materialInfo") materialInfo(id);
        else if (action === "certificate") certificateForm(id);
        else if (action === "readNotification") await act("markNotification", id);
        else if (action === "userForm") userForm(id);
        else if (action === "supplierForm") supplierForm(id);
      } catch (e) {
        $("msg").textContent = e.message;
      }
    });
  }
  async function start() {
    watchTranslations();
    try {
      const callback = await handleAuthCallback();
      if (callback?.type === "invite" && callback.token) {
        signIn();
        drawer('<h2>Accept invitation</h2><form id="inviteForm"><label>New password<input name="password" type="password" required minlength="12" autocomplete="new-password"></label><button>Create account</button></form>');
        $("inviteForm").onsubmit = async (e) => {
          e.preventDefault();
          try {
            await acceptInvite(callback.token, new FormData(e.target).get("password"));
            closeDrawer();
            await call("recordLogin");
            await load();
          } catch (error) {
            $("msg").textContent = error.message;
          }
        };
        return;
      }
      if (callback?.type === "recovery") {
        signIn();
        passwordDialog("Reset password");
        return;
      }
      await load();
    } catch (error) {
      signIn(error.message);
    }
  }
  start();
})();
