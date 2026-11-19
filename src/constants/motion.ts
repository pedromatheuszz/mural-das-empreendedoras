import {
  type CSSTransitionProperties,
  cubicBezier,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  Keyframe,
  ReduceMotion,
} from 'react-native-reanimated';

/**
 * Movimento do app: curvas, durações e animações de entrada/saída prontas.
 * Regras (guia de animação Expo/Reanimated):
 * - só `transform` e `opacity` (rodam na thread de UI, sem refazer layout);
 * - nunca ease-in em UI; entradas e saídas usam ease-out forte;
 * - toque: 120 ms; estados pequenos: 150–200 ms; nada passa de 300 ms;
 * - "reduzir movimento" do sistema é respeitado (ReduceMotion.System).
 */

/** Curvas para estilos CSS do Reanimated (transitionTimingFunction). */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/** Curvas para withTiming / layout animations. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export const DURATION = {
  press: 120,
  state: 180,
  enter: 260,
  exit: 200,
} as const;

/** Quanto um item "afunda" ao ser tocado. */
export const PRESS_SCALE = {
  button: 0.97,
  card: 0.98,
  icon: 0.92,
} as const;

/** Transição de toque/estado pronta para usar em estilos (Animated.*). */
export const pressTransition: CSSTransitionProperties = {
  transitionProperty: ['transform', 'backgroundColor', 'borderColor', 'opacity'],
  transitionDuration: DURATION.press,
  transitionTimingFunction: CSS_EASE_OUT,
};

export const colorTransition: CSSTransitionProperties = {
  transitionProperty: ['backgroundColor', 'borderColor'],
  transitionDuration: DURATION.state,
  transitionTimingFunction: CSS_EASE_OUT,
};

// Construtores de layout animation ficam fora dos componentes (recomendação do Reanimated).

/** Conteúdo que a pessoa pediu e está esperando (estados vazios, erro, resultados). */
export const FADE_IN = FadeIn.duration(DURATION.enter).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
export const FADE_OUT = FadeOut.duration(DURATION.exit).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

/** Avisos (toasts) que descem do topo e voltam por onde vieram, saindo ~20% mais rápido. */
export const TOAST_ENTER = FadeInUp.duration(280).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
export const TOAST_EXIT = FadeOutUp.duration(220).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

/** Diálogo: surge de 96% com opacidade (nunca de escala zero). */
export const DIALOG_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.96 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
})
  .duration(220)
  .reduceMotion(ReduceMotion.System);

/** Entrada escalonada dos primeiros itens de uma lista (só no carregamento inicial). */
export function listEnter(index: number) {
  return FadeInDown.duration(DURATION.enter)
    .delay(Math.min(index, 5) * 45)
    .easing(EASE_OUT)
    .reduceMotion(ReduceMotion.System);
}

/** Itens a partir deste índice aparecem sem animação (a lista que se rola o dia todo já "está lá"). */
export const LIST_ENTER_LIMIT = 6;
