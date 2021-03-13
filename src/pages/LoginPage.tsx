import React, { useState, useEffect } from 'react';
import { resetCDFClient } from '../utils/auth';
import { useStoreState } from '../hooks';
import {
  Input,
  Button,
  Title,
  Body,
  ButtonGroup,
  toast,
  Colors,
} from '@cognite/cogs.js';
import styled from 'styled-components/macro';
import { useHistory } from 'react-router-dom';
import { useLogin } from '../store/auth';

export const LoginPage = () => {
  const storeApiKey = useStoreState((state) => state.auth.apiKey);
  const storeTenant = useStoreState((state) => state.auth.tenant);

  const login = useLogin();

  const [apiKey, setApiKey] = useState('');
  const [tenant, setTenant] = useState('');
  const [activeTab, setActiveTab] = useState('tenant');
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setApiKey(storeApiKey || '');
    setTenant(storeTenant || 'akso-dev');
  }, [storeApiKey, storeTenant]);

  const history = useHistory();

  const isTenantActive = activeTab === 'tenant';

  const isLoginAllowed = isTenantActive
    ? tenant.trim().length !== 0
    : apiKey.trim().length !== 0;

  const onLogIn = async () => {
    if (!isLoginAllowed) {
      toast.error(
        <>
          <Title level={5}>
            You must provide a CDF project or a valid API key
          </Title>
          <Body>Are you sure you entered a valid api key to your tenant?</Body>
        </>,
        { autoClose: 3000 }
      );
      return;
    }
    // TODO remove!
    if (tenant !== `akso-dev`) {
      toast.error(
        <>
          <Title level={5}>Only "akso-dev" for this demo is allowed.</Title>
        </>,
        { autoClose: 3000 }
      );
      return;
    }
    setLoading(true);
    resetCDFClient();
    try {
      let success = false;
      let project: undefined | string;
      if (isTenantActive) {
        ({ tenant: project, loggedIn: success } = await login({ tenant }));
      } else {
        ({ tenant: project, loggedIn: success } = await login({ apiKey }));
      }

      if (!success) {
        throw new Error('Unable to login');
      }
      history.push(`/${project}`);
    } catch (ex) {
      toast.error(
        <>
          <Title level={5}>Could not log you in</Title>
          <Body>Are you sure you entered a valid api key to your tenant?</Body>
        </>,
        { autoClose: 3000 }
      );
    }
    setLoading(false);
  };

  return (
    <StyledPage>
      <LoginWrapper>
        <Title style={{ marginBottom: '2rem' }}>
          <span role="img" aria-label="hi">
            👋
          </span>{' '}
          Welcome to Explorer v2
        </Title>
        <ButtonGroup
          currentKey={activeTab}
          onButtonClicked={setActiveTab}
          style={{ marginBottom: 16 }}
        >
          <ButtonGroup.Button key="tenant">
            Login using project name
          </ButtonGroup.Button>
          <ButtonGroup.Button disabled key="apikey" data-id="api-key-button">
            Login using API Key
          </ButtonGroup.Button>
        </ButtonGroup>
        {isTenantActive ? (
          <>
            <Body style={{ marginBottom: 16 }}>
              The last part of the url https://fusion.cognite.com/
              <strong>project</strong>
            </Body>
            <Input
              label="tenant"
              name="tenant"
              data-id="tenant-input"
              autoFocus
              fullWidth
              onChange={(event) => {
                setTenant(event.target.value);
              }}
              value={tenant}
            />
          </>
        ) : (
          <>
            <Body style={{ marginBottom: 16 }}>
              Contact your CDF admin for an API key to your tenant
            </Body>
            <Input
              name="apikey"
              data-id="api-key-input"
              type="password"
              fullWidth
              onChange={(event) => {
                setApiKey(event.target.value);
              }}
              value={apiKey}
            />
          </>
        )}
        <Button
          loading={isLoading}
          block
          htmlType="submit"
          disabled={!isLoginAllowed || isLoading}
          style={{ marginTop: 16 }}
          type={isLoginAllowed ? 'primary' : 'secondary'}
          onClick={onLogIn}
        >
          Login
        </Button>
      </LoginWrapper>
    </StyledPage>
  );
};

const StyledPage = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background: ${Colors['midblue-7'].hex()};
  background-size: cover;
`;

const LoginWrapper = styled.div`
  display: flex;
  position: relative;
  flex-wrap: initial;
  flex-direction: column;
  -webkit-box-pack: start;
  justify-content: flex-start;
  width: 50%;
  background-color: rgba(255, 255, 255, 0.95);
  margin: auto;
  padding: 40px 50px 30px 50px;
  overflow: auto;
`;
