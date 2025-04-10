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
  static args = {
    pathSource: Args.string({description: 'pathSource', name: 'pathSource', required: false}),
  }

  static description = 'Create a deb package from your npm package'

  static flags = {
    help: Flags.help({char: 'h'}),
    all: Flags.boolean({char: 'a', description: 'all architectures'}),
    codename: Flags.string({char: 'c', description: 'codename'}),
    mantain: Flags.boolean({char: 'm'}),
    release: Flags.string({char: 'r', description: 'release'}),
    manpages: Flags.boolean({char: 'M', description: 'refresh manpages on the sources'}),
    verbose: Flags.boolean({char: 'v', description: 'verbose'}),
  }

  static summary = 'Pack CLI into debian package.'

  /**
   *
   */
  async run(): Promise<void> {
    const {args, flags} = await this.parse(Deb)

    if (process.platform !== 'linux') {
      this.log('debian packing must be run on linux')
      this.exit(0)
    }

    let manpages = flags.manpages

    let all = flags.all
    if (all === undefined) {
      all = false
    }


    let {codename} = flags
    if (codename === undefined) {
      codename = ''
    }

    let {release} = flags
    if (release === undefined) {
      release = '1'
    }

    const {verbose} = flags
    const echo = Utils.setEcho(verbose)

    // Crea configurazione per il pacchetto
    const here = process.cwd() + '/'
    let pathSource = here
    if (args.pathSource !== undefined) {
      if (pathSource.substring(pathSource.length, -1) === '/') {
        pathSource = args.pathSource
      } else {
        pathSource = args.pathSource + '/'
      }
    }

    if (fs.existsSync(`${here}/perrisbrewery`)) {
      this.log('perrisbrewery configurations already exists')
    } else {
      fs.mkdirSync(`${here}/perrisbrewery`)
      await exec(`cp -r ${path.resolve(__dirname, '../perrisbrewery.sample/*')} ${here}/perrisbrewery`, echo)
      this.log('perrisbrewery dir created in: ' + pathSource)
      this.log('Edit configuration in template e scripts. Include /perribrewery/workdir in your .gitignore.')
      this.log('Finally run pb to rebuild your packages with manpages, scripts, etc')
      process.exit(0)
    }

    if (!fs.existsSync(pathSource + 'package.json')) {
      console.log('package.json not found in ' + pathSource)
      process.exit(0)
    }

    // Decido le architetture da costruire
    let debArchs = ['amd64']
    if (all) {
      debArchs = ['amd64', 'arm64', 'i386']
    } else {
      if (process.arch === 'x64') {
        debArchs= ['amd64']
      } else if (process.arch === 'arm64') {
        debArchs= ['arm64']
      } else if (process.arch === 'ia32') {
        debArchs= ['i386']
      }
    }
  
    if (codename === 'bionic') {
      debArchs = ['amd64']
    }
    
    // per operare sul valor for .. of
    for (const debArch of debArchs) {
      this.log('')
      this.log('building arch: ' + debArch)

      const content = fs.readFileSync(pathSource + 'package.json', 'utf8')
      const packageJson = JSON.parse(content)
      let {mantainer} = packageJson
      if (mantainer === undefined) {
        mantainer = packageJson.author
      }

      if (mantainer === undefined) {
        mantainer = 'made on Perris\' Brewery'
      }

      const {description} = packageJson
      const packageVersion = packageJson.version
      const packageRelease = release
      const packageName = packageJson.name
      let packageNameVersioned = `${packageName}_${packageVersion}-${packageRelease}_${debArch}`
      if (codename === 'bionic') {
        packageNameVersioned = `${packageName}_${packageVersion}-bionic-${packageRelease}_${debArch}`
      }
      const {files} = packageJson
      const binName = Object.keys(packageJson.bin)[0]

      const packageRoot = path.join(here, 'dist')
      const packageDir = path.join(packageRoot, packageNameVersioned)

      await Promise.all([
        fsPromises.mkdir(path.join(packageDir, 'DEBIAN'), {recursive: true}),
        fsPromises.mkdir(path.join(packageDir, 'usr', 'bin'), {recursive: true}),
        fsPromises.mkdir(path.join(packageDir, 'usr', 'lib', packageName), {recursive: true}),
        fsPromises.mkdir(path.join(packageDir, 'usr', 'lib', packageName, 'manpages', 'doc', 'man'), {recursive: true}),
      ])
      this.log('creating package skel complete')

      // find package dependencies
      let dependenciesFile="dependencies.yaml"
      if (codename==='bionic') {
        console.log("codename: bionic")
        dependenciesFile="dependencies-bionic.yaml"
      }
      let fileContents = fs.readFileSync(`${here}/perrisbrewery/template/${dependenciesFile}`, 'utf8')
      const dep = yaml.load(fileContents) as IDependency
      let packages = dep.common
      packages = packages.concat(dep.arch[debArch])
      packages.sort()

      // create debian control file
      const depends = array2comma(packages)
      const template = fs.readFileSync('./perrisbrewery/template/control.template', 'utf8')
      const view = {
        arch: debArch,
        depends,
        description,
        mantainer,
        name: packageName,
        priority: 'standard',
        section: 'main',
        version: `${packageVersion}-${packageRelease}`,
      }
      fs.writeFileSync(`${packageDir}/DEBIAN/control`, mustache.render(template, view))
      this.log('>>> creating debian control file complete')

      // include debian scripts
      await exec(`cp ./perrisbrewery/scripts/* ${packageDir}/DEBIAN/`, echo)
      this.log('>>> included debian scripts: postinst, postrm, preinst, prerm')

      // create man page
      await exec(`cp ./README.md  ${packageDir}/DEBIAN/`, echo)
      const converter = new Converter(pathSource + '/README.md')
      await converter.readme2md(packageDir, packageName, packageVersion, binName, packageNameVersioned, verbose)
      await converter.md2man(packageDir, packageName, packageVersion, binName, verbose)
      await converter.md2html(packageDir, packageName, packageVersion, binName,  verbose)
      this.log('>>> created man page complete')

      if (manpages) {
        this.log('>>> refresh manpages on the sources')
        await exec(`rm -rf ${here}/manpages`, echo)
        await exec(`cp ${packageDir}/usr/lib/${packageName}/manpages ${here} -R`, echo)
      }

      // copia i file del pacchetto
      const rootLib = `${packageDir}/usr/lib/${packageName}`
      await exec(`cp -r ${pathSource}/LICENSE ${rootLib}`, echo)
      await exec(`cp -r ${pathSource}/node_modules  ${rootLib}`, echo)
      await exec(`cp -r ${pathSource}/package.json  ${rootLib}`, echo)

      // copia il lock file
      if (fs.existsSync(pathSource + '/pnpm-lock.yaml')) {
        await exec(`cp -r ${pathSource}/pnpm-lock.yaml  ${rootLib}`, echo)
      }

      if (fs.existsSync(pathSource + '/yarn.lock')) {
        await exec(`cp -r ${pathSource}/yarn.lock  ${rootLib}`, echo)
      }

      if (fs.existsSync(pathSource + '/npm-shrinkwrap.json')) {
        await exec(`cp -r ${pathSource}/npm-shrinkwrap.json  ${rootLib}`, echo)
      }

      // copia i file del pacchetto
      for (const file in files) {
        await exec(`cp -r ${pathSource}/${files[file]} ${rootLib}`, echo)
      }

      this.log('>>> imported node package complete')

      // create link to node on rootLib
      await exec(`ln -s /usr/bin/node ${rootLib}/bin/node`)
      this.log('>>> created link node')

      // create binName
      fs.writeFileSync(`${rootLib}/bin/${binName}`, scripts.bin(this.config))
      await exec(`chmod 755 ${rootLib}/bin/${binName}`)
      this.log(`>>> created exec ${binName}`)

      const curDir = process.cwd()
      process.chdir(`${packageDir}/usr/bin`)
      await exec(`ln -sf ../lib/${packageName}/bin/${binName} ${binName}`)
      process.chdir(curDir)
      this.log(`>>> created a link on /usr/bin/ for ${binName}`)

      await exec(`sudo chown -R root "${packageDir}"`)
      await exec(`sudo chgrp -R root "${packageDir}"`)
      await exec(`dpkg-deb --build ${packageDir}`)
      await exec(`sudo rm -rf ${packageRoot}/${packageNameVersioned}`)
      this.log(`finished building ${packageNameVersioned}.deb`)

      this.log(`Creating sha256sum on ${packageDir}.deb`)
      let savedDir=process.cwd()
      process.chdir(packageRoot)
      await exec(`sha256sum ${packageNameVersioned}.deb > ${packageNameVersioned}.deb.sha256`)
      process.chdir(savedDir)
    }

    this.log('Complete!')
  }
}

/**
 * @param packages array packages
 */
function array2comma(packages: string[]): string {
  return packages.join(',\n         ')    
  //return packages.join(', ')
}

