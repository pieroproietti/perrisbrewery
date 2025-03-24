import {
  Args, Command, Flags, Interfaces,
} from '@oclif/core'
import fs, {utimes} from 'fs'
import yaml from 'js-yaml'
import mustache from 'mustache'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'

import Converter from '../classes/converter'
import Utils from '../classes/utils'
import {IDependency} from '../interfaces/i-dependency'
import {exec} from '../lib/utils'

/**
 *
 */
export default class Tarballs extends Command {
  static args = {
    tarballs: Args.string({description: 'pathTarballs', name: 'pathTarballs', required: false}),
  }
  static description = 'Tarballs'
  static flags = {
    help: Flags.help({char: 'h'}),
    release: Flags.string({char: 'r', description: 'release'}),
    verbose: Flags.boolean({char: 'v', description: 'verbose'}),
  }

 static summary = 'rename tarballs with release.'

  /**
   *
   */
  async run(): Promise<void> {
    const {args, flags} = await this.parse(Tarballs)

    let {release} = flags
    if (release === undefined) {
      release = '1'
    }

    const {verbose} = flags
    const echo = Utils.setEcho(verbose)

  }
}
