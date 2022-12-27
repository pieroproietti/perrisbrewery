
import { Command, Flags } from "@oclif/core"
import fs, { utimes } from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Utils from '../classes/utils'
import Dir from '../classes/dir'
import Dpkg from '../classes/dpkg'
import Converter from '../classes/converter'
import { IPackage } from '../interfaces'
import { exec } from '../lib/utils'

/**
 * 
 */
export default class Deb extends Command {
    static description = 'add preinst, postinst, prerm, postrm scripts and manPages to .deb'

    static flags = {
        verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
        help: Flags.help({ char: 'h' }),
        mantain: Flags.boolean({ char: 'm' }),
    }

    static args = [{ name: 'pathSource' }]

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Deb)

        const verbose = flags.verbose
        const echo = Utils.setEcho(verbose)


        Utils.titles(this.id + ' ' + this.argv)

        let pbPackage = {} as IPackage

        const here = process.cwd() + '/'
        let pathSource = here
        if (args.pathSource !== undefined) {
            if (pathSource.substring(pathSource.length, -1) !== '/') {
                pathSource = args.pathSource + '/'
            } else {
                pathSource = args.pathSource
            }
        }

        if (!fs.existsSync(`${here}/perrisbrewery`)) {
            fs.mkdirSync(`${here}/perrisbrewery`)
            await exec(`cp -r ${path.resolve(__dirname, `../perrisbrewery/template`)} ${here}/perrisbrewery`, echo)
            await exec(`cp -r ${path.resolve(__dirname, `../perrisbrewery/scripts`)} ${here}/perrisbrewery`, echo)
            console.log('perrisbrewery dir created in: ' + pathSource)
            console.log('Edit configuration in template e scripts. Include /perribrewery/workdir in your .gitignore.')
            console.log('After sudo npm run deb (build deb package with oclif')
            console.log('Finally run pb to rebuild your packages with manual, scripts, etc')
            process.exit(0)
        }

        /**
         * remove workdir if exist and create a new one
         */
        if (fs.existsSync(`${here}/perrisbrewery/workdir`)) {
            await exec(`rm ${here}/perrisbrewery/workdir -rf`, echo)
        }
        await exec(`mkdir ${here}/perrisbrewery/workdir`, echo)
        await exec(`touch ${here}/perrisbrewery/workdir/.gitkeep`, echo)

        this.log('-pathSource: ' + pathSource)

        const dpkg = new Dpkg()
        const dir = new Dir()
        const packagesNames = await dir.analyze(pathSource, verbose)
        this.log('-packagesNames: ' + packagesNames)

        /**
         * inizio il lood fra  i pacchetti
         */
        const converter = new Converter(pathSource + '/README.md')

        for (const packageName of packagesNames) {
            this.log('- package: ' + packageName)

            pbPackage = await dpkg.analyze(pathSource + 'dist/deb/' + packageName, verbose)
            fs.writeFileSync('pb.yaml', yaml.dump(pbPackage), 'utf-8')

            /**
             * unpack
             */
            await dpkg.unpack(verbose)

            // insert script and control
            await dpkg.makeScripts(verbose)
            dpkg.makeControl(verbose)

            // create md, man and html from README.md
            await converter.readme2md(verbose)
            await converter.md2man(verbose)
            await converter.md2html(verbose)

            // pack in deb
            await dpkg.pack(pbPackage, verbose)

            // remove tempDir
            if (!flags.mantain) {
                await exec(`rm ${pbPackage.tempDir} -rf`, echo)
            }
        }
    }
}

