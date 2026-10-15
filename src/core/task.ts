import { getErrorMsg } from '../utils/common.js'
import { AppError } from '../utils/error.js'
import { error, taskBegin, taskFinish } from '../utils/logger.js'

export async function runTask(fn: () => unknown) {
  taskBegin()
  try {
    await fn()
  } catch (err) {
    process.exitCode = 1
    error(getErrorMsg(err))
    if (!(err instanceof AppError)) {
      throw err
    }
  } finally {
    taskFinish()
  }
}
