/**
 * perri's brewery
 * 
 * Class: dpkg
 *
 */
import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
import path = require('path')
import { IPackage } from '../interfaces'
import { dependencies } from 'pjson'
import Utils from './utils'
import {array2spaced, depCommon, depArch} from '../lib/dependencies'

/**
 * class Dpkg
 * analyze
 */
export default class Dpkg {
  pbPackage = {} as IPackage

  /**
   * Recive a file .deb or a path (structured as file deb)
   * @param debPackage
   * @return IPackage
   */
  analyze(pathSource = ''): IPackage {
    this.pbPackage.path = path.dirname(pathSource) + '/'
    const debPackage = path.basename(pathSource)

    this.pbPackage.name = debPackage.substring(0, debPackage.indexOf('_'))
    this.pbPackage.sourceVersion = debPackage.substring(debPackage.indexOf('_') + 1, debPackage.indexOf('-'))
    this.pbPackage.buildVersion = debPackage.substring(debPackage.indexOf('-') + 1, debPackage.indexOf('-') + 2)

    this.pbPackage.linuxArch = 'i386'

    if (debPackage.includes('amd64')) {
      this.pbPackage.linuxArch = 'amd64'
    }

    if (debPackage.includes('arm64')) {
      this.pbPackage.linuxArch = 'arm64'
    }

    if (debPackage.includes('armel')) {
      this.pbPackage.linuxArch = 'armel'
    }

    this.pbPackage.tempDir = `./perrisbrewery/workdir/${this.pbPackage.name}_${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion}_${this.pbPackage.linuxArch}`
    this.pbPackage.nodeVersion = process.version
    this.pbPackage.destDir = this.pbPackage.tempDir
    return this.pbPackage
  }

  /**
   *
   */
  pack(pbPackage: IPackage) {
    this.pbPackage = pbPackage

    shx.exec(`dpkg-deb --build ${this.pbPackage.destDir}`)
  }

  /**
   * Forse dovrebbe chiamarsi unpack
   */
  unpack(): void {
    if (fs.existsSync(this.pbPackage.tempDir)) {
      shx.exec(`rm ${this.pbPackage.tempDir} -rf`)
    }
    shx.exec(`mkdir ${this.pbPackage.tempDir} `)
    shx.exec(`dpkg-deb -R ${this.pbPackage.path}${this.pbPackage.name}_${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion}_${this.pbPackage.linuxArch}.deb ${this.pbPackage.tempDir}`)
  }

  /**
   * copy preinst, postinst, prerm and postrm
   */
  makeScripts() {
    shx.exec(`cp ./perrisbrewery/scripts/* ${this.pbPackage.destDir}/DEBIAN/`)
  }

 
  /**
   * makeControl
   * We need to parify this version with pacman in penguins-eggs
   */
  makeControl() {
    // Add dependencies common
    let packages = depCommon

    // Add dependencies arch
    const arch = Utils.machineArch()
    depArch.forEach((dep) => {
       if (dep.arch.includes(arch)) {
          packages.push(dep.package)
       }
    })

    const depends = array2spaced(packages)

    const template = fs.readFileSync('perrisbrewery/template/control.template', 'utf8')
    const view = {
      name: this.pbPackage.name,
      version: this.pbPackage.sourceVersion + '-' + this.pbPackage.buildVersion,
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
