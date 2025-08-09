// Simple terminal helpers
const ESC = (s: string) => `\u001b[${s}`;
const clear = () => process.stdout.write(ESC('2J') + ESC('0;0H'));
const hideCursor = () => process.stdout.write(ESC('?25l'));
const showCursor = () => process.stdout.write(ESC('?25h'));

function cleanup() {
  showCursor();
  process.stdin.setRawMode?.(false);
  process.stdin.pause();
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

async function main() {
  clear();
  hideCursor();
  process.stdin.setRawMode?.(true);
  process.stdin.resume();

  // Print banner
  process.stdout.write('Tetris — Terminal TypeScript\n');
  process.stdout.write('Press q to quit. Arrow keys show their codes.\n\n');

  // Echo keypresses
  process.stdin.on('data', (buf: Buffer) => {
    const bytes = [...buf.values()];
    if (bytes.length === 1 && bytes[0] === 113 /* q */) {
      cleanup();
      process.exit(0);
    }
    process.stdout.write(`key bytes: [${bytes.join(', ')}]\n`);
  });
}

main().catch((e) => {
  showCursor();
  console.error(e);
  process.exit(1);
});
