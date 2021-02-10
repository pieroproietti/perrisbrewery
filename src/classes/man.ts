/* eslint-disable node/no-extraneous-require */
/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable no-console */
/**
 * man
 */

import fs = require('fs')
import mustache = require('mustache')
import yaml = require('js-yaml')

import {IPackage} from '../interfaces'

/**
 *
 * @param removeTriploApice
 */
// eslint-disable-next-line complexity
export default class Man {
  readmeName = ''

  constructor(readmeName = './README.md') {
    this.readmeName = readmeName
  }

  createMd() {
    const readme = fs.readFileSync(this.readmeName, 'utf-8').split('\n')

    if (fs.existsSync('pb.yaml')) {
      let pbPackage = {} as IPackage
      pbPackage = yaml.load(fs.readFileSync('pb.yaml', 'utf-8')) as IPackage

      let toc = ''
      const tocStart = '<!-- toc -->'
      let isToc = false
      const tocStop = '<!-- tocstop -->'

      let usage = ''
      const usageStart = '<!-- usage -->'
      let isUsage = false
      const usageStop = '<!-- usagestop -->'

      let commands = ''
      const commandsStart = '<!-- commands -->'
      let isCommands = false
      const commandsStop = '<!-- commandsstop -->'
      for (let i = 0; i < readme.length; i++) {
        let isComment = false
        if (readme[i].includes('<!--')) {
          isComment = false

          if (readme[i].includes(tocStart)) {
            isToc = true
          }
          if (readme[i].includes(tocStop)) {
            isToc = false
          }

          if (readme[i].includes(usageStart)) {
            isUsage = true
          }
          if (readme[i].includes(usageStop)) {
            isUsage = false
          }

          if (readme[i].includes(commandsStart)) {
            isCommands = true
          }
          if (readme[i].includes(commandsStop)) {
            isCommands = false
          }
        }

        // Aggiunge la linea alla sezione
        if (isToc && !isComment) {
          toc += readme[i] + '\n'
        }
        if (isUsage && !isComment) {
          usage += readme[i] + '\n'
        }
        if (isCommands && !isComment) {
          commands += readme[i] + '\n'
        }
      }
      toc = ''

      /**
        * Creazione della versione markdown di man
        */
      const tempMd = pbPackage.tempDir + '/DEBIAN/' + pbPackage.name + '.md'
      const template = fs.readFileSync('perrisbrewery/template/man.template.md', 'utf8')
      const view = {
        toc: toc,
        usage: usage,
        commands: commands,
        version: pbPackage.version,
        linuxVersion: pbPackage.linuxArch,
        nodeVersion: pbPackage.nodeVersion,
      }
      fs.writeFileSync(tempMd, mustache.render(template, view), 'utf8')
    }
  }

  convertToMan() {
    if (fs.existsSync('pb.yaml')) {
      let pbPackage = {} as IPackage
      pbPackage = yaml.load(fs.readFileSync('pb.yaml', 'utf8')) as IPackage

      const tempMd = pbPackage.tempDir + '/DEBIAN/' + pbPackage.name + '.md'

      const vfile = require('to-vfile')

      const unified = require('unified')

      const markdown = require('remark-parse')

      const gfm = require('remark-gfm')

      const man = require('remark-man')

      const optMan = {
        name: 'eggs',
        section: '1',
        description: 'eggs manpage',
        version: pbPackage.version,
      }

      unified()
      .use(markdown)
      .use(gfm, {singletilde: false, tripletildes: false})
      .use(man, optMan)
      .process(vfile.readSync(tempMd), function (err: any, file: any) {
        if (err) throw err
        file.extname = '.1'
        vfile.writeSync(file)
      })
    }
  }
}

