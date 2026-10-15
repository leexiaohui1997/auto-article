import { Command } from 'commander'

import { addShareLink } from '../core/share.js'
import { runTask } from '../core/task.js'

export default function registDBCommands(program: Command) {
  program
    .command('add-share')
    .description('添加分享链接')
    .argument('<url>', '分享链接')
    .action(async (url: string) => {
      runTask(async () => {
        await addShareLink(url)
      })
    })
}
