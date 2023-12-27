import '@gemeente-denhaag/design-tokens-components/dist/theme/index.css';
import '@nl-design-system-unstable/rotterdam-design-tokens/dist/index.css';
import '@utrecht/design-tokens/dist/index.css';
import 'design-token-editor/lib/css/dte.css';
import 'design-token-editor/lib/css/root.css';
import 'flatpickr';
import 'flatpickr/dist/l10n/nl.js';
import {fixIconUrls as fixLeafletIconUrls} from 'map';
import {initialize, mswDecorator, mswLoader} from 'msw-storybook-addon';
import {Formio, Templates} from 'react-formio';
import 'scss/dte-theme.scss';
// load these AFTER the community styles, which is closer in simulating the CSS loading
// order of our own components
import 'styles.scss';

// ensure NL locale is included
import OpenFormsModule from 'formio/module';
import OFLibrary from 'formio/templates';

import {
  utrechtDocumentDecorator,
  withClearSessionStorage,
  withClearSubmissionLocalStorage,
} from './decorators';
import {reactIntl} from './reactIntl.js';

initialize({
  onUnhandledRequest: 'bypass',
  serviceWorker: {
    url: './mockServiceWorker.js',
  },
});

fixLeafletIconUrls();

// Use our custom Form.io components
Formio.use(OpenFormsModule);
// use our own template library
Templates.current = OFLibrary;

export default {
  decorators: [
    mswDecorator,
    withClearSessionStorage,
    withClearSubmissionLocalStorage,
    utrechtDocumentDecorator,
  ],
  globals: {
    locale: reactIntl.defaultLocale,
    locales: {
      nl: 'Nederlands',
      en: 'English',
    },
  },
  parameters: {
    actions: {argTypesRegex: '^on[A-Z].*'},
    viewport: {
      // These are the viewports that are shown in Storybook
      viewports: {
        smallMobile: { name: "Small mobile", styles: { width: "320px", height: "568px" } },
        largeMobile: { name: "Large mobile", styles: { width: "414px", height: "896px" } },
        tablet: { name: "Tablet", styles: { width: "834px", height: "1112px" } },
        desktop: { name: "Desktop", styles: { width: "1024px", height: "1000px" } },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    reactIntl,
    themes: {
      default: 'Open Forms',
      target: 'root',
      list: [
        {name: 'Open Forms', class: 'openforms-theme', color: '#01689B'},
        {name: 'Gemeente Den Haag', class: 'denhaag-theme', color: '#238541'},
        {name: 'Gemeente Rotterdam', class: 'rotterdam-theme', color: '#00811F'},
        {name: 'Gemeente Utrecht', class: 'utrecht-theme', color: '#cc0000'},
      ],
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'Developers',
          'Pure React components',
          'Composites',
          'Form.io components',
          ['Docs', 'Vanilla', ['Docs'], 'Custom', ['Docs']],
          'Private API',
        ],
      },
    },
    chromatic: {
      // Here we specify the viewports of which we want snapshots in Chromatic
      modes: {
        mobile: {viewport: "smallMobile"},
        desktop: {viewport: "desktop"}
      }
    }
  },
  loaders: [mswLoader],
};
