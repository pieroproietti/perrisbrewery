/* eslint-disable node/no-extraneous-require */
/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable no-console */
/**
 * rifacimento di makemain in ts
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
import yaml = require('js-yaml')

import { IPackage } from '../interfaces'

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

  create(removeTriploApice = false) {
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
          isComment = true

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

        // Aggiunge le linee
        if (isToc && !isComment) {
          toc += readme[i] + '\n'
        }
        if (isUsage && !isComment) {
          if (readme[i].includes('`')) {
            if (!readme[i].includes('```')) {
              // readme[i] = readme[i].replace('`', '')
              // readme[i] = readme[i].replace('`', '')
            }
          }
          usage += readme[i] + '\n'
        }
        if (isCommands && !isComment) {
          // if (!readme[i].includes('See code')) {
            if (readme[i].includes('`')) {
              if (!readme[i].includes('```')) {
                // Rimuove ` attorno ai comandi
                // readme[i] = readme[i].replace('`', '')
                // readme[i] = readme[i].replace('`', '')
              } else if (removeTriploApice) {
                // readme[i] = readme[i].replace('```', '')
              }
            }
            commands += readme[i] + '\n'
          // }
        }
      }
      toc = ''

      /**
        * Creazione della versione markdown per man
        */
      const tempMd = pbPackage.tempDir + '/DEBIAN/' + pbPackage.name + '.md'
      const destMan = pbPackage.tempDir + '/DEBIAN/'
      const template = fs.readFileSync('perrisbrewery/template/man.template.md', 'utf8')
      const view = {
        toc: toc,
        usage: usage,
        commands: commands,
        version: pbPackage.version,
        linuxVersion: pbPackage.linuxArch,
        nodeVersion: pbPackage.nodeVersion,
      }
      fs.writeFileSync(tempMd, mustache.render(template, view))

      // let cmd = 'ronn --roff --manual=\'eggs manual\' --organization=penguins-eggs.net --style=toc,80c ' + tempMd + ' --section 1 -o ' + destMan
      // shx.exec(cmd)

      // cmd = 'rm ' + tempMd
      // shx.exec(cmd)
      const vfile = require('to-vfile')
      const unified = require('unified')
      const markdown = require('remark-parse')
      const gfm = require('remark-gfm')
      const man = require('remark-man')

      const optMan = {
        name: 'uova',
        section: '1',
        description: 'uova e pulcini!',
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
