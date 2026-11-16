import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// Loaded lazily: on web Skia needs CanvasKit (WASM) to be ready before any Skia import runs.
const start = () => registerRootComponent(require('./App').default);

if (Platform.OS === 'web') {
  // canvaskit.wasm is copied to /public by the postinstall script (setup-skia-web)
  require('@shopify/react-native-skia/lib/module/web').LoadSkiaWeb().then(start);
} else {
  start();
}
