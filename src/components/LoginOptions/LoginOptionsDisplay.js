import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import LoginButton from 'components/LoginButton';
import FormattedLoginOption from 'types/FormattedLoginOption';
import {getBEMClassName} from 'utils';

const LoginOptionsDisplay = ({
  loginAsYourselfOptions,
  loginAsGemachtigdeOptions,
  cosignLoginOptions,
}) => {
  return (
    <div className={getBEMClassName('login-options')}>
      <div className={getBEMClassName('login-options__list')}>
        {loginAsYourselfOptions.map(option => (
          <LoginButton key={option.identifier} option={option} />
        ))}
      </div>

      {loginAsGemachtigdeOptions.length > 0 && (
        <>
          <h2 className={getBEMClassName('login-options__caption')}>
            <FormattedMessage
              description="Log in on behalf of someone else title"
              defaultMessage="Log in on behalf of someone else"
            />
          </h2>

          <div className={getBEMClassName('login-options__list')}>
            {loginAsGemachtigdeOptions.map(option => (
              <LoginButton key={option.identifier} option={option} />
            ))}
          </div>
        </>
      )}

      {cosignLoginOptions && cosignLoginOptions.length > 0 && (
        <div className={getBEMClassName('login-options__cosign')}>
          <h2 className={getBEMClassName('login-options__caption')}>
            <FormattedMessage
              description="Log in to co-sign the form title"
              defaultMessage="Log in to co-sign the form"
            />
          </h2>

          <div className={getBEMClassName('login-options__list')}>
            {cosignLoginOptions.map(option => (
              <LoginButton key={option.identifier} option={option} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

LoginOptionsDisplay.propTypes = {
  loginAsYourselfOptions: PropTypes.arrayOf(FormattedLoginOption).isRequired,
  loginAsGemachtigdeOptions: PropTypes.arrayOf(FormattedLoginOption).isRequired,
  cosignLoginOptions: PropTypes.arrayOf(FormattedLoginOption),
};

export default LoginOptionsDisplay;
