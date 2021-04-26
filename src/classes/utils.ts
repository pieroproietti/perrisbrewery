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

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {

   /**
    * titles
    * Penguin's are gettings alive!
    */
   titles(command = ''): void {
      clear()
      console.log(chalk.cyan(figlet.textSync('Perri\'s brewery')))
      console.log(chalk.bgGreen.white('   ' + pjson.name + '   ') + chalk.bgWhite.blue(" Perri's Brewery edition ") + chalk.bgRed.whiteBright('    ver. ' + pjson.version + '   '))
   }
}