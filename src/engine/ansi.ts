// Minimal ANSI helpers for terminal rendering

export const ESC = (s: string) => `\u001b[${s}`;
export const CSI = ESC('');

export const cursor = {
  hide: () => ESC('?25l'),
  show: () => ESC('?25h'),
  moveTo: (row: number, col: number) => ESC(`${row};${col}H`), // 1-based
};

export const screen = {
  clear: () => ESC('2J'),
  clearToEnd: () => ESC('0J'),
};

export const color = {
  bg: (n: number | null) => (n == null ? ESC('49m') : ESC(`${40 + n}m`)), // 49 reset bg
  fg: (n: number | null) => (n == null ? ESC('39m') : ESC(`${30 + n}m`)), // 39 reset fg
  reset: () => ESC('0m'),
};

export const mode = {
  altScreen: {
    enter: () => ESC('?1049h'),
    exit: () => ESC('?1049l'),
  },
  wrap: {
    enable: () => ESC('?7h'),
    disable: () => ESC('?7l'),
  },
};
