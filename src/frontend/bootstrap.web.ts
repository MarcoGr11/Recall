import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { registerRootComponent } from 'expo';

// Skia needs CanvasKit ready before any Skia import runs, so the app is required lazily.
// canvaskit.wasm is copied to /public by the postinstall script (setup-skia-web).
LoadSkiaWeb().then(() => registerRootComponent(require('./App').default));
