/* eslint-disable valid-jsdoc */
/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import pjson = require('pjson')
import chalk = require('chalk')
import clear = require('clear')
import figlet = require('figlet')
import shx = require ('shelljs')
import cfonts = require('cfonts')
import Distro from './distro'
import { IRemix } from '../interfaces'

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {
   static versionLike(): string {
      const remix = {} as IRemix
      const distro = new Distro(remix)
      return distro.versionLike
   }
      
   /**
 * machineArch
 * arm-efi, arm64-efi,
 * grub-mkimage -O aarch64-efi -m memdisk -o bootx64.efi -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux
unknown target format aarch64-efi
 * @returns arch
 */
   static machineArch(): string {
      let arch = ''
      if (process.arch === 'x64') {
         arch = 'amd64'
      } else if (process.arch === 'ia32') {
         arch = 'i386'
         // ma, se è installato node386 come in rasberry-desktop...
         if (shx.exec('uname -m', { silent: true }).stdout.trim() === 'x86_64') {
            arch = 'amd64'
         }

      } else if (process.arch === 'arm64') {
         arch = 'arm64'
      } else if (process.arch === 'arm') {
         arch = 'armel'
      }
      return arch
   }

   /**
    * machineUEFI
    * @returns machineArch
    */
   static machineUEFI(): string {
      // grub-mkimage vuole: i386-efi, x86_64-efi, arm-efi, arm64-efi,
      let machineArch = this.machineArch()
      if (machineArch === 'amd64') {
         machineArch = 'x86_64'
      } else if (machineArch === 'armel') {
         machineArch = 'arm'
      }
      return machineArch + '-efi'
   }

   static titles(command = '') {
      console.clear()
      cfonts.say('Perri\'s brewery', { font: 'simple' })
      console.log(chalk.bgGreen.whiteBright('      ' + pjson.name + '      ') +
         chalk.bgWhite.blue(" Perri's Brewery edition ") +
         chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       '))
      console.log('command: ' + chalk.bgBlack.white(command) + '\n')
   }

}