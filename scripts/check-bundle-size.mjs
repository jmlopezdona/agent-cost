// Presupuesto NFR: bundle (JS+CSS) < 250 kB gzip. Falla el build si se supera.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 250 * 1024
const assetsDir = 'dist/assets'

let total = 0
for (const file of readdirSync(assetsDir)) {
  if (!/\.(js|css)$/.test(file)) continue
  const gzipped = gzipSync(readFileSync(join(assetsDir, file))).length
  total += gzipped
  console.log(`${file}: ${(gzipped / 1024).toFixed(1)} kB gzip`)
}

console.log(`Total: ${(total / 1024).toFixed(1)} kB gzip (presupuesto ${BUDGET_BYTES / 1024} kB)`)
if (total > BUDGET_BYTES) {
  console.error('✗ Presupuesto de bundle superado — revisa dist/stats.html (visualizer)')
  process.exit(1)
}
console.log('✓ Dentro de presupuesto')
