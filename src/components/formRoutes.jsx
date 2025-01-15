import ErrorBoundary from 'components/Errors/ErrorBoundary';
import FormLandingPage from 'components/FormLandingPage';
import FormStart from 'components/FormStart';
import FormStep from 'components/FormStep';
import IntroductionPage from 'components/IntroductionPage';
import RequireSubmission from 'components/RequireSubmission';
import {SessionTrackerModal} from 'components/Sessions';

const formRoutes = [
  {
    path: '',
    element: <FormLandingPage />,
  },
  {
    path: 'introductie',
    element: <IntroductionPage />,
  },
  {
    path: 'startpagina',
    element: (
      <ErrorBoundary useCard>
        <FormStart />
      </ErrorBoundary>
    ),
  },
  {
    path: 'stap/:step',
    element: (
      <ErrorBoundary useCard>
        <SessionTrackerModal>
          <RequireSubmission retrieveSubmissionFromContext>
            <FormStep />
          </RequireSubmission>
        </SessionTrackerModal>
      </ErrorBoundary>
    ),
  },
];

export default formRoutes;
