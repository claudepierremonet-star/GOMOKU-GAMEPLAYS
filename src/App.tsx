/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppScreens } from './components/Screens';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <AppScreens />
      <Toaster position="top-center" richColors />
    </>
  );
}
