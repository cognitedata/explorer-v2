import { action, Action } from 'easy-peasy';
import { useStoreActions } from '../hooks';
import { getCDFClient } from '../utils/auth';

type LoginType = 'APIKEY' | 'OAUTH' | undefined;

export interface AuthModel {
  apiKey: string | undefined;
  tenant: string | undefined;
  loggedIn: boolean | undefined;
  loginType: LoginType;
  // methods
  setLoggedIn: Action<AuthModel, { apiKey?: string; tenant?: string } | false>;
}

export const API_KEY_LOCALSTORAGE_KEY = '__itg__api_key';
export const TENANT_LOCALSTORAGE_KEY = '__itg__tenant';
export const LOGIN_TYPE_LOCALSTORAGE_KEY = '__itg__type';
export const BEARER_TOKEN_LOCALSTORAGE_KEY = '__itg__bearer_token';

export const authModel: AuthModel = {
  apiKey: localStorage.getItem(API_KEY_LOCALSTORAGE_KEY) || undefined,
  tenant: localStorage.getItem(TENANT_LOCALSTORAGE_KEY) || undefined,
  loggedIn: undefined,
  loginType:
    (localStorage.getItem(LOGIN_TYPE_LOCALSTORAGE_KEY) as LoginType) ||
    undefined,
  // methods
  setLoggedIn: action((state, params) => {
    if (!params) {
      state.apiKey = undefined;
      state.tenant = undefined;
      state.loginType = undefined;
      state.loggedIn = false;
    } else {
      const { apiKey, tenant } = params;
      if (tenant && tenant.length !== 0) {
        localStorage.setItem(TENANT_LOCALSTORAGE_KEY, tenant);
        state.tenant = tenant;
        state.loginType = 'OAUTH';
      }
      if (apiKey && apiKey.length !== 0) {
        localStorage.setItem(API_KEY_LOCALSTORAGE_KEY, apiKey);
        state.apiKey = apiKey;
        state.loginType = 'APIKEY';
      }
      if (state.loginType) {
        localStorage.setItem(
          LOGIN_TYPE_LOCALSTORAGE_KEY,
          state.loginType.toString()
        );
        state.loggedIn = true;
      }
    }
  }),
};

export const useLogin = () => {
  const setLoggedIn = useStoreActions((state) => state.auth.setLoggedIn);
  return async ({ apiKey, tenant }: { apiKey?: string; tenant?: string }) => {
    const cdfClient = getCDFClient();
    if (apiKey) {
      await handleLoginForApiKey(apiKey);
    } else if (tenant) {
      await handleLoginForTenant(tenant);
    }

    const response = await cdfClient.login.status();
    if (response) {
      const { user, project } = response;
      setLoggedIn({ tenant: project, apiKey });
      return { loggedIn: true, tenant: project, user };
    }
    setLoggedIn(false);
    return { loggedIn: false };
  };
};

const handleLoginForApiKey = async (apiKey: string) => {
  const cdfClient = getCDFClient();
  const loginData = await fetch('https://api.cognitedata.com/login/status', {
    headers: {
      'api-key': apiKey,
    },
  });
  const asJson = await loginData.json();
  const { project, loggedIn } = asJson.data;
  if (loggedIn !== true) {
    throw new Error('Could not log in');
  }
  await cdfClient.loginWithApiKey({
    project,
    apiKey,
  });
};

const handleLoginForTenant = async (tenant: string) => {
  const cdfClient = getCDFClient();
  await cdfClient.loginWithOAuth({
    project: tenant,
    onTokens: ({ accessToken }) => {
      localStorage.setItem(BEARER_TOKEN_LOCALSTORAGE_KEY, accessToken);
    },
  });
  await cdfClient.authenticate();
};
