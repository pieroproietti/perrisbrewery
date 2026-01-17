/* eslint-disable valid-jsdoc */
/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'



import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pjson = require('../../package.json')

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {
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
    console.log(chalk.bgGreen.whiteBright('      ' + pjson.name + '      ')
      + chalk.bgWhite.blue('  man & scripts in .deb  ')
      + chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       '))
    console.log('command: ' + chalk.bgBlack.white(command) + '\n')
  }
}
