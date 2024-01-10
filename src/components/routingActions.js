/**
 * Get the correct redirect path for an action.
 * @param {string} action The action to be performed.
 * @param {Record<string, string>} actionParams The params linked to the action.
 * @returns {{path: string, query?: URLSearchParams}} An object containing the pathname to be used,
 * alongside with optional query parameters.
 */
export const getRedirectParams = (action, actionParams) => {
  switch (action) {
    case 'cosign':
      return {
        path: 'cosign/check',
        query: new URLSearchParams(actionParams),
      };
    case 'afspraak-annuleren':
      return {
        path: 'afspraak-annuleren',
        query: new URLSearchParams(actionParams),
      };
    case 'afspraak-maken':
      return {path: 'afspraak-maken'};
    case 'resume':
      return {
        path: `stap/${actionParams.step_slug}`,
        query: new URLSearchParams({submission_uuid: actionParams.submission_uuid}),
      };
    case 'payment':
      return {
        path: 'betalen',
        query: new URLSearchParams(actionParams),
      };
    default:
      return {};
  }
};
