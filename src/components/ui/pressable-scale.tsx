import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { PRESS_SCALE, pressTransition } from '@/constants/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Estilo extra enquanto o dedo está no item (ex.: fundo mais escuro). */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Quanto o item encolhe no toque. Padrão: 0.97 (botões). Cards: 0.98. */
  scaleTo?: number;
};

/**
 * Item tocável com resposta imediata: encolhe levemente no toque (120 ms, ease-out),
 * na thread de UI. Usar em botões, cards, chips e ícones — não em linhas de lista
 * de largura total (essas só mudam o fundo).
 */
export function PressableScale({
  children,
  style,
  pressedStyle,
  scaleTo = PRESS_SCALE.button,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const active = pressed && !disabled;

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      pressRetentionOffset={rest.pressRetentionOffset ?? 16}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        pressTransition,
        { transform: [{ scale: active && !reduceMotion ? scaleTo : 1 }] },
        style,
        active ? pressedStyle : null,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
