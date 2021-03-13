import React, { useEffect } from 'react';
import { StoreProvider } from 'easy-peasy';
import store from './store';
import '@cognite/cogs.js/dist/cogs.css';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useParams,
} from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { useStoreState } from './hooks';
import { useLogin } from './store/auth';
import { Loader, ToastContainer } from '@cognite/cogs.js';
import { QueryClient, QueryClientProvider } from 'react-query';

const client = new QueryClient();

function App() {
  return (
    <StoreProvider store={store}>
      <ToastContainer />
      <QueryClientProvider client={client}>
        <Router>
          <Switch>
            <Route exact path="/">
              <LoginPage />
            </Route>
            <Route exact path="/:tenant">
              <RedirectToUrlTenant>
                <ExplorerPage />
              </RedirectToUrlTenant>
            </Route>
          </Switch>
        </Router>
      </QueryClientProvider>
    </StoreProvider>
  );
}

const RedirectToUrlTenant = ({
  children = null,
}: {
  children: React.ReactNode;
}) => {
  const { tenant: urlTenant } = useParams<{ tenant: string }>();
  const isSignedIn = useStoreState((state) => state.auth.loggedIn);
  const loginType = useStoreState((state) => state.auth.loginType);
  const apiKey = useStoreState((state) => state.auth.apiKey);
  const tenant = useStoreState((state) => state.auth.tenant);
  const login = useLogin();

  useEffect(() => {
    // when the url tenant and the stored tenant is not the same, try to login with oauth
    if (tenant !== urlTenant) {
      login({ tenant: urlTenant });
    }
  }, [tenant, urlTenant, login]);

  useEffect(() => {
    // first time loading back into `tenant`
    if (isSignedIn === undefined) {
      if (loginType === 'APIKEY') {
        login({ apiKey });
      } else if (loginType === 'OAUTH') {
        if (tenant === urlTenant) {
          login({ tenant });
        }
      }
    }
  }, [isSignedIn, login, loginType, apiKey, tenant, urlTenant]);

  if (isSignedIn === undefined) {
    return <Loader darkMode />;
  }

  if (!isSignedIn) {
    return <LoginPage />;
  }
  return <>{children}</>;
};

export default App;
