import { PlayerBall } from "./core/objects/PlayerBall.ts";

export type KeyBindings =
  | "KeyW"
  | "KeyA"
  | "KeyS"
  | "KeyD"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight";

export type KeyState = Record<KeyBindings, boolean>;

export const setupKeyboardListener = (playerBall: PlayerBall): KeyState => {
  const keys: KeyState = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  window.addEventListener("keydown", (e) => {
    playerBall.body.linearDamping = 0.01;
    playerBall.body.angularDamping = 0.01;
    const keyCode = e.code as KeyBindings;
    keyCode in keys && ((keys[keyCode] = true), e.preventDefault());
  });

  window.addEventListener("keyup", (e) => {
    playerBall.body.linearDamping = 0.5;
    playerBall.body.angularDamping = 0.5;
    const keyCode = e.code as KeyBindings;
    keyCode in keys && ((keys[keyCode] = false), e.preventDefault());
  });

  document.addEventListener("pointerup", playerBall.handleTouchMove);

  return keys;
};
