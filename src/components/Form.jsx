import PropTypes from 'prop-types';
import React, {useContext, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import {useAsync, usePrevious} from 'react-use';
import {useImmerReducer} from 'use-immer';

import {AnalyticsToolsConfigContext, ConfigContext} from 'Context';
import {destroy, get} from 'api';
import ErrorBoundary from 'components/Errors/ErrorBoundary';
import FormStep from 'components/FormStep';
import Loader from 'components/Loader';
import {ConfirmationView, StartPaymentView} from 'components/PostCompletionViews';
import ProgressIndicator from 'components/ProgressIndicator';
import RequireSubmission from 'components/RequireSubmission';
import {SessionTrackerModal} from 'components/Sessions';
import {SubmissionSummary} from 'components/Summary';
import {
  PI_TITLE,
  START_FORM_QUERY_PARAM,
  STEP_LABELS,
  SUBMISSION_ALLOWED,
} from 'components/constants';
import {findNextApplicableStep} from 'components/utils';
import {flagActiveSubmission, flagNoActiveSubmission} from 'data/submissions';
import useAutomaticRedirect from 'hooks/useAutomaticRedirect';
import useFormContext from 'hooks/useFormContext';
import usePageViews from 'hooks/usePageViews';
import useQuery from 'hooks/useQuery';
import useRecycleSubmission from 'hooks/useRecycleSubmission';
import useSessionTimeout from 'hooks/useSessionTimeout';
import Types from 'types';

import FormDisplay from './FormDisplay';
import {addFixedSteps, getStepsInfo} from './ProgressIndicator/utils';

const initialState = {
  submission: null,
  submittedSubmission: null,
  processingStatusUrl: '',
  processingError: '',
  completed: false,
  startingError: '',
};

const reducer = (draft, action) => {
  switch (action.type) {
    case 'SUBMISSION_LOADED': {
      // keep the submission instance in the state and set the current step to the
      // first step of the form.
      draft.submission = action.payload;
      break;
    }
    case 'SUBMITTED': {
      return {
        ...initialState,
        submittedSubmission: action.payload.submission,
        processingStatusUrl: action.payload.processingStatusUrl,
      };
    }
    case 'PROCESSING_FAILED': {
      // set the error message in the state
      draft.processingError = action.payload;
      // put the submission back in the state as well, so we can re-submit
      draft.submission = draft.submittedSubmission;
      break;
    }
    case 'PROCESSING_SUCCEEDED': {
      draft.processingError = null;
      draft.completed = true;
      break;
    }
    case 'CLEAR_PROCESSING_ERROR': {
      draft.processingError = '';
      break;
    }
    case 'DESTROY_SUBMISSION': {
      return {
        ...initialState,
      };
    }
    case 'RESET': {
      const initialState = action.payload;
      return initialState;
    }
    case 'STARTING_ERROR': {
      draft.startingError = action.payload;
      break;
    }
    default: {
      throw new Error(`Unknown action ${action.type}`);
    }
  }
};

/**
 * An OpenForms form.
 *
 *
 * OpenForms forms consist of some metadata and individual steps.
 * @param  {Object} options.form The form definition from the Open Forms API
 * @return {JSX}
 */
const Form = () => {
  const form = useFormContext();
  const navigate = useNavigate();
  const shouldAutomaticallyRedirect = useAutomaticRedirect(form);
  const queryParams = useQuery();
  usePageViews();
  const intl = useIntl();
  const prevLocale = usePrevious(intl.locale);
  const {pathname: currentPathname} = useLocation();

  // TODO replace absolute path check with relative
  const introductionMatch = useMatch('/introductie');
  const stepMatch = useMatch('/stap/:step');
  const summaryMatch = useMatch('/overzicht');
  const paymentMatch = useMatch('/betalen');
  const confirmationMatch = useMatch('/bevestiging');

  // extract the declared properties and configuration
  const {steps} = form;
  const config = useContext(ConfigContext);

  // load the state management/reducer
  const initialStateFromProps = {...initialState, step: steps[0]};
  const [state, dispatch] = useImmerReducer(reducer, initialStateFromProps);

  const onSubmissionLoaded = (submission, next = '') => {
    dispatch({
      type: 'SUBMISSION_LOADED',
      payload: submission,
    });
    flagActiveSubmission();
    // navigate to the first step
    const firstStepRoute = `/stap/${form.steps[0].slug}`;
    navigate(next ? next : firstStepRoute);
  };

  // if there is an active submission still, re-load that (relevant for hard-refreshes)
  const [loading, setSubmissionId, removeSubmissionId] = useRecycleSubmission(
    form,
    state.submission,
    onSubmissionLoaded
  );

  const [, expiryDate] = useSessionTimeout();

  const {value: analyticsToolsConfigInfo, loading: loadingAnalyticsConfig} = useAsync(async () => {
    return await get(`${config.baseUrl}analytics/analytics-tools-config-info`);
  }, [intl.locale]);

  useEffect(
    () => {
      if (prevLocale === undefined) return;
      if (intl.locale !== prevLocale && state.submission) {
        removeSubmissionId();
        dispatch({type: 'DESTROY_SUBMISSION'});
        flagNoActiveSubmission();
        navigate(`/?${START_FORM_QUERY_PARAM}=1`);
      }
    },
    [intl.locale, prevLocale, removeSubmissionId, state.submission] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onSubmissionObtained = submission => {
    dispatch({
      type: 'SUBMISSION_LOADED',
      payload: submission,
    });
    flagActiveSubmission();
    setSubmissionId(submission.id);
  };

  const onStepSubmitted = async formStep => {
    const currentStepIndex = form.steps.indexOf(formStep);

    const nextStepIndex = findNextApplicableStep(currentStepIndex, state.submission);
    const nextStep = form.steps[nextStepIndex]; // will be undefined if it's the last step

    const nextUrl = nextStep ? `/stap/${nextStep.slug}` : '/overzicht';
    navigate(nextUrl);
  };

  const onSubmitForm = processingStatusUrl => {
    removeSubmissionId();
    dispatch({
      type: 'SUBMITTED',
      payload: {
        submission: state.submission,
        processingStatusUrl,
      },
    });

    if (submission?.payment.isRequired && !state.submission.payment.hasPaid) {
      navigate('/betalen');
    } else {
      navigate('/bevestiging');
    }
  };

  const onDestroySession = async () => {
    await destroy(`${config.baseUrl}authentication/${state.submission.id}/session`);

    removeSubmissionId();
    dispatch({
      type: 'RESET',
      payload: initialStateFromProps,
    });
    navigate('/');
  };

  const onProcessingFailure = errorMessage => {
    // TODO: provide generic fallback message in case no explicit
    // message is shown
    dispatch({type: 'PROCESSING_FAILED', payload: errorMessage});
    navigate('/overzicht');
  };

  // handle redirect from payment provider to render appropriate page and include the
  // params as state for the next component.
  if (queryParams.get('of_payment_status')) {
    return (
      <Navigate
        replace
        to="/bevestiging"
        state={{
          status: queryParams.get('of_payment_status'),
          userAction: queryParams.get('of_payment_action'),
          statusUrl: queryParams.get('of_submission_status'),
        }}
      />
    );
  }

  if (loading || loadingAnalyticsConfig || shouldAutomaticallyRedirect) {
    return <Loader modifiers={['centered']} />;
  }

  // Progress Indicator

  const isIntroductionPage = !!introductionMatch;
  const isStartPage = !isIntroductionPage && !summaryMatch && stepMatch == null && !paymentMatch;
  const submissionAllowedSpec = state.submission?.submissionAllowed ?? form.submissionAllowed;
  const showOverview = submissionAllowedSpec !== SUBMISSION_ALLOWED.noWithoutOverview;
  const submission = state.submission || state.submittedSubmission;
  const isCompleted = state.completed;
  const formName = form.name;
  const needsPayment = submission ? submission.payment.isRequired : form.paymentRequired;

  // Figure out the slug from the currently active step IF we're looking at a step
  const stepSlug = stepMatch ? stepMatch.params.step : '';

  // figure out the title for the mobile menu based on the state
  let activeStepTitle;
  if (isIntroductionPage) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.introduction);
  } else if (isStartPage) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.login);
  } else if (summaryMatch) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.overview);
  } else if (paymentMatch) {
    activeStepTitle = intl.formatMessage(STEP_LABELS.payment);
  } else {
    const step = steps.find(step => step.slug === stepSlug);
    activeStepTitle = step.formDefinition;
  }

  const ariaMobileIconLabel = intl.formatMessage({
    description: 'Progress step indicator toggle icon (mobile)',
    defaultMessage: 'Toggle the progress status display',
  });

  const accessibleToggleStepsLabel = intl.formatMessage(
    {
      description: 'Active step accessible label in mobile progress indicator',
      defaultMessage: 'Current step in form {formName}: {activeStepTitle}',
    },
    {formName, activeStepTitle}
  );

  // process the form/submission steps information into step data that can be passed
  // to the progress indicator.
  // If the form is marked to not display non-applicable steps at all, filter them out.
  const showNonApplicableSteps = !form.hideNonApplicableSteps;
  const updatedSteps =
    // first, process all the form steps in a format suitable for the PI
    getStepsInfo(steps, submission, currentPathname)
      // then, filter out the non-applicable steps if they should not be displayed
      .filter(step => showNonApplicableSteps || step.isApplicable);

  const stepsToRender = addFixedSteps(
    intl,
    updatedSteps,
    submission,
    currentPathname,
    showOverview,
    needsPayment,
    isCompleted,
    !!form.introductionPageContent
  );

  // Show the progress indicator if enabled on the form AND we're not in the payment
  // confirmation screen.
  const progressIndicator =
    form.showProgressIndicator && !confirmationMatch ? (
      <ProgressIndicator
        title={PI_TITLE}
        formTitle={formName}
        steps={stepsToRender}
        ariaMobileIconLabel={ariaMobileIconLabel}
        accessibleToggleStepsLabel={accessibleToggleStepsLabel}
      />
    ) : null;

  if (state.startingError) throw state.startingError;

  // Route the correct page based on URL
  const router = (
    <Routes>
      <Route
        path="overzicht"
        element={
          <ErrorBoundary useCard>
            <SessionTrackerModal expiryDate={expiryDate}>
              <RequireSubmission
                submission={state.submission}
                form={form}
                processingError={state.processingError}
                onConfirm={onSubmitForm}
                component={SubmissionSummary}
                onClearProcessingErrors={() => dispatch({type: 'CLEAR_PROCESSING_ERROR'})}
                onDestroySession={onDestroySession}
              />
            </SessionTrackerModal>
          </ErrorBoundary>
        }
      />

      <Route
        path="betalen"
        element={
          <ErrorBoundary useCard>
            <RequireSubmission
              submission={state.submittedSubmission}
              statusUrl={state.processingStatusUrl}
              onFailure={onProcessingFailure}
              onConfirmed={() => dispatch({type: 'PROCESSING_SUCCEEDED'})}
              component={StartPaymentView}
              donwloadPDFText={form.submissionReportDownloadLinkTitle}
            />
          </ErrorBoundary>
        }
      />

      <Route
        path="bevestiging"
        element={
          <ErrorBoundary useCard>
            <ConfirmationView
              statusUrl={state.processingStatusUrl}
              onFailure={onProcessingFailure}
              onConfirmed={() => dispatch({type: 'PROCESSING_SUCCEEDED'})}
              downloadPDFText={form.submissionReportDownloadLinkTitle}
            />
          </ErrorBoundary>
        }
      />

      <Route
        path="stap/:step"
        element={
          <ErrorBoundary useCard>
            <SessionTrackerModal expiryDate={expiryDate}>
              <RequireSubmission
                form={form}
                submission={state.submission}
                onLogicChecked={submission =>
                  dispatch({type: 'SUBMISSION_LOADED', payload: submission})
                }
                onStepSubmitted={onStepSubmitted}
                component={FormStep}
                onDestroySession={onDestroySession}
              />
            </SessionTrackerModal>
          </ErrorBoundary>
        }
      />
    </Routes>
  );

  // render the form step if there's an active submission (and no summary)
  return (
    <FormDisplay progressIndicator={progressIndicator}>
      <AnalyticsToolsConfigContext.Provider value={analyticsToolsConfigInfo}>
        <SubmissionProvider
          submission={state.submission}
          onSubmissionObtained={onSubmissionObtained}
          onDestroySession={onDestroySession}
        >
          <Outlet />
          {router}
        </SubmissionProvider>
      </AnalyticsToolsConfigContext.Provider>
    </FormDisplay>
  );
};

Form.propTypes = {};

const SubmissionContext = React.createContext({
  submission: null,
  onSubmissionObtained: () => {},
  onDestroySession: () => {},
});

const SubmissionProvider = ({
  submission = null,
  onSubmissionObtained,
  onDestroySession,
  children,
}) => (
  <SubmissionContext.Provider value={{submission, onSubmissionObtained, onDestroySession}}>
    {children}
  </SubmissionContext.Provider>
);

SubmissionProvider.propTypes = {
  submission: Types.Submission,
  onSubmissionObtained: PropTypes.func.isRequired,
  onDestroySession: PropTypes.func.isRequired,
};

const useSubmissionContext = () => useContext(SubmissionContext);

export default Form;
export {useSubmissionContext, SubmissionProvider};
