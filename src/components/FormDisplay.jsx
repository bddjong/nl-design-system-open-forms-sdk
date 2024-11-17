import PropTypes from 'prop-types';
import React, {useContext} from 'react';

import {ConfigContext} from 'Context';
import AppDebug from 'components/AppDebug';
import AppDisplay from 'components/AppDisplay';
import LanguageSwitcher from 'components/LanguageSwitcher';
import useFormContext from 'hooks/useFormContext';

/**
 * Layout component to render the form container.
 *
 * Takes in the main body and (optional) progress indicator and forwards them to the
 * AppDisplay component, while adding in any global/skeleton nodes.
 *
 * @return {JSX}
 */
const FormDisplay = ({children = null, progressIndicator = null, router = null}) => {
  const {translationEnabled} = useFormContext();
  const config = useContext(ConfigContext);

  const appDebug = config.debug ? <AppDebug /> : null;
  const languageSwitcher = translationEnabled ? <LanguageSwitcher /> : null;

  const AppDisplayComponent = config?.displayComponents?.app ?? AppDisplay;
  return (
    <AppDisplayComponent
      languageSwitcher={languageSwitcher}
      progressIndicator={progressIndicator}
      appDebug={appDebug}
    >
      {children || router}
    </AppDisplayComponent>
  );
};

FormDisplay.propTypes = {
  /**
   * Main content.
   */
  children: PropTypes.node,
  progressIndicator: PropTypes.node,
  /**
   * Main content.
   *
   * @deprecated Use children instead.
   *
   */
  router: PropTypes.node,
};

export default FormDisplay;
