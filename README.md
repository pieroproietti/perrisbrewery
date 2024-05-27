
# Perri's Brewery
## version 9.5.9
It parses the debian packages created with [oclif](https://www.npmjs.com/package/oclif) and adds the pre- and post-installation/removal scripts to them and generates the man manual page.

## version 9.7.8
Compatible with oclif 4.x, build debian packages from dist, create manpage from README.md and include prerm, postrm, preinst and postinst scripts for Debian package.

# Usage
<!-- usage -->
```sh-session
$ npm install -g perrisbrewery
$ pb COMMAND
running command...
$ pb (--version|-v)
perrisbrewery/9.3.14 linux-x64 node-v16.19.0
$ pb --help [COMMAND]
USAGE
  $ pb COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`pb autocomplete [SHELL]`](#pb-autocomplete-shell)
* [`pb deb [PATHSOURCE]`](#pb-deb-pathsource)
* [`pb help [COMMAND]`](#pb-help-command)
* [`pb version`](#pb-version)

## `pb autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ pb autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ pb autocomplete

  $ pb autocomplete bash

  $ pb autocomplete zsh

  $ pb autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.3.8/src/commands/autocomplete/index.ts)_

## `pb deb [PATHSOURCE]`

add preinst, postinst, prerm, postrm scripts and manPages to .deb

```
USAGE
  $ pb deb [PATHSOURCE] [-v] [-h] [-m]

FLAGS
  -h, --help     Show CLI help.
  -m, --mantain
  -v, --verbose  verbose

DESCRIPTION
  add preinst, postinst, prerm, postrm scripts and manPages to .deb
```

_See code: [lib/commands/deb.js](https://github.com/pieroproietti/perrisbrewery/blob/v9.3.14/lib/commands/deb.js)_

## `pb help [COMMAND]`

Display help for pb.

```
USAGE
  $ pb help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for pb.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.20/src/commands/help.ts)_

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

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.1.3/src/commands/version.ts)_
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
Copyright (c) 2017, 2023 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
