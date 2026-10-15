import { Command } from 'commander'

import { runMain } from '../core/main.js'
import { runTask } from '../core/task.js'

export default function registMainCommand(program: Command) {
  program
    .command('main')
    .description('自动化管理文章创作与发布')
    .action(async () => {
      runTask(async () => {
        await runMain()
      })
    })
}
