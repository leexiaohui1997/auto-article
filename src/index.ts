import './utils/env.js'
import { Command } from 'commander'

import registDBCommands from './commands/db.js'
import registMainCommand from './commands/main.js'
import { getPackageJson } from './utils/common.js'

const pkgJson = getPackageJson()
const PROGRAM_NAME = Object.keys(pkgJson.bin ?? {})[0] || pkgJson.name || 'auto-article'
const PROGRAM_VERSION = pkgJson.version || '0.0.1'
const PROGRAM_DESCRIPTION = pkgJson.description || ''

const program = new Command()
registDBCommands(program)
registMainCommand(program)

program.name(PROGRAM_NAME).version(PROGRAM_VERSION).description(PROGRAM_DESCRIPTION)
program.parseAsync(process.argv)
