/* eslint-disable no-negated-condition */
/* eslint-disable no-process-exit */
/* eslint-disable no-console */
import {Command, flags} from '@oclif/command'
import fs = require('fs')
import path = require('path')
import yaml = require('js-yaml')
import shx = require('shelljs')

import Utils from './classes/utils'
import Dir from './classes/dir'
import Dpkg from './classes/dpkg'
import Man from './classes/man'

import {IPackage} from './interfaces'
import convertHtml from './classes/convert-html'

class Perrisbrewery extends Command {
  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'pathSource'}]

  async run() {
    const {args} = this.parse(Perrisbrewery)

    const u = new Utils()
    u.titles(this.id + ' ' + this.argv)

    let pbPackage = {} as IPackage

    this.log()

    let pathSource = './here'
    if (args.pathSource !== undefined) {
      pathSource = args.pathSource
    }

    if (fs.existsSync('perrisbrewery')) {
      fs.mkdirSync('perrisbrewery')
      shx.cp('-r', path.resolve(__dirname, '../perrisbrewery/template'), 'perrisbrewery')
      shx.cp('-r', path.resolve(__dirname, '../perrisbrewery/scripts'), 'perrisbrewery')
    }

    this.log('-pathSource: ' + pathSource)

    const dpkg = new Dpkg()
    const dir = new Dir()
    const filenames = dir.analyze(pathSource)

    const man = new Man(pathSource + '/README.md')
    filenames.forEach((file: string) => {
      this.log('-file: ' + file)
      pbPackage = dpkg.analyze(pathSource + 'dist/deb/' + file)
      fs.writeFileSync('pb.yaml', yaml.dump(pbPackage), 'utf-8')
      dpkg.disclose()
      dpkg.makeScripts()
      dpkg.makeControl()
      man.createMd()
      man.convertToMan()
      convertHtml()
      dpkg.close(pbPackage)
      
    })
  }
}

export = Perrisbrewery
