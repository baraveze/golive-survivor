export function stickDirection(dx: number, dy: number, radius: number) {
  const distance = Math.hypot(dx, dy);
  if (radius <= 0 || distance < radius * 0.15) return { x: 0, y: 0 };
  const scale = Math.max(radius, distance);
  return { x: dx / scale, y: dy / scale };
}

/** Owns only the joystick pointer, leaving a second finger free for actions. */
export class TouchControls {
  private pointer: number | null = null;
  private enabled = false;
  constructor(
    private pad: HTMLElement,
    private thumb: HTMLElement,
    private move: (x: number, y: number) => void,
  ) {
    pad.addEventListener('pointerdown', (event) => {
      if (!this.enabled || this.pointer !== null || event.button !== 0) return;
      event.preventDefault();
      this.pointer = event.pointerId;
      pad.setPointerCapture(event.pointerId);
      this.update(event);
    });
    pad.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.pointer) {
        event.preventDefault();
        this.update(event);
      }
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      pad.addEventListener(type, (event) => {
        if ((event as PointerEvent).pointerId === this.pointer) this.reset();
      });
    }
    window.addEventListener('blur', () => this.reset());
    window.addEventListener('resize', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.reset();
    });
    pad.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (!enabled) this.reset();
  }

  reset(): void {
    const pointer = this.pointer;
    this.pointer = null;
    if (pointer !== null && this.pad.hasPointerCapture(pointer))
      this.pad.releasePointerCapture(pointer);
    this.thumb.style.transform = 'translate(0px, 0px)';
    this.move(0, 0);
  }

  private update(event: PointerEvent): void {
    const bounds = this.pad.getBoundingClientRect();
    const radius = bounds.width * 0.32;
    const { x, y } = stickDirection(
      event.clientX - bounds.left - bounds.width / 2,
      event.clientY - bounds.top - bounds.height / 2,
      radius,
    );
    this.thumb.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
    this.move(x, y);
  }
}
