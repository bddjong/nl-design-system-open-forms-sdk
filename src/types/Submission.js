import PropTypes from 'prop-types';

const Submission = PropTypes.shape({
  id: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  form: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(PropTypes.object).isRequired, // TODO: define this as well
  nextStep: PropTypes.string,
  canSubmit: PropTypes.bool.isRequired,
  payment: PropTypes.shape({
    isRequired: PropTypes.bool.isRequired,
    amount: PropTypes.string.isRequired,
    hasPaid: PropTypes.bool.isRequired,
  }).isRequired,
});

export default Submission;
