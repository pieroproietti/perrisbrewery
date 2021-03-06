eggs(1) -- A reproductive system for penguins
=============================================

{{toc}}

# SYNOPSIS

```
$ npm install -g penguins-eggs
$ eggs COMMAND
running command...
$ eggs (-v|--version|version)
penguins-eggs/{{version}} {{linuxVersion}} {{nodeVersion}}}
$ eggs --help [COMMAND]

USAGE
$ eggs COMMAND
```

Most of the commands of eggs need sudo, but there are exceptions for export, info and mom.

examples:

```
sudo eggs init
sudo eggs produce
sudo eggs kill
```

There are too, two interactive helpers:

```
eggs mom
sudo eggs dad
```

Help yorself signing in the forum or in facebook group page or asking me.


# DESCRIPTION

eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso image.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb key to boot your system. You can easily install your live system with gui installer (calamares)  or eggs cli installer.

# COMMANDS

{{{commands}}}

# FILES
      /etc/penguins-eggs.d
        all eggs configurations are here

      /usr/local/share/penguins-eggs/exclude.list
        exclude.list rsync

      /usr/lib/penguins-eggs (deb package)
        here eggs is installed
      OR
      /usr/lib/node_modules/penguins-eggs/ (npm package)
        here eggs is installed


# TROUBLES
Different versions of eggs can have differents configurations files. This can lead to get errors.

A fast workaround for this trouble can be:

* download eggs
* remove eggs
* remove it's configurations
* reinstall new version
* run sudo eggs init

Here are the commands to do:

* **sudo eggs update** # select basket, choose the version and download it but not install!

* **sudo apt --purge eggs** # remove eggs

* **sudo rm /usr/penguins-eggs/ rf** # remove eggs

* **sudo rm /etc/penguins-eggs.d -rf** # remove eggs configurations files

* **sudo dpkg -i /tmp/eggs_7.7.9-1_amd64.deb** # install eggs from downloaded package

* **sudo eggs init** # check prerequisites and generate configuration's files

## BUGS

Report problems o new ideas in: <https://github.com/pieroproietti/penguins-eggs/issues>

# RESOURCES AND DOCUMENTATION
Consult website to find  documentation, forum. There is a facebook gruop and page too.

* website: **https://penguins-eggs.net**
* gitHub repository: **https://github.com/pieroproietti/penguins-eggs**

# AUTHOR

Piero Proietti <piero.proietti@gmail.com>
