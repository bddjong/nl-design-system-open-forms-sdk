import {fireEvent} from '@testing-library/react';
import {render as renderTest, screen} from '@testing-library/react';
import messagesNL from 'i18n/compiled/nl.json';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {IntlProvider} from 'react-intl';

import {ConfigContext} from 'Context';
import {buildForm} from 'api-mocks';
import {LiteralsProvider} from 'components/Literal';

import LoginOptions from './index';

let container = null;
let root = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  // cleanup on exiting
  root.unmount();
  container.remove();
  root = null;
  container = null;
});

it('Login not required, options wrapped in form tag', () => {
  const form = buildForm({loginRequired: false, loginOptions: []});
  const onFormStart = jest.fn(e => e.preventDefault());

  act(() => {
    root.render(
      <LiteralsProvider literals={{beginText: {resolved: 'Begin Form'}}}>
        <LoginOptions form={form} onFormStart={onFormStart} />
      </LiteralsProvider>
    );
  });

  expect(container.firstChild.nodeName).toEqual('FORM');
  const anonymousStartButton = container.getElementsByTagName('button')[0];
  expect(anonymousStartButton).not.toBeUndefined();

  fireEvent.click(anonymousStartButton);

  expect(onFormStart).toHaveBeenCalled();
});

it('Login required, options not wrapped in form tag', () => {
  const form = buildForm({
    loginRequired: true,
    loginOptions: [
      {
        identifier: 'digid',
        label: 'DigiD',
        url: 'https://open-forms.nl/auth/form-slug/digid/start',
        logo: {
          title: 'DigiD simulatie',
          imageSrc: '/digid.png',
          href: 'https://www.digid.nl/',
          appearance: 'light',
        },
        isForGemachtigde: false,
      },
    ],
  });
  const onFormStart = jest.fn(e => e.preventDefault());

  const {location} = window;
  delete window.location;
  window.location = {
    href: 'https://open-forms.nl/digid-form/',
  };

  act(() => {
    root.render(
      <IntlProvider locale="nl" messages={messagesNL}>
        <LoginOptions form={form} onFormStart={onFormStart} />
      </IntlProvider>
    );
  });

  const expectedUrl = new URL(form.loginOptions[0].url);
  expectedUrl.searchParams.set('next', 'https://open-forms.nl/digid-form/?_start=1');

  expect(container.firstChild.nodeName).toEqual('DIV');
  const anonymousStartButton = container.getElementsByTagName('button')[0];
  expect(anonymousStartButton).toBeUndefined();

  const digidLoginButton = container.getElementsByTagName('a')[0];
  expect(digidLoginButton.href).toEqual(expectedUrl.toString());

  window.location = location;
});

it('Login button has the right URL after cancelling log in', () => {
  const form = buildForm({
    loginRequired: true,
    loginOptions: [
      {
        identifier: 'digid',
        label: 'DigiD',
        url: 'https://open-forms.nl/auth/form-slug/digid/start',
        logo: {
          title: 'DigiD simulatie',
          imageSrc: '/digid.png',
          href: 'https://www.digid.nl/',
          appearance: 'light',
        },
        isForGemachtigde: false,
      },
    ],
  });

  const onFormStart = jest.fn(e => e.preventDefault());

  const {location} = window;
  delete window.location;
  window.location = {
    href: 'https://open-forms.nl/digid-form/?_start=1&_digid-message=login-cancelled',
  };

  act(() => {
    root.render(
      <IntlProvider locale="nl" messages={messagesNL}>
        <LoginOptions form={form} onFormStart={onFormStart} />
      </IntlProvider>
    );
  });

  const expectedUrl = new URL(form.loginOptions[0].url);
  expectedUrl.searchParams.set('next', 'https://open-forms.nl/digid-form/?_start=1');

  expect(container.firstChild.nodeName).toEqual('DIV');
  const anonymousStartButton = container.getElementsByTagName('button')[0];
  expect(anonymousStartButton).toBeUndefined();

  const digidLoginButton = container.getElementsByTagName('a')[0];
  expect(digidLoginButton.href).toEqual(expectedUrl.toString());

  window.location = location;
});

it('Login button has the right URL for cosign', () => {
  const form = buildForm({
    cosignLoginInfo: {
      identifier: 'digid',
      label: 'DigiD',
      url: 'https://open-forms.nl/auth/form-slug/digid/start?next=https://open-forms.nl/submissions/form-slug/find/',
      logo: {
        title: 'DigiD simulatie',
        imageSrc: '/digid.png',
        href: 'https://www.digid.nl/',
        appearance: 'light',
      },
      isForGemachtigde: false,
    },
  });

  const onFormStart = jest.fn(e => e.preventDefault());

  const {location} = window;
  delete window.location;
  window.location = {
    href: 'https://open-forms.nl/form-slug',
  };

  renderTest(
    <IntlProvider locale="nl" messages={messagesNL}>
      <LiteralsProvider literals={{beginText: {resolved: 'Begin Form'}}}>
        <ConfigContext.Provider
          value={{
            baseUrl: 'https://open-forms.nl/api/v2/',
          }}
        >
          <LoginOptions form={form} onFormStart={onFormStart} />
        </ConfigContext.Provider>
      </LiteralsProvider>
    </IntlProvider>,
    container
  );

  const expectedUrl = new URL(
    'https://open-forms.nl/auth/form-slug/digid/start?' +
      'next=https%3A%2F%2Fopen-forms.nl%2Fsubmissions%2Fform-slug%2Ffind%2F%3F' +
      'next%3Dhttps%253A%252F%252Fopen-forms.nl%252Fform-slug%252Fcosign%252Fcheck'
  );

  const cosignLoginButton = screen.queryByRole('link', {name: 'Inloggen met DigiD'});
  expect(cosignLoginButton).toBeInTheDocument();
  expect(cosignLoginButton.href).toEqual(expectedUrl.href);

  window.location = location;
});
