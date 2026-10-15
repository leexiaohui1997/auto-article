import chalk from 'chalk'
import dayjs from 'dayjs'

enum LogType {
  FUNC,
  TASK_BEGIN,
  TASK_FINISH,
  INFO,
  BOLD,
  WARN,
  ERROR,
  SUCCESS,
}

function getLogMethod(type: LogType) {
  switch (type) {
    case LogType.WARN:
      return console.warn.bind(console)
    case LogType.ERROR:
      return console.error.bind(console)
    default:
      return console.log.bind(console)
  }
}

function getLogColor(type: LogType) {
  switch (type) {
    case LogType.TASK_BEGIN:
    case LogType.TASK_FINISH:
      return chalk.blue.bind(chalk)
    case LogType.FUNC:
      return chalk.cyan.bind(chalk)
    case LogType.BOLD:
      return chalk.white.bind(chalk)
    case LogType.WARN:
      return chalk.yellow.bind(chalk)
    case LogType.ERROR:
      return chalk.red.bind(chalk)
    case LogType.SUCCESS:
      return chalk.green.bind(chalk)
    default:
      return chalk.gray.bind(chalk)
  }
}

function getLogPrefix(type: LogType) {
  switch (type) {
    case LogType.TASK_BEGIN:
      return `[任务开始 ${dayjs().format('HH:mm:ss.SSS')}]`
    case LogType.TASK_FINISH:
      return `[任务结束 ${dayjs().format('HH:mm:ss.SSS')}]`
    case LogType.WARN:
      return '⚠'
    case LogType.ERROR:
      return '✗'
    case LogType.SUCCESS:
      return '✓'
    default:
      return ''
  }
}

function createOutput(type: LogType) {
  const method = getLogMethod(type)
  const color = getLogColor(type)
  const prefix = getLogPrefix(type)
  return (content: string = '') => {
    method(color(prefix ? `${prefix} ${content}` : content))
  }
}

export const info = createOutput(LogType.INFO)
export const func = createOutput(LogType.FUNC)
export const bold = createOutput(LogType.BOLD)
export const warn = createOutput(LogType.WARN)
export const error = createOutput(LogType.ERROR)
export const success = createOutput(LogType.SUCCESS)

export const taskBegin = createOutput(LogType.TASK_BEGIN)
export const taskFinish = createOutput(LogType.TASK_FINISH)
