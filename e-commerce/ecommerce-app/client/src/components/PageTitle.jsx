import { APP_NAME, TAGLINE } from '../utils/constants';

/** Sets the browser tab title (React 19 moves <title> into the document head automatically). */
export default function PageTitle({ title }) {
  return <title>{title ? `${title} | ${APP_NAME}` : `${APP_NAME} - ${TAGLINE}`}</title>;
}
