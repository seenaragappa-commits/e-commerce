/** Turns an Axios error into a friendly message for the UI. */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the ShopSphere server. Please make sure the backend is running.';
  }
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  return fallback;
};

/** Field-level errors sent by the API, e.g. { email: 'Email is required' }. */
export const getFieldErrors = (error) => error?.response?.data?.errors ?? {};
