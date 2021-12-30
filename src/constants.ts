export enum ERRORS {
  SERVER_NOT_STARTED = 'SERVER_NOT_STARTED',
}

export enum LEGALITY {
  FORBIDDEN = 0,
  LIMITED = 1,
  SEMILIMITED = 2,
  UNLIMITED = 3,
}

// Maximum number of requests allowed for any external API calls like for the
// Google Sheets FL list or the YGOPRO API
export const MAX_REQUEST_ATTEMPTS = 3;
