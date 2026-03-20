/**
 * Block Character Text Renderer - Demo
 * Demonstrates all available rendering styles
 */

import { renderText, STYLES } from './block-renderer';

console.log('='.repeat(60));
console.log('BLOCK CHARACTER TEXT RENDERER DEMONSTRATION');
console.log('='.repeat(60));
console.log('\n');

// Demo with "BOOTSTRAP"
const demoText = 'BOOTSTRAP-v15';

console.log('Text: "' + demoText + '"\n');
console.log('-'.repeat(60));

for (const [styleName, styleConfig] of Object.entries(STYLES)) {
  console.log(`\n>>> STYLE: ${styleName.toUpperCase()}`);
  console.log(`    Fill: "${styleConfig.fillChar}" | Empty: "${styleConfig.emptyChar}"\n`);
  
  const output = renderText(demoText, styleConfig);
  console.log(output);
}

console.log('\n');
console.log('-'.repeat(60));
console.log('CUSTOM EXAMPLES:\n');

// Custom styles
console.log('>> "HELLO" with hash style:\n');
console.log(renderText('HELLO', STYLES.hashes));

console.log('\n\n>> "WORLD" with stars:\n');
console.log(renderText('WORLD', STYLES.stars));

console.log('\n\n>> Numbers: "2026"\n');
console.log(renderText('2026', STYLES.solid));

console.log('\n\n>> Symbols: "HI!"\n');
console.log(renderText('HI!', STYLES.blocks));

console.log('\n');
console.log('='.repeat(60));
console.log('END OF DEMO');
console.log('='.repeat(60));
