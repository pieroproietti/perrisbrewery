/* eslint-disable valid-jsdoc */
/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import shx from 'shelljs'

const pjson = require('../../package.json')

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {

   /**
   * machineArch
   * arm-efi, arm64-efi,
   * grub-mkimage -O aarch64-efi -m memdisk -o bootx64.efi -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux
  unknown target format aarch64-efi
   * @returns arch
   */
   static machineArch(): string {
      let arch = process.arch
      let debArch = ''
      if (arch === 'x64') debArch='amd64'
      if (arch === 'ia32') debArch='i386'
      if (arch === 'arm') debArch='armel'
      if (arch === 'arm64') debArch='arm64'
      return debArch
   }


   static getPackageVersion(): string {
      return "9.7.8-1"
   }
   static getPackageName(): string {
      return "penguins-eggs"
   }
   static getPackageCmd(): string {
      return "eggs"
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

   /**
    * 
    * @param command 
    */
   static titles(command = '') {
      console.clear()
      // font: console, block, simpleBlock, simple, 3d, simple3d, chrome, huge, shade, slick, grid, pallet, tiny
      // cfonts.say('Perri\'s brewery', { font: 'tiny' })
      console.log('===========================')
      console.log('>>> P E R R I\'s brewery <<<')
      console.log('===========================')
      console.log(chalk.bgGreen.whiteBright('      ' + pjson.name + '      ') +
         chalk.bgWhite.blue("  man & scripts in .deb  ") +
         chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       '))
      console.log('command: ' + chalk.bgBlack.white(command) + '\n')
   }

   /**
   *
   * @param verbose
   */
   static setEcho(verbose = false): object {
      let echo = { echo: false, ignore: true }
      if (verbose) {
         echo = { echo: true, ignore: false }
      }
      return echo
   }
}