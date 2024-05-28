/**
* converter
*/
import fs from 'fs'
import mustache from 'mustache'
import { IPackage } from '../interfaces'

import unified from 'unified'
import { read, write } from 'to-vfile'
import remarkMan from 'remark-man'
import remarkParse from 'remark-parse'

import remarkRehype from 'remark-rehype'
import rehypeDocument from 'rehype-document'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'
import { exec } from '../lib/utils'
import Utils from './utils'

/**
 * class Man
 */
export default class Converter {
  readmeName = ''
  constructor(readmeName = './README.md') {
    this.readmeName = readmeName
  }

  /**
   * readme2md
   */
  async readme2md(destDir: string, packageName: string, packageVersion: string, manName: string, verbose = false) {

    if (verbose) {
      console.log('Converter.readme2md()')
    }
    const readme = fs.readFileSync(this.readmeName, 'utf-8').split('\n')

    /**
     * Sezioni: toc, usage, commands
     */
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
        if (!readme[i].includes('See code:')) {
          commands += readme[i] + '\n'
        }
      }
    }
    toc = ''
    usage = usage.toString()

    /**
    * Creazione della versione markdown
    */
    const template = fs.readFileSync('perrisbrewery/template/man.template.md', 'utf8')

    const sourceVersion = packageVersion
    const linuxVersion = ''

    const view = {
      toc: toc,
      usage: usage,
      commands: commands,
      sourceVersion: packageVersion,
      linuxVersion: linuxVersion,
      nodeVersion: process.version, 
    }
    const tempMd = destDir + '/DEBIAN/' + manName + '.md'
    fs.writeFileSync(tempMd, mustache.render(template, view), 'utf8')
    console.log('File ' + tempMd + ' created')
  }

  /**
   * md2man
   */
  async md2man(destDir: string, packageName: string, packageVersion: string, manName: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    if (verbose) {
      console.log('Converter.md2man()')
    }

    const source = destDir + '/DEBIAN/' + manName + '.md'
    let dirname = destDir + '/DEBIAN/'
    const basename = manName
    const extname = '.roll'

    const file = await unified()
      .use(remarkParse)
      .use(remarkMan)
      .process(await read(source))

    file.dirname = dirname
    file.basename = basename
    file.extname = extname
    await write(file)

    const man = dirname + basename + extname
    const manCompressed = dirname + basename + '.roll.gz'
    await exec('gzip -9 ' + man, echo)
    await exec(`cp ${manCompressed} ${destDir}/usr/lib/${packageName}/manpages/doc/man/${basename}.1.gz`, echo)

  }

  /**
   * md2html
   */
  async md2html(destDir: string, packageName: string, packageVersion: string, manName: string, verbose = false) {
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('Converter.md2html()')
    }

    const source = destDir + '/DEBIAN/' + manName + '.md'
    let dirname = destDir + '/usr/lib/' + packageName + '/manpages/doc/man/'
    const basename = manName
    const extname = '.html'

    const file = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeDocument)
      .use(rehypeFormat)
      .use(rehypeStringify)
      .process(await read(source))

    file.dirname = dirname
    file.basename = basename
    file.extname = extname
    await write(file)
  }
}
