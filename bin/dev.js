#!/usr/bin/env node_modules/.bin/ts-node
// eslint-disable-next-line node/shebang, unicorn/prefer-top-level-await
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

  ; (async () => {
    const oclif = await import('@oclif/core')
    await oclif.execute({ development: true, dir: __dirname })
  })()
