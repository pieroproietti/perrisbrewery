/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */
/**
 * perri's brewery
 *
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
import path = require('path')
import { IPackage } from '../interfaces'

export default class Dpkg {
  pbPackage = {} as IPackage

  /**
   * Riceve in ingresso un path o un file deb
   * @param debPackage
   */
  analyze(debPackage = '') {
    this.pbPackage.name = 'eggs'

    this.pbPackage.path = path.dirname(debPackage) + '/'
    debPackage = path.basename(debPackage)

    this.pbPackage.sourceVersion = debPackage.substring(debPackage.indexOf('eggs_') + 5, debPackage.indexOf('eggs_') + 11)
    this.pbPackage.buildVersion = debPackage.substring(debPackage.indexOf('eggs_') + 12, debPackage.indexOf('eggs_') + 13)
    this.pbPackage.linuxArch = 'i386'
    if (debPackage.includes('amd64')) {
      this.pbPackage.linuxArch = 'amd64'
    }
    if (debPackage.includes('armel')) {
      this.pbPackage.linuxArch = 'armel'
    }
    this.pbPackage.tempDir = `${this.pbPackage.name}_${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion}_${this.pbPackage.linuxArch}`
    this.pbPackage.nodeVersion = process.version

    return this.pbPackage
  }

  /**
   *
   * @param pathSources
   * @param source
   */
  disclose() {
    if (fs.existsSync(this.pbPackage.tempDir)) {
      shx.exec(`rm ${this.pbPackage.tempDir} -rf`)
    }
    shx.exec(`mkdir ${this.pbPackage.tempDir} `)
    shx.exec(`dpkg-deb -R ${this.pbPackage.path}${this.pbPackage.name}_${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion}_${this.pbPackage.linuxArch}.deb ${this.pbPackage.tempDir}`)
    shx.exec(`cd ${this.pbPackage.tempDir}`)
    shx.exec('dh_make -sc lgpl2 -e piero.proietti@gmail.com --createorig')
    shx.exec('cd ..')
  }

  /**
   * 
   */
  makeScripts() {
    shx.exec(`cp ./perrisbrewery/scripts/* ${this.pbPackage.tempDir}/DEBIAN`)
  }

  /**
   * makeControl
   */
  makeControl() {
    const version = this.pbPackage.sourceVersion + '-' + this.pbPackage.buildVersion
    const template = fs.readFileSync('perrisbrewery/template/control.template', 'utf8')
    const view = {
      version: version,
      arch: this.pbPackage.linuxArch,
    }
    fs.writeFileSync(`${this.pbPackage.tempDir}/DEBIAN/control`, mustache.render(template, view))
  }

  /**
   *
   */
  close(pbPackage: IPackage) {
    this.pbPackage = pbPackage
    shx.exec(`dpkg-deb --build ${this.pbPackage.tempDir}`)
    // shx.exec(`rm ${this.pbPackage.tempDir} -rf`)
  }
}
