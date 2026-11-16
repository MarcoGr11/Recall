import { Canvas, Group, Picture, Skia, type SkPicture } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import { type FrameInfo, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { useTheme } from '../theme';
import { recycle, useReduceMotion } from '../tree/KnowledgeTree';
import { SCENE_H, SCENE_LABEL, SCENE_W, STILL, createSceneKit, drawScene, type SceneKind } from './draw';

export { KINDS, SCENE_LABEL, type SceneKind } from './draw';

interface Props {
  kind: SceneKind;
  /** Rendered width; the height keeps the 280×200 ratio. */
  width?: number;
  /** Overrides the built-in description of the scene. */
  label?: string;
}

/**
 * Small animated illustration for empty / error / loading states, drawn with the same Skia approach as the tree:
 * one picture re-recorded per frame on the UI thread. Colours come from the theme (light = day, dark = night).
 * With reduce-motion on it shows a single still frame.
 */
export function StateScene({ kind, width = SCENE_W, label }: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const kit = useMemo(() => createSceneKit(theme), [theme]);

  const clock = useSharedValue(STILL);
  const onFrame = useCallback((info: FrameInfo) => {
    'worklet';
    clock.value = STILL + info.timeSinceFirstFrame / 1000;
  }, [clock]);
  const frame = useFrameCallback(onFrame);
  useEffect(() => {
    frame.setActive(!reduceMotion);
    if (reduceMotion) clock.value = STILL;
  }, [frame, reduceMotion, clock]);

  const bin = useRef<SkPicture[]>([]).current;
  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    drawScene(recorder.beginRecording(), kind, kit, clock.value);
    const pic = recorder.finishRecordingAsPicture();
    if (Platform.OS === 'web') recycle(bin, pic);
    return pic;
  }, [kind, kit]);

  const scale = width / SCENE_W;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label ?? SCENE_LABEL[kind]} style={{ width, height: SCENE_H * scale }}>
      <Canvas style={{ flex: 1 }}>
        <Group transform={[{ scale }]}>
          <Picture picture={picture} />
        </Group>
      </Canvas>
    </View>
  );
}
