import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage, useIntl} from 'react-intl';
import useAsync from 'react-use/esm/useAsync';

import { post } from 'api';
import Body from 'components/Body';
import Card from 'components/Card';
import ErrorBoundary from 'components/ErrorBoundary';
import FAIcon from 'components/FAIcon';
import Anchor from 'components/Anchor';
import Loader from 'components/Loader';
import PaymentForm from 'components/PaymentForm';
import usePoll from 'hooks/usePoll';

const RESULT_FAILED = 'failed';

const getStartPaymentUrl = (apiUrl) => {
  const nextUrl = new URL(window.location.href);
  const startPaymentUrl = new URL(apiUrl);
  startPaymentUrl.searchParams.set("next", nextUrl.toString());
  return startPaymentUrl.toString();
};

/**
 * Given a start URL, fetches the payment start information and renders the UI controls
 * to enter the payment flow.
 * @param  {String} startUrl The payment start URL received from the backend.
 * @return {JSX}
 */
const StartPayment = ({startUrl}) => {
  const fullUrl = getStartPaymentUrl(startUrl);
  const {loading, value} = useAsync(
    async () => {
      const resp = await post(fullUrl);
      if (!resp.ok) throw new Error('Could not start payment');
      return resp.data;
    },
    [fullUrl]
  );

  return (
    <Card>
      <Body modifiers={['big']}>
        <FormattedMessage description="Payment required info text" defaultMessage="Payment is required for this product" />
      </Body>
      { loading
        ? (<Loader modifiers={['centered']} />)
        : (value ? <PaymentForm method={value.type} url={value.url} data={value.data} autoSubmit={false} /> : null)
      }
    </Card>
  );
};

StartPayment.propTypes = {
  startUrl: PropTypes.string.isRequired,
};


/**
 * Renders the confirmation page displayed after submitting a form.
 * @param {String} statusUrl The URL where to check if the processing of the submission is complete
 * @param {Function} onFailure Callback to invoke if the background processing result is failure.
 */
const SubmissionConfirmation = ({statusUrl, onFailure}) => {
  const [statusResponse, setStatusResponse] = useState(null);
  const intl = useIntl();
  const genericErrorMessage = intl.formatMessage({
      description: 'Generic submission error',
      defaultMessage: 'Something went wrong while submitting the form.'
  });

  const {loading, error} = usePoll(
    statusUrl,
    1000,
    (response) => {
      setStatusResponse(response);
      switch (response.status) {
        case 'done': {
          if (response.result === RESULT_FAILED) {
            const errorMessage = response.errorMessage || genericErrorMessage;
            onFailure && onFailure(errorMessage);
          }
          return true;
        }
        default: {
          // nothing, it's pending/started or retrying
        }
      }
    }
  );

  if (error) {
    console.error(error);
  }

  if (loading) {
    return (
      <Card title={<FormattedMessage
                    description="Checking background processing status title"
                    defaultMessage="Processing..." />}>

        <Loader modifiers={['centered']} />
        <Body>
          <FormattedMessage
            description="Checking background processing status body"
            defaultMessage="Please hold on while we're processing your submission."
          />
        </Body>

      </Card>
    );
  }

  // process API output now that processing is done
  const {
    result,
    paymentUrl,
    publicReference,
    reportDownloadUrl,
    confirmationPageContent,
  } = statusResponse;

  if (result === RESULT_FAILED) {
    throw new Error('Failure should have been handled in the onFailure prop.');
  }

  return (
    <>
      <Card title={<FormattedMessage
                     description="On succesful completion title"
                     defaultMessage="Confirmation: {reference}"
                     values={{reference: publicReference}}
                   />}>

        <Body
          component="div"
          modifiers={['wysiwyg']}
          dangerouslySetInnerHTML={{__html: confirmationPageContent}}
        />

        <>
          <FAIcon icon="download" aria-hidden="true" modifiers={['inline']} />
          <Anchor href={reportDownloadUrl} target="_blank" rel="noopener noreferrer">
            <FormattedMessage
              description="Download report PDF link title"
              defaultMessage="Download PDF"
            />
          </Anchor>
        </>

      </Card>

      <ErrorBoundary>
        { paymentUrl ? <StartPayment startUrl={paymentUrl} /> : null }
      </ErrorBoundary>
    </>
  );
}

SubmissionConfirmation.propTypes = {
  statusUrl: PropTypes.string.isRequired,
  onFailure: PropTypes.func,
}

export default SubmissionConfirmation;
