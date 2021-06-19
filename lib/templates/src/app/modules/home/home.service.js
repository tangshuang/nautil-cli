import { Service } from 'nautil'

export class HomeService extends Service {
  constructor() {
    super()
    this.logs = []
    // 每10秒打印日志，并且清空列表
    setInterval(() => {
      console.log([...this.logs])
      this.logs.length = 0
    }, 10000)
  }
  writeLog(message) {
    this.logs.push({ time: Date.now(), message })
  }
  getLogs() {
    return this.logs
  }
}
