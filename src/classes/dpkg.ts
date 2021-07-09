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
    let depends = 'squashfs-tools'
    depends += ', xorriso'
    depends += ', live-boot'
    depends += ', live-boot-initramfs-tools'
    depends += ', dpkg-dev'
    // depends +=', syslinux-common'
    depends += ', isolinux'
    depends += ', net-tools'
    depends += ', rsync'
    depends += ', whois'
    depends += ', dosfstools'
    depends += ', parted'
    depends += ', whiptail'
    depends += ', xdg-user-dirs'
    depends += ', bash-completion'
    depends += ', cryptsetup'

    if (Utils.machineArch() === 'amd64' || Utils.machineArch() === 'i386') {
      depends += ', syslinux'
    } else if (Utils.machineArch() === 'armel' || Utils.machineArch() === 'arm64') {
      depends += ', syslinux-efi'
    }

    // Aggiungo pacchetti per versione in eggs è su pacman
    const versionLike = Utils.versionLike()

    if ((versionLike === 'buster') || (versionLike === 'beowulf') || (versionLike === 'bullseye') || (versionLike === 'stretch') || (versionLike === 'jessie')) {
      depends += ', live-config'
    } else if ((versionLike === 'focal')) {
      depends += ', live-config'
    }

    // systemd / sysvinit
    const verbose = false
    const init: string = shx.exec('ps --no-headers -o comm 1', { silent: !verbose }).trim()
    let config = ''
    if (init === 'systemd') {
      if (versionLike === 'bionic') {
        config = ', open-infrastructure-system-config'
      } else {
        config = ', live-config-systemd'
      }
    } else {
      config = ', live-config-sysvinit'
    }
    depends += config

    // depends = 
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
