# Perri's Brewery
Compatible with oclif 4.x, build debian packages from dist, create manpage from README.md and include prerm, postrm, preinst and postinst scripts for Debian package.

# Usage

Add the package to your package.json as devDependencies
```
  "perrisbrewery": "^9.7.12*,
```

and create a script deb:

```
  "deb": "tsc -p . && pb deb",
```

Create a config dir `perrisbrewery` inside the project followind the sample, 
then use the script deb with your favourite package manager, mine is pnpm:

```
pnpm deb
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`pb deb [PATHSOURCE]`](#pb-deb-pathsource)
* [`pb help [COMMAND]`](#pb-help-command)
* [`pb tarballs [TARBALLS]`](#pb-tarballs-tarballs)
* [`pb version`](#pb-version)

## `pb deb [PATHSOURCE]`

Pack CLI into debian package.

```
USAGE
  $ pb deb [PATHSOURCE] [-h] [-a] [-r <value>] [-M] [-v]

ARGUMENTS
  [PATHSOURCE]  pathSource

FLAGS
  -M, --manpages         refresh manpages on the sources
  -a, --all              all architectures
  -h, --help             Show CLI help.
  -r, --release=<value>  release
  -v, --verbose          verbose

DESCRIPTION
  Pack CLI into debian package.

  Create a deb package from your npm package
```

_See code: [src/commands/deb.ts](https://github.com/pieroproietti/perrisbrewery/blob/v26.1.3/src/commands/deb.ts)_

## `pb help [COMMAND]`

Display help for pb.

```
USAGE
  $ pb help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for pb.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.36/src/commands/help.ts)_

## `pb tarballs [TARBALLS]`

rename tarballs with release.

```
USAGE
  $ pb tarballs [TARBALLS] [-h] [-r <value>] [-v]

ARGUMENTS
  [TARBALLS]  pathTarballs

FLAGS
  -h, --help             Show CLI help.
  -r, --release=<value>  release
  -v, --verbose          verbose

DESCRIPTION
  rename tarballs with release.

  Tarballs
```

_See code: [src/commands/tarballs.ts](https://github.com/pieroproietti/perrisbrewery/blob/v26.1.3/src/commands/tarballs.ts)_

## `pb version`

```
USAGE
  $ pb version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v2.2.36/src/commands/version.ts)_
<!-- commandsstop -->

# More informations
You can contact me by [mail](mailto://pieroproietti@gmail.com) or follow me on 
[blog](https://penguins-eggs.net), 
[facebook](https://www.facebook.com/groups/128861437762355/), 
[github](https://github.com/pieroproietti/penguins-krill), 
[jtsi](https://meet.jit.si/PenguinsEggsMeeting), 
[reddit](https://www.reddit.com/user/Artisan61), 
[telegram](https://t.me/penguins_eggs), 
[twitter](https://twitter.com/pieroproietti).

# Copyright and licenses
Copyright (c) 2017, 2025 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
