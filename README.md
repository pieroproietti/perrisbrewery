
# Perri's Brewery

Prende come input la directory di un progetto oclif (eggs) e introduce nel pacchetto debian realizzato con @oclif/cli-dev gli script di pre e post installazione, di pre e post rimozione ed il manuale man.

Al momento - per gioventù - è utilizzabile solo dall'autore.

# Usage
<!-- usage -->
```sh-session
$ npm install -g perrisbrewery
$ pb COMMAND
running command...
$ pb (--version|-v)
perrisbrewery/0.5.4 linux-x64 node-v16.15.0
$ pb --help [COMMAND]
USAGE
  $ pb COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`pb autocomplete [SHELL]`](#pb-autocomplete-shell)
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

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.2.0/src/commands/autocomplete/index.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `pb version`

```
USAGE
  $ pb version
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.0.4/src/commands/version.ts)_
<!-- commandsstop -->

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations
There is [user's manual](https://penguins-eggs.net/book/) and same other documentation in [documents folder](./documents) of this repository.

Contact me via [gitter](https://gitter.im/penguins-eggs-1/community), or open an [issue](https://github.com/pieroproietti/penguins-eggs/issues) on github.

* penguin's eggs site: [penguin's eggs](https://penguins-eggs.net)
* facebook personal: [Piero Proietti](https://www.facebook.com/thewind61)
* facebook group:  [Penguin's Eggs](https://www.facebook.com/groups/128861437762355/)
* facebook page:  [Penguin's Eggs](https://www.facebook.com/penguinseggs)
* mail: piero.proietti@gmail.com


## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
