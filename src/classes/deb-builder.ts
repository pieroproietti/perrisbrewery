import * as fs from 'fs'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import yaml from 'js-yaml'
import mustache from 'mustache'
import { IDependency } from '../interfaces/i-dependency.js'
import { exec } from '../lib/utils.js'
import Converter from './converter.js'
import Utils from './utils.js'

export class DebBuilder {
  private echo: object

  constructor(
    private pathSource: string,
    private here: string,
    private verbose: boolean,
    private tempBuildRoot: string,
    private finalReleasesDir: string
  ) {
    this.echo = Utils.setEcho(verbose)
  }

  async build(debArch: string, release: string, manpages: boolean) {
    console.log('')
    console.log(`--- Building for architecture: ${debArch} ---`)

    const packageJsonContent = fs.readFileSync(path.join(this.pathSource, 'package.json'), 'utf8')
    const packageJson = JSON.parse(packageJsonContent)

    const { description, version: packageVersion, files } = packageJson
    const packageName = packageJson.name
    const mantainer = packageJson.mantainer ?? packageJson.author ?? "Perris' Brewery"
    const binName = Object.keys(packageJson.bin)[0]
    const packageNameVersioned = `${packageName}_${packageVersion}-${release}_${debArch}`

    // Package build directory
    const packageDir = path.join(this.tempBuildRoot, packageNameVersioned)
    const rootLib = path.join(packageDir, 'usr', 'lib', packageName)

    // Create skeleton
    await Promise.all([
      fsPromises.mkdir(path.join(packageDir, 'DEBIAN'), { recursive: true }),
      fsPromises.mkdir(path.join(packageDir, 'usr', 'bin'), { recursive: true }),
      fsPromises.mkdir(rootLib, { recursive: true }),
      fsPromises.mkdir(path.join(rootLib, 'manpages', 'doc', 'man'), { recursive: true }),
    ])
    console.log('Package skeleton created.')

    // Dependencies
    const dependenciesFile = path.join(this.here, 'perrisbrewery', 'template', 'dependencies.yaml')
    const fileContents = fs.readFileSync(dependenciesFile, 'utf8')
    const dep = yaml.load(fileContents) as IDependency
    const packages = [...dep.common, ...(dep.arch[debArch] || [])].sort()

    // Control file
    const template = fs.readFileSync(path.join(this.here, 'perrisbrewery', 'template', 'control.template'), 'utf8')
    fs.writeFileSync(path.join(packageDir, 'DEBIAN', 'control'), mustache.render(template, {
      arch: debArch,
      depends: packages.join(', '),
      description,
      mantainer,
      name: packageName,
      version: `${packageVersion}-${release}`,
    }))
    console.log('DEBIAN/control file created.')

    // Copy scripts
    await exec(`cp ${path.join(this.here, 'perrisbrewery', 'scripts', '*')} ${path.join(packageDir, 'DEBIAN/')}`, this.echo)

    // Man pages
    const converter = new Converter(path.join(this.pathSource, 'README.md'))
    await converter.readme2md(packageDir, packageName, packageVersion, binName, packageNameVersioned, this.verbose)
    await converter.md2man(packageDir, packageName, packageVersion, binName, this.verbose)
    await converter.md2html(packageDir, packageName, packageVersion, binName, this.verbose)
    console.log('Man page created.')

    // Refresh manpages in source
    if (manpages) {
      console.log('Refreshing manpages in source directory...')
      await exec(`rm -rf ${path.join(this.here, 'manpages')}`, this.echo)
      await exec(`cp -r ${path.join(rootLib, 'manpages')} ${this.here}`, this.echo)
    }

    // Copy application files
    console.log('Copying application files...')
    for (const file of files) {
      await exec(`cp -r ${path.join(this.pathSource, file)} ${rootLib}/`, this.echo)
    }
    await exec(`cp -r ${path.join(this.pathSource, 'LICENSE')} ${rootLib}`, this.echo)
    await exec(`cp -r ${path.join(this.pathSource, 'node_modules')} ${rootLib}`, this.echo)
    await exec(`cp -r ${path.join(this.pathSource, 'package.json')} ${rootLib}`, this.echo)

    // Lock files
    for (const lockFile of ['pnpm-lock.yaml', 'yarn.lock', 'npm-shrinkwrap.json']) {
      if (fs.existsSync(path.join(this.pathSource, lockFile))) {
        await exec(`cp -r ${path.join(this.pathSource, lockFile)} ${rootLib}`, this.echo)
      }
    }

    // Symlink binary
    await exec(`ln -sf ../lib/${packageName}/bin/run.js ${path.join(packageDir, 'usr', 'bin', binName)}`)

    // Build package (SUDO required)
    console.log('Setting permissions and building package...')
    await exec(`sudo chown -R root:root "${packageDir}"`)

    // Using simple exec for dpkg-deb command inside temp dir
    const originalDir = process.cwd()
    process.chdir(this.tempBuildRoot)
    try {
      await exec(`dpkg-deb --build ${path.basename(packageDir)}`)
    } finally {
      process.chdir(originalDir)
    }

    await exec(`sudo rm -rf ${packageDir}`)
    console.log(`Package ${packageNameVersioned}.deb built successfully.`)

    // Checksum and move
    console.log(`Creating checksum and moving to ${this.finalReleasesDir}...`)

    process.chdir(this.tempBuildRoot)
    try {
      await exec(`sha256sum ${packageNameVersioned}.deb > ${packageNameVersioned}.deb.sha256`)
      await exec(`mv ${packageNameVersioned}.deb ${this.finalReleasesDir}/`)
      await exec(`mv ${packageNameVersioned}.deb.sha256 ${this.finalReleasesDir}/`)
    } finally {
      process.chdir(originalDir)
    }

    console.log(`--- Finished ${debArch} ---`)
  }
}
