/**
 * perri's brewery
 * 
 * Class: dpkg
 *
 */
import fs from 'fs'
import mustache from 'mustache'
import path from 'path'
import { IPackage } from '../interfaces'
import Utils from './utils'
import {array2comma, depCommon, depArch} from '../lib/dependencies'
import {exec} from'../lib/utils'

/**
 * class Dpkg
 * analyze
 */
export default class Dpkg {
  pbPackage = {} as IPackage

  /**
   * Receive a file .deb or a path (structured as file deb)
   * @param debPackage
   * @return IPackage
   */
  async analyze(pathSource = '', verbose = false): Promise <IPackage> {
    if (verbose) {
      console.log('dpkg.analyze()')
    }
    this.pbPackage.path = path.dirname(pathSource) + '/'
    const debPackage = path.basename(pathSource)

    const names = debPackage.split('_') // eggs 9.0.0 amd64.deb
    this.pbPackage.name = names[0] // eggs
    this.pbPackage.sourceVersion = names [1] // 9.0.0
    this.pbPackage.linuxArch = names[2].substring(0, names[2].indexOf(".")) // amd64

    this.pbPackage.linuxArch = 'i386'
    if (debPackage.includes('amd64')) {
      this.pbPackage.linuxArch = 'amd64'
    } else if (debPackage.includes('arm64')) {
      this.pbPackage.linuxArch = 'arm64'
    } else if (debPackage.includes('armel')) {
      this.pbPackage.linuxArch = 'armel'
    }

    this.pbPackage.tempDir = `./perrisbrewery/workdir/${this.pbPackage.name}_${this.pbPackage.sourceVersion}_${this.pbPackage.linuxArch}`
    this.pbPackage.nodeVersion = process.version
    this.pbPackage.destDir = this.pbPackage.tempDir
    return this.pbPackage
  }

  /**
   *
   */
  async pack(pbPackage: IPackage, verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('dpkg.pack()')
    }
    this.pbPackage = pbPackage
    await exec(`dpkg-deb --build ${this.pbPackage.destDir}`, echo)
  }

  /**
   * unpack
   */
  async unpack(verbose = false): Promise <void> {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('dpkg.unpack()')
    }
    
    if (fs.existsSync(this.pbPackage.tempDir)) {
      await exec(`rm ${this.pbPackage.tempDir} -rf`, echo)
    }
    await exec(`mkdir ${this.pbPackage.tempDir} `, echo)
    await exec(`dpkg-deb -R ${this.pbPackage.path}${this.pbPackage.name}_${this.pbPackage.sourceVersion}_${this.pbPackage.linuxArch}.deb ${this.pbPackage.tempDir}`, echo)
  }

  /**
   * copy preinst, postinst, prerm and postrm
   */
   async makeScripts(verbose = false) : Promise <void> {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('dpkg.makeScripts()')
    }

    await exec(`cp ./perrisbrewery/scripts/* ${this.pbPackage.destDir}/DEBIAN/`, echo)
  }

 
  /**
   * makeControl
   * Add dependencies common
   */
  makeControl(verbose = false)  {
    let packages = depCommon
    if (verbose) {
      console.log('dpkg.makeControl()')
    }

    const arch = Utils.machineArch()
    depArch.forEach((dep) => {
       if (dep.arch.includes(arch)) {
          packages.push(dep.package)
       }
    })

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
  }

}
