/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppScreens } from './components/Screens';
import { WeatherBar } from './components/WeatherBar';
import { ProverbBar } from './components/ProverbBar';
import { PhotoBar } from './components/PhotoBar';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <WeatherBar />
      <ProverbBar />
      <PhotoBar />
      <AppScreens />
      <Toaster position="top-center" richColors />
    </>
  );
}
