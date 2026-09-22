import { assert, describe, it, vi } from "vite-plus/test";

import { makeMenuRevealHandler } from "./MenuReveal.ts";
import type { MenuRevealKeyInput } from "./MenuReveal.ts";

function makeInput(overrides: Partial<MenuRevealKeyInput>): MenuRevealKeyInput {
  return {
    type: "keyDown",
    key: "Alt",
    meta: false,
    control: false,
    shift: false,
    isAutoRepeat: false,
    ...overrides,
  };
}

function makeHarness() {
  const reveal = vi.fn();
  const handler = makeMenuRevealHandler({ reveal });
  return {
    reveal,
    send: (...inputs: readonly Partial<MenuRevealKeyInput>[]) => {
      for (const input of inputs) handler(makeInput(input));
    },
  };
}

const ALT_DOWN = { type: "keyDown", key: "Alt" } as const;
const ALT_UP = { type: "keyUp", key: "Alt" } as const;

describe("makeMenuRevealHandler", () => {
  it("opens the menu when Alt is tapped", () => {
    const { reveal, send } = makeHarness();
    send(ALT_DOWN, ALT_UP);
    assert.equal(reveal.mock.calls.length, 1);
  });

  it("opens the menu once after Alt is held without another key", () => {
    const { reveal, send } = makeHarness();
    send(
      ALT_DOWN,
      { ...ALT_DOWN, isAutoRepeat: true },
      { ...ALT_DOWN, isAutoRepeat: true },
      ALT_UP,
    );
    assert.equal(reveal.mock.calls.length, 1);
  });

  it("leaves Alt chords alone", () => {
    const { reveal, send } = makeHarness();
    // Alt+Tab, then the Alt release the app may still observe.
    send(ALT_DOWN, { type: "keyDown", key: "Tab" }, { type: "keyUp", key: "Tab" }, ALT_UP);
    // An in-app Alt chord.
    send(ALT_DOWN, { type: "keyDown", key: "w" }, ALT_UP);
    assert.equal(reveal.mock.calls.length, 0);
  });

  it("ignores Alt pressed as part of a larger modifier combination", () => {
    const { reveal, send } = makeHarness();
    send({ ...ALT_DOWN, control: true }, ALT_UP);
    send({ ...ALT_DOWN, shift: true }, ALT_UP);
    send({ ...ALT_DOWN, meta: true }, ALT_UP);
    assert.equal(reveal.mock.calls.length, 0);
  });

  it("ignores an Alt release that had no matching press", () => {
    const { reveal, send } = makeHarness();
    send(ALT_UP, ALT_UP);
    assert.equal(reveal.mock.calls.length, 0);
  });
});
