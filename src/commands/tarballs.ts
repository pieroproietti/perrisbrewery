import {
  Args, Command, Flags, Interfaces,
} from '@oclif/core'
import fs from 'fs'

import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

/**
 *
 */
export default class Tarballs extends Command {
  static args = {
    tarballs: Args.string({ description: 'pathTarballs', name: 'pathTarballs', required: false }),
  }
  static description = 'Tarballs'
  static flags = {
    help: Flags.help({ char: 'h' }),
    release: Flags.string({ char: 'r', description: 'release' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static summary = 'rename tarballs with release.'

  /**
   *
   */
  async run(): Promise<void> {
    const { args, flags } = await this.parse(Tarballs)

    let { release } = flags
    if (release === undefined) {
      release = '1'
    }

    const { verbose } = flags
    const echo = Utils.setEcho(verbose)

    // 
    const here = process.cwd() + '/'
    let pathSource = here

    const content = fs.readFileSync(pathSource + 'package.json', 'utf8')
    const packageJson = JSON.parse(content)
    let { mantainer } = packageJson
    if (mantainer === undefined) {
      mantainer = packageJson.author
    }

    if (mantainer === undefined) {
      mantainer = 'made on Perris\' Brewery'
    }

    const { description } = packageJson
    const tarballsVersion = packageJson.version
    const tarballsRelease = release
    const tarballsName = packageJson.name
    let tarballsNameVersioned = `${tarballsName}_${tarballsVersion}-${tarballsRelease}-linux-x64.tar.gz`
    await exec(`mv ${here}dist/eggs-v${tarballsVersion}-*-linux-x64.tar.gz ${here}dist/${tarballsNameVersioned}`)
    console.log(`created ${tarballsNameVersioned}`)
  }
}
