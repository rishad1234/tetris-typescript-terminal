export type Key =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'z'
  | 'x'
  | 'c'
  | 'space'
  | 'p'
  | 'q'
  | 'ctrl-c';

export class Input {
  private onKeyHandlers: Array<(k: Key) => void> = [];
  private dataHandler?: (buf: Buffer) => void;

  constructor(private stream: NodeJS.ReadStream = process.stdin) {}

  start() {
    if (this.dataHandler) return;
    this.dataHandler = (buf: Buffer) => {
      const keys = this.decode(buf);
      for (const k of keys) this.emit(k);
    };
    this.stream.on('data', this.dataHandler);
  }

  stop() {
    if (!this.dataHandler) return;
    this.stream.off('data', this.dataHandler);
    this.dataHandler = undefined;
  }

  onKey(fn: (k: Key) => void) {
    this.onKeyHandlers.push(fn);
  }

  private emit(k: Key) {
    for (const fn of this.onKeyHandlers) fn(k);
  }

  private decode(buf: Buffer): Key[] {
    const out: Key[] = [];
    for (let i = 0; i < buf.length; i++) {
      const b = buf[i];
      if (b === 0x03) {
        out.push('ctrl-c');
        continue;
      }
      if (b === 0x1b) {
        // ESC sequences
        const b1 = buf[i + 1];
        const b2 = buf[i + 2];
        if (b1 === 0x5b /* [ */ && typeof b2 !== 'undefined') {
          // ESC [ A/B/C/D
          if (b2 === 0x41) out.push('up');
          else if (b2 === 0x42) out.push('down');
          else if (b2 === 0x43) out.push('right');
          else if (b2 === 0x44) out.push('left');
          i += 2;
          continue;
        }
        // Unknown ESC sequence: skip this byte
        continue;
      }

      // Space
      if (b === 0x20) {
        out.push('space');
        continue;
      }

      // Letters (lowercase)
      if (b >= 0x61 && b <= 0x7a) {
        const ch = String.fromCharCode(b);
        if (ch === 'z' || ch === 'x' || ch === 'c' || ch === 'p' || ch === 'q') out.push(ch as Key);
        continue;
      }
    }
    return out;
  }
}
