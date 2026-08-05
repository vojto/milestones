import { mkdir, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)))
const outputDirectory = join(projectDirectory, 'dist')
const clientDirectory = join(outputDirectory, 'client')
const serverDirectory = join(outputDirectory, 'server')

await mkdir(clientDirectory, { recursive: true })

for (const entry of await readdir(outputDirectory)) {
  if (entry !== 'client' && entry !== 'server') {
    await rename(join(outputDirectory, entry), join(clientDirectory, entry))
  }
}

await mkdir(serverDirectory, { recursive: true })
await writeFile(
  join(serverDirectory, 'index.js'),
  `export default {
  fetch(request, environment) {
    return environment.ASSETS.fetch(request)
  },
}\n`,
)
