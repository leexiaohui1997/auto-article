export default abstract class AiEngineBase {
  abstract ensureLogin(): Promise<void>
  abstract createContext(): Promise<void>
  abstract input(content: string): Promise<void>
  abstract send(): Promise<void>
  abstract getLastAnswer(): Promise<string>
}
