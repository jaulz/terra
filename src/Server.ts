import { Socket } from 'dgram'
import * as express from 'express'
import * as http from 'http'
import * as httpTerminator from 'http-terminator'
import { Server as SocketServer } from "socket.io"
import * as cors from 'cors'

type Options = {
  port: number
  log: (message: string) => void
  onMessage: (message: string) => void
  onStatusChange: (listening: boolean) => void
}

export default class Server {
  private app:express.Express|null = null

  private server:http.Server|null = null

  private io:SocketServer|null = null

  private terminator: httpTerminator.HttpTerminator|null = null

  private options:Options

  constructor(options: Options) {
    this.options= options
  }

  log(message:string) {
    this.options.log(message)
  }

  isListening() {
    return !!this.server
  }

  start() {
    if (this.server) {
      return
    }

      const app = express();

      app.use(express.json({ limit: '100mb' }));
      app.use(express.urlencoded({ limit: '100mb' }));
      app.use(cors())

      app.post('/', (req, res) => {
          this.io?.emit('log', req.body);
          this.options.onMessage(req.body)
          res.send({ success: true })
      })

      const server = app.listen(this.options.port, () => {
        this.log(`Terra server on http://localhost:${this.options.port}`)
    });

    const io = new SocketServer(server, {
      cors: {
          origin: "*",
          methods: ["GET", "POST"]
      }
  })

      this.terminator = httpTerminator.createHttpTerminator({
          server,
      });
      this.app = app
      this.server = server
      this.io = io
      this.options.onStatusChange(this.isListening())
  }

  stop() {
      if (this.terminator) {
        this.terminator.terminate();
      }

      if (this.server) {
        this.io?.close()
        this.io = null

        this.server.close()
      this.server = null
      
      this.app = null

      this.log(`Terra server stopped`)
    }

    this.options.onStatusChange(this.isListening())
  }
}