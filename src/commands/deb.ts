// https://github.com/oclif/oclif/blob/main/src/commands/pack/deb.ts
import { Args, Command, Flags, Interfaces } from '@oclif/core'
import { array2comma, depCommon, depArch } from '../lib/dependencies'
import { IPackage } from '../interfaces'
import { exec } from '../lib/utils'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import Converter from '../classes/converter'
import fs, { utimes } from 'fs'
import mustache from 'mustache'
import Utils from '../classes/utils'
import yaml from 'js-yaml'

const scripts = {
  /* eslint-disable no-useless-escape */
  bin: (config: Interfaces.Config) => `#!/usr/bin/env bash
set -e
echoerr() { echo "$@" 1>&2; }
get_script_dir () {
  SOURCE="\${BASH_SOURCE[0]}"
  # While \$SOURCE is a symlink, resolve it
  while [ -h "\$SOURCE" ]; do
    DIR="\$( cd -P "\$( dirname "\$SOURCE" )" && pwd )"
    SOURCE="\$( readlink "\$SOURCE" )"
    # If \$SOURCE was a relative symlink (so no "/" as prefix, need to resolve it relative to the symlink base directory
    [[ \$SOURCE != /* ]] && SOURCE="\$DIR/\$SOURCE"
  done
  DIR="\$( cd -P "\$( dirname "\$SOURCE" )" && pwd )"
  echo "\$DIR"
}
DIR=\$(get_script_dir)
export ${config.scopedEnvVarKey('UPDATE_INSTRUCTIONS')}="update with \\"sudo apt update && sudo apt install ${config.bin
    }\\""
\$DIR/node \$DIR/run "\$@"
`,
}


/**
 * 
 */
export default class Deb extends Command {
  static description = 'Create a deb package from your npm package'

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

    if (!fs.existsSync(`${here}/perrisbrewery`)) {
      fs.mkdirSync(`${here}/perrisbrewery`)
      await exec(`cp -r ${path.resolve(__dirname, `../perrisbrewery.template/template`)} ${here}/perrisbrewery`, echo)
      await exec(`cp -r ${path.resolve(__dirname, `../perrisbrewery.template/scripts`)} ${here}/perrisbrewery`, echo)
      this.log('perrisbrewery dir created in: ' + pathSource)
      this.log('Edit configuration in template e scripts. Include /perribrewery/workdir in your .gitignore.')
      this.log('After sudo npm run deb (build deb package with oclif')
      this.log('Finally run pb to rebuild your packages with manual, scripts, etc')
      process.exit(0)
    } else {
      this.log('configurations already exists')
    }

    if (! fs.existsSync(pathSource + 'package.json')) {
      console.log('package.json not found in ' + pathSource)
      process.exit(0)
    }

    let content = fs.readFileSync(pathSource + 'package.json', 'utf8')
    let packageJson = JSON.parse(content)
    const debArch = Utils.machineArch()
    const debVersion = packageJson.version + "-1"
    const debPackageName = packageJson.name
    const workspace = path.join(here, 'perrisbrewery', 'workdir', debPackageName + "_" + debVersion + "_" + debArch)

    this.pbPackage.destDir = workspace
    this.pbPackage.linuxArch = debArch
    this.pbPackage.sourceVersion = debVersion
    this.pbPackage.name = debPackageName
    this.pbPackage.path = pathSource
    this.pbPackage.nodeVersion = process.version
    console.log(this.pbPackage)
  
    if (fs.existsSync(`${here}perrisbrewery/workdir/`)) {
      await exec(`sudo rm -rf ${here}perrisbrewery/workdir/*`)
    }

    await Promise.all([
      fsPromises.mkdir(path.join(workspace, 'DEBIAN'), { recursive: true }),
      fsPromises.mkdir(path.join(workspace, 'usr', 'bin'), { recursive: true }),
      fsPromises.mkdir(path.join(workspace, 'usr', 'lib', Utils.getPackageName()), { recursive: true }),
      fsPromises.mkdir(path.join(workspace, 'usr', 'lib', Utils.getPackageName(), 'manpages', 'doc', 'man'), { recursive: true }),
    ])
    this.log('creating package skel complete')

    // create package dependencies
    let packages = depCommon
    const arch = Utils.machineArch()
    depArch.forEach((dep) => {
      if (dep.arch.includes(arch)) {
        packages.push(dep.package)
      }
    })
    packages.sort()
    const depends = array2comma(packages)

    // create debian control file
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
    fs.writeFileSync(`${this.pbPackage.destDir}/DEBIAN/control`, mustache.render(template, view))
    this.log('creating debian control file complete')

    // include debian scripts
    await exec(`cp ./perrisbrewery/scripts/* ${this.pbPackage.destDir}/DEBIAN/`, echo)
    this.log('included debian scripts: postinst, postrm, preinst, prerm')

    // create man page
    await exec(`cp ./README.md  ${this.pbPackage.destDir}/DEBIAN/`, echo)
    const converter = new Converter(pathSource + '/README.md')
    await converter.readme2md(this.pbPackage, verbose)
    await converter.md2man(this.pbPackage, verbose)
    await converter.md2html(this.pbPackage, verbose)
    this.log('created man page complete')

    // copia il binario
    let dest = this.pbPackage.destDir + "/usr/lib/penguins-eggs"
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

    await exec(`ln -s /usr/bin/node ${dest}/bin/node`)
    this.log('created link node')


    fs.writeFileSync(`${dest}/bin/eggs`, scripts.bin(this.config))
    await exec(`chmod 755 ${dest}/bin/eggs`)
    this.log(`created exec ${dest}/bin/eggs`)

    let curDir = process.cwd()
    process.chdir(`${this.pbPackage.destDir}/usr/bin`)
    await exec(`ln -s ../lib/penguins-eggs/bin/eggs eggs`)
    process.chdir(curDir)
    this.log('created /usr/bin/eggs file complete')
    this.log(`created a link for /usr/bin`)

    const dpkgDeb = flags.compression ? `dpkg-deb --build "-Z${flags.compression}"` : 'dpkg-deb --build'
    await exec(`sudo chown -R root "${workspace}"`)
    await exec(`sudo chgrp -R root "${workspace}"`)
    await exec(`${dpkgDeb} "${workspace}"`)

    this.log(`finished building debian / ${arch}`)
  }
}

