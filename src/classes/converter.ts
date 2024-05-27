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
  async readme2md(pbPackage: IPackage, verbose = false) {

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
    const tempMd = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.md'
    const template = fs.readFileSync('perrisbrewery/template/man.template.md', 'utf8')

    const sourceVersion = pbPackage.sourceVersion
    let linuxVersion = 'linux-x32'
    if (pbPackage.linuxArch === 'amd64') {
      linuxVersion = 'linux-x64'
    } else if (pbPackage.linuxArch === 'arm64') {
      linuxVersion = 'linux-arm64'
    } else if (pbPackage.linuxArch === 'armel') {
      linuxVersion = 'linux-arm'
    }
    const nodeVersion = pbPackage.nodeVersion

    const view = {
      toc: toc,
      usage: usage,
      commands: commands,
      sourceVersion: sourceVersion,
      linuxVersion: linuxVersion,
      nodeVersion: nodeVersion
    }
    fs.writeFileSync(tempMd, mustache.render(template, view), 'utf8')

  }

  /**
   * md2man
   */
  async md2man(pbPackage: IPackage, verbose = false) {
    // const { read, write } = await import('to-vfile')
    // const { unified } = await import('unified')
    // const { default: remarkMan } = await import('remark-man')
    // const { default: remarkParse } = await import('remark-parse')
    const echo = Utils.setEcho(verbose)

    if (verbose) {
      console.log('Converter.md2man()')
    }

    const source = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.md'
    let dirname = pbPackage.destDir + '/DEBIAN/'
    const basename = pbPackage.name
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
    if (pbPackage.name === 'eggs') {
      pbPackage.name = 'penguins-eggs'
    }
    await exec(`cp ${manCompressed} ${pbPackage.destDir}/usr/lib/${pbPackage.name}/manpages/doc/man/${basename}.1.gz`, echo)
  }

  /**
   * md2html
   */
  async md2html(pbPackage: IPackage, verbose = false) {
    // const { read, write } = await import('to-vfile')
    // const { default: remarkParse } = await import('remark-parse')
    // const { default: remarkRehype } = await import('remark-rehype')
    // const { default: rehypeDocument } = await import('rehype-document')
    // const { default: rehypeFormat } = await import('rehype-format')
    // const { default: rehypeStringify } = await import('rehype-stringify')
    const echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('Converter.md2html()')
    }

    const source = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.md'
    let dirname = pbPackage.destDir + '/usr/lib/' + pbPackage.name + '/manpages/doc/man/'
    if (pbPackage.name === 'eggs') {
      dirname = pbPackage.destDir + '/usr/lib/penguins-eggs/manpages/doc/man/'
    }
    const basename = pbPackage.name
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
    //await exec(`mv ${dirname}${basename}${extname} ${dirname}${basename}.1.html`, echo)
  }
}
