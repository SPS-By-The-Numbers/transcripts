import { TailSpin } from 'react-loader-spinner';
import resolveConfig from 'tailwindcss/resolveConfig';
import { content, theme } from '../tailwind.config.cjs';

export default function LoadingSpinner() {
  // Get access to the tailwind theme colors to pass to the loading spinner
  // Specifying only content and theme keys is a workaround for a type error pertaining
  // to the "future" key
  const fullConfig = resolveConfig({ content, theme });

  return <TailSpin wrapperClass="justify-center" color={fullConfig.theme.colors.blue['500']} />
  ;
}