import {
  Args, Command, Flags, Interfaces, // <-- CORREZIONE 1: Aggiunto 'Interfaces'
} from '@oclif/core'
import fs from 'fs'
import yaml from 'js-yaml'
import mustache from 'mustache'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'

import Converter from '../classes/converter'
import Utils from '../classes/utils'
import { IDependency } from '../interfaces/i-dependency'
import { exec } from '../lib/utils'

// Lo script per l'eseguibile binario rimane invariato
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
 * Comando per creare pacchetti Debian
 */
export default class Deb extends Command {
  here = ''
  pathSource = ''

  static args = {
    pathSource: Args.string({ description: 'pathSource', name: 'pathSource', required: false }),
  }

  static description = 'Create a deb package from your npm package'

  static flags = {
    help: Flags.help({ char: 'h' }),
    all: Flags.boolean({ char: 'a', description: 'all architectures' }),
    release: Flags.string({ char: 'r', description: 'release' }),
    manpages: Flags.boolean({ char: 'M', description: 'refresh manpages on the sources' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static summary = 'Pack CLI into debian package.'

  /**
   * Metodo principale eseguito dal comando
   */
  async run(): Promise<void> {
    const { args, flags } = await this.parse(Deb)

    if (process.platform !== 'linux') {
      this.log('debian packing must be run on linux')
      this.exit(0)
    }

    const { verbose, all, manpages } = flags
    const release = flags.release ?? '1'
    const echo = Utils.setEcho(verbose)

    // Imposta i percorsi di base
    this.here = process.cwd()
    this.pathSource = args.pathSource ? path.resolve(args.pathSource) : this.here
    
    // Gestione primo avvio e creazione configurazione perrisbrewery
    if (!fs.existsSync(path.join(this.here, 'perrisbrewery'))) {
      this.log('perrisbrewery configurations not found, creating sample...')
      fs.mkdirSync(path.join(this.here, 'perrisbrewery'))
      await exec(`cp -r ${path.resolve(__dirname, '../perrisbrewery.sample/*')} ${path.join(this.here, 'perrisbrewery')}`, echo)
      this.log('perrisbrewery dir created. Edit configuration, include /perrisbrewery/workdir in .gitignore, then run again.')
      this.exit(0)
    }

    if (!fs.existsSync(path.join(this.pathSource, 'package.json'))) {
      this.log(`package.json not found in ${this.pathSource}`)
      this.exit(0)
    }

    // --- LOGICA DELLE DIRECTORY DI BUILD ---
    const tempBuildRoot = path.join(this.here, 'build')      // Area di assemblaggio temporanea
    const finalReleasesDir = path.join(this.here, 'releases') // Area per i pacchetti .deb finali

    // Pulisci SOLO la directory di assemblaggio temporanea prima di iniziare
    this.log(`Cleaning temporary build directory: ${tempBuildRoot}`)
    if (fs.existsSync(tempBuildRoot)) {
      await fsPromises.rm(tempBuildRoot, { recursive: true, force: true })
    }
    await fsPromises.mkdir(tempBuildRoot, { recursive: true })

    // Assicurati che la directory per i pacchetti finali esista
    if (!fs.existsSync(finalReleasesDir)) {
      await fsPromises.mkdir(finalReleasesDir, { recursive: true })
    }
    // --- FINE LOGICA DIRECTORY ---

    // Determina le architetture da costruire
    let debArchs = [process.arch === 'x64' ? 'amd64' : process.arch]
    if (all) {
      debArchs = ['amd64', 'arm64', 'i386']
    }
    
    // Avvia il ciclo di build per ogni architettura
    for (const debArch of debArchs) {
      await this.createPackage(debArch, release, manpages, verbose, tempBuildRoot, finalReleasesDir)
    }

    this.log('All builds complete!')
  }

  /**
   * Crea un singolo pacchetto per una specifica architettura
   */
  async createPackage(debArch: string, release: string, manpages: boolean, verbose: boolean, tempBuildRoot: string, finalReleasesDir: string) {
    const echo = Utils.setEcho(verbose)

    this.log('')
    this.log(`--- Building for architecture: ${debArch} ---`)

    const packageJsonContent = fs.readFileSync(path.join(this.pathSource, 'package.json'), 'utf8')
    const packageJson = JSON.parse(packageJsonContent)

    const { description, version: packageVersion, files } = packageJson
    const packageName = packageJson.name
    const mantainer = packageJson.mantainer ?? packageJson.author ?? "Perris' Brewery"
    const binName = Object.keys(packageJson.bin)[0]
    const packageNameVersioned = `${packageName}_${packageVersion}-${release}_${debArch}`

    // Il pacchetto viene assemblato dentro la directory `build`
    const packageDir = path.join(tempBuildRoot, packageNameVersioned)
    const rootLib = path.join(packageDir, 'usr', 'lib', packageName)

    // Crea la struttura di base del pacchetto
    await Promise.all([
      fsPromises.mkdir(path.join(packageDir, 'DEBIAN'), { recursive: true }),
      fsPromises.mkdir(path.join(packageDir, 'usr', 'bin'), { recursive: true }),
      fsPromises.mkdir(rootLib, { recursive: true }),
      fsPromises.mkdir(path.join(rootLib, 'manpages', 'doc', 'man'), { recursive: true }),
    ])
    this.log('Package skeleton created.')

    // Gestione dipendenze
    const dependenciesFile = path.join(this.here, 'perrisbrewery', 'template', 'dependencies.yaml')
    const fileContents = fs.readFileSync(dependenciesFile, 'utf8')
    const dep = yaml.load(fileContents) as IDependency
    const packages = [...dep.common, ...(dep.arch[debArch] || [])].sort()

    // Crea il file DEBIAN/control
    const template = fs.readFileSync(path.join(this.here, 'perrisbrewery', 'template', 'control.template'), 'utf8')
    fs.writeFileSync(path.join(packageDir, 'DEBIAN', 'control'), mustache.render(template, {
      arch: debArch,
      depends: packages.join(', '),
      description,
      mantainer,
      name: packageName,
      version: `${packageVersion}-${release}`,
    }))
    this.log('DEBIAN/control file created.')

    // Copia script di post-installazione, etc.
    await exec(`cp ${path.join(this.here, 'perrisbrewery', 'scripts', '*')} ${path.join(packageDir, 'DEBIAN/')}`, echo)

    // Crea man page
    const converter = new Converter(path.join(this.pathSource, 'README.md'))
    await converter.readme2md(packageDir, packageName, packageVersion, binName, packageNameVersioned, verbose)
    await converter.md2man(packageDir, packageName, packageVersion, binName, verbose)
    await converter.md2html(packageDir, packageName, packageVersion, binName, verbose)
    this.log('Man page created.')

    // Aggiorna le man page nei sorgenti se richiesto
    if (manpages) {
      this.log('Refreshing manpages in source directory...')
      await exec(`rm -rf ${path.join(this.here, 'manpages')}`, echo)
      await exec(`cp -r ${path.join(rootLib, 'manpages')} ${this.here}`, echo)
    }

    // Copia i file del pacchetto (da `dist`, `node_modules`, ecc.)
    this.log('Copying application files...')
    for (const file of files) {
      await exec(`cp -r ${path.join(this.pathSource, file)} ${rootLib}/`, echo)
    }
    await exec(`cp -r ${path.join(this.pathSource, 'LICENSE')} ${rootLib}`, echo)
    await exec(`cp -r ${path.join(this.pathSource, 'node_modules')} ${rootLib}`, echo)
    await exec(`cp -r ${path.join(this.pathSource, 'package.json')} ${rootLib}`, echo)
    
    // Copia lock files se esistono
    for (const lockFile of ['pnpm-lock.yaml', 'yarn.lock', 'npm-shrinkwrap.json']) {
        if (fs.existsSync(path.join(this.pathSource, lockFile))) {
            await exec(`cp -r ${path.join(this.pathSource, lockFile)} ${rootLib}`, echo)
        }
    }

    // Crea il link simbolico per l'eseguibile
    await exec(`ln -sf ../lib/${packageName}/bin/${binName} ${path.join(packageDir, 'usr', 'bin', binName)}`)
    
    // Crea lo script binario
    fs.writeFileSync(path.join(rootLib, 'bin', binName), scripts.bin(this.config))
    await fsPromises.chmod(path.join(rootLib, 'bin', binName), 0o755)
    this.log('Binary script and symlinks created.')

    // Imposta i permessi corretti e builda il pacchetto
    this.log('Setting permissions and building package...')
    await exec(`sudo chown -R root:root "${packageDir}"`)
    // --- CORREZIONE 2: Cambiamo cartella con 'cd' perché 'exec' non supporta l'opzione 'cwd' ---
    await exec(`cd ${tempBuildRoot} && dpkg-deb --build ${path.basename(packageDir)}`)
    await exec(`sudo rm -rf ${packageDir}`) // Pulisce la dir di assemblaggio per questa arch
    this.log(`Package ${packageNameVersioned}.deb built successfully.`)

    // Crea il checksum e sposta i file finali
    this.log(`Creating checksum and moving to ${finalReleasesDir}...`)
    const originalDir = process.cwd()
    process.chdir(tempBuildRoot)
    await exec(`sha256sum ${packageNameVersioned}.deb > ${packageNameVersioned}.deb.sha256`)
    await exec(`mv ${packageNameVersioned}.deb ${finalReleasesDir}/`)
    await exec(`mv ${packageNameVersioned}.deb.sha256 ${finalReleasesDir}/`)
    process.chdir(originalDir)

    this.log(`--- Finished ${debArch} ---`)
  }
}
