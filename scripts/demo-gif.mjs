// Converts the recorded demo video (test-results/demo.webm) into docs/demo.gif.
// Requires ffmpeg on the PATH. Two passes: build a palette, then encode with it.
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

const input = 'test-results/demo.webm';
const palette = 'test-results/palette.png';
const output = 'docs/demo.gif';
// Skip the first moments (page load) so the GIF opens on the chooser.
const skipStart = ['-ss', '1.2'];
const filters = 'fps=12,scale=900:-1:flags=lanczos';

if (!existsSync(input)) {
  console.error(`${input} not found: run the @media tests first.`);
  process.exit(1);
}

const ffmpeg = (...args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

ffmpeg(...skipStart, '-i', input, '-vf', `${filters},palettegen=stats_mode=diff`, palette);
ffmpeg(
  ...skipStart,
  '-i',
  input,
  '-i',
  palette,
  '-lavfi',
  `${filters} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
  output,
);
console.log(`${output} written (${(statSync(output).size / 1024 / 1024).toFixed(1)} MB)`);
