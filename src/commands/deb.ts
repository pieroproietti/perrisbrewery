import {
  Args, Command, Flags,
} from '@oclif/core'
import fs from 'fs'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import Utils from '../classes/utils.js'
import { DebBuilder } from '../classes/deb-builder.js'
import { exec } from '../lib/utils.js'


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

    // 1. debian arch mapping
    const DEBIAN_MAP = {
      'x64': 'amd64',
      'arm64': 'arm64',
      'ia32': 'i386',
      'riscv64': 'riscv64'
    } as const;

    let debArchs: string[];

    if (all) {
      debArchs = ['amd64', 'arm64', 'i386', 'riscv64'];
    } else {
      const current = process.arch;
      if (current in DEBIAN_MAP) {
        debArchs = [DEBIAN_MAP[current as keyof typeof DEBIAN_MAP]];
      } else {
        console.log(`Warning: architecture '${current}' is not included on Debian. Process will end!.`);
        process.exit(0);
      }
    }

    const builder = new DebBuilder(this.pathSource, this.here, verbose, tempBuildRoot, finalReleasesDir)

    // Avvia il ciclo di build per ogni architettura
    for (const debArch of debArchs) {
      await builder.build(debArch, release, manpages)
    }

    this.log('All builds complete!')
  }
}

