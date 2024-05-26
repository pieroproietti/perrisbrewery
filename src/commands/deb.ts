// https://github.com/oclif/oclif/blob/main/src/commands/pack/deb.ts
import { Args, Command, Flags, Interfaces } from '@oclif/core'
import fs, { utimes } from 'fs'
import { exec as execSync } from 'node:child_process'
import * as path from 'node:path'
import { promisify } from 'node:util'
import * as fsPromises from 'node:fs/promises'

import Utils from '../classes/utils'
import { array2comma, depCommon, depArch } from '../lib/dependencies'
import { IPackage } from '../interfaces'
import mustache from 'mustache'
import Converter from '../classes/converter'

//import * as Tarballs from '../classes/tarballs'
//import {debArch, debVersion, templateShortKey} from '../../upload-util'
//import {uniq} from '../../util'

const exec = promisify(execSync)

/**
 * 
 */
export default class Deb extends Command {
  static description = 'Create a deb package from your CLI. This command is only available on Linux.'

  static args = {
    pathSource: Args.string({ name: 'pathSource', description: 'pathSource', required: false }),
  }

  static flags = {
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
    help: Flags.help({ char: 'h' }),
    mantain: Flags.boolean({ char: 'm' }),
  }

  static summary = 'Pack CLI into debian package.'

  pbPackage: IPackage = {} as IPackage


  async run(): Promise<void> {
    const { args, flags } = await this.parse(Deb)

    if (process.platform !== 'linux') {
      this.log('debian packing must be run on linux')
      this.exit(0)
    }

    const verbose = flags.verbose
    const echo = Utils.setEcho(verbose)
    // Crea configurazione per il pacchetto
    const here = process.cwd() + '/'
    let pathSource = here

    if (args.pathSource !== undefined) {
      if (pathSource.substring(pathSource.length, -1) !== '/') {
        pathSource = args.pathSource + '/'
      } else {
        pathSource = args.pathSource
      }
    }

    await exec(`sudo rm -rf "${here}perrisbrewery/workdir/*"`)
    await exec(`sudo rm -rf "${here}perrisbrewery/penguins-eggs*"`)


    if (!fs.existsSync(`${here}/perrisbrewery`)) {
      fs.mkdirSync(`${here}/perrisbrewery`)
      await exec(`cp -r ${path.resolve(__dirname, `../perrisbrewery/template`)} ${here}/perrisbrewery`, echo)
      await exec(`cp -r ${path.resolve(__dirname, `../perrisbrewery/scripts`)} ${here}/perrisbrewery`, echo)
      this.log('perrisbrewery dir created in: ' + pathSource)
      this.log('Edit configuration in template e scripts. Include /perribrewery/workdir in your .gitignore.')
      this.log('After sudo npm run deb (build deb package with oclif')
      this.log('Finally run pb to rebuild your packages with manual, scripts, etc')
      process.exit(0)
    } else {
      this.log('configurations already exists')
    }

    const debArch = Utils.machineArch()
    const debVersion = Utils.getPackageVersion()
    const debPackageName = Utils.getPackageName()
    const workspace = path.join(here, 'perrisbrewery', 'workdir', debPackageName + "_" + debVersion + "_" + debArch)
    await Promise.all([
      fsPromises.mkdir(path.join(workspace, 'DEBIAN'), { recursive: true }),
      fsPromises.mkdir(path.join(workspace, 'usr', 'bin'), { recursive: true }),
      fsPromises.mkdir(path.join(workspace, 'usr', 'lib', Utils.getPackageName()), { recursive: true }),
      fsPromises.mkdir(path.join(workspace, 'usr', 'lib', Utils.getPackageName(), 'manpages', 'doc', 'man'), { recursive: true }),
    ])
    this.log('creating debian structure complete')

    let packages = depCommon
    const arch = Utils.machineArch()
    depArch.forEach((dep) => {
      if (dep.arch.includes(arch)) {
        packages.push(dep.package)
      }
    })

    this.pbPackage.destDir = workspace
    this.pbPackage.linuxArch = debArch
    this.pbPackage.sourceVersion = debVersion
    this.pbPackage.name = debPackageName
    this.pbPackage.path = pathSource
    this.pbPackage.tempDir = path.join(here, 'perrisbrewery', 'workdir', 'temp')
    this.pbPackage.nodeVersion = process.version

    packages.sort()
    const depends = array2comma(packages)
    const template = fs.readFileSync('perrisbrewery/template/control.template', 'utf8')
    const view = {
      name: this.pbPackage.name,
      version: this.pbPackage.sourceVersion,
      section: 'main',
      priority: 'standard',
      arch: this.pbPackage.linuxArch,
      mantainer: 'artisan <piero.proietti@gmail.com>',
      description: 'Perri\'s Brewery edition',
      depends: depends,
    }
    // depends, suggest e conflicts vengono gestiti a mano
    fs.writeFileSync(`${this.pbPackage.destDir}/DEBIAN/control`, mustache.render(template, view))
    this.log('creating debian control complete')

    //await exec(`cp ./perrisbrewery/scripts/* ${this.pbPackage.destDir}/DEBIAN/`, echo)
    this.log('Copy Debian scripts complete')

    // converti il readme e crea pagina man
    await exec(`cp ./README.md  ${this.pbPackage.destDir}/DEBIAN/`, echo)
    const converter = new Converter(pathSource + '/README.md')
    await converter.readme2md(verbose)
    await converter.md2man(verbose)
    await converter.md2html(verbose)
    this.log('created man page complete')

    // copia il binario
    let dest=this.pbPackage.destDir + "/usr/lib/penguins-eggs"
    await exec(`cp -r ${pathSource}/assets ${dest}`, echo)
    await exec(`cp -r ${pathSource}/bin ${dest}`, echo)
    await exec(`cp -r ${pathSource}/conf ${dest}`, echo)
    await exec(`cp -r ${pathSource}/dist ${dest}`, echo)
    await exec(`cp -r ${pathSource}/eui ${dest}`, echo)
    await exec(`cp -r ${pathSource}/LICENSE ${dest}`, echo)
    //await exec(`cp -r ${pathSource}/mkinitcpio  ${dest}`, echo)
    await exec(`cp -r ${pathSource}/node_modules  ${dest}`, echo)
    await exec(`cp -r ${pathSource}/package.json  ${dest}`, echo)
    await exec(`cp -r ${pathSource}/pnpm-lock.yaml  ${dest}`, echo)
    await exec(`cp -r ${pathSource}/scripts  ${dest}`, echo)
    this.log('imported node package complete')

    //await exec(`mkdir ${dest}/bin`, echo) // non serve
    await exec(`ln -s /usr/bin/node ${dest}/bin/node`)
    this.log('created link node')

    const dpkgDeb = flags.compression ? `dpkg-deb --build "-Z${flags.compression}"` : 'dpkg-deb --build'
    await exec(`sudo chown -R root "${workspace}"`)
    await exec(`sudo chgrp -R root "${workspace}"`)
    await exec(`${dpkgDeb} "${workspace}"`)
    this.log(`finished building debian / ${arch}`)
  }
}


