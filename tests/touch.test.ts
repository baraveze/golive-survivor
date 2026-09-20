import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stickDirection, TouchControls } from '../src/ui/TouchControls';
class Pad extends EventTarget {
  captured: number | null = null;
  setPointerCapture(id: number) {
    this.captured = id;
  }
  hasPointerCapture(id: number) {
    return this.captured === id;
  }
  releasePointerCapture() {
    this.captured = null;
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 100, height: 100 };
  }
  pointer(type: string, id = 1, x = 82, y = 50) {
    this.dispatchEvent(
      Object.assign(new Event(type, { cancelable: true }), {
        pointerId: id,
        clientX: x,
        clientY: y,
        button: 0,
      }),
    );
  }
}
beforeEach(() => {
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('document', new EventTarget());
});
afterEach(() => vi.unstubAllGlobals());
describe('touch movement', () => {
  it('has a dead zone and clamps diagonal movement', () => {
    expect(stickDirection(2, 2, 40)).toEqual({ x: 0, y: 0 });
    expect(stickDirection(-40, 0, 40)).toEqual({ x: -1, y: 0 });
    const diagonal = stickDirection(100, 100, 40);
    expect(diagonal.x).toBeGreaterThan(0);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(1);
  });
  it('keeps the first finger in control while another finger presses an action', () => {
    const pad = new Pad();
    const move = vi.fn();
    const control = new TouchControls(
      pad as unknown as HTMLElement,
      { style: {} } as HTMLElement,
      move,
    );
    control.setEnabled(true);
    pad.pointer('pointerdown');
    expect(move).toHaveBeenLastCalledWith(1, 0);
    pad.pointer('pointerdown', 2, 0, 0);
    pad.pointer('pointerup', 2);
    expect(move).toHaveBeenCalledTimes(1);
    pad.pointer('pointerup');
    expect(move).toHaveBeenLastCalledWith(0, 0);
    expect(pad.captured).toBeNull();
  });
  it.each(['pointercancel', 'lostpointercapture'])('stops on %s', (type) => {
    const pad = new Pad();
    const move = vi.fn();
    const control = new TouchControls(
      pad as unknown as HTMLElement,
      { style: {} } as HTMLElement,
      move,
    );
    control.setEnabled(true);
    pad.pointer('pointerdown');
    pad.pointer(type);
    expect(move).toHaveBeenLastCalledWith(0, 0);
  });
  it('requires a fresh touch after pausing or rotating', () => {
    const pad = new Pad();
    const move = vi.fn();
    const control = new TouchControls(
      pad as unknown as HTMLElement,
      { style: {} } as HTMLElement,
      move,
    );
    control.setEnabled(true);
    pad.pointer('pointerdown');
    control.setEnabled(false);
    pad.pointer('pointermove');
    expect(move).toHaveBeenLastCalledWith(0, 0);
    control.setEnabled(true);
    pad.pointer('pointerdown');
    window.dispatchEvent(new Event('resize'));
    expect(move).toHaveBeenLastCalledWith(0, 0);
    pad.pointer('pointermove');
    expect(move).toHaveBeenLastCalledWith(0, 0);
  });
});
