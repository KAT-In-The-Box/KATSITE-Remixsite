import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'

import { assertProductionConfig, config } from './app/config.ts'
import { closeDb, connectDb } from './app/data/mongo.ts'
import { router } from './app/router.ts'

// Validate configuration and connect to MongoDB before accepting traffic.
assertProductionConfig()
await connectDb()

const hmrProxyPort = process.env.HMR_PROXY_PORT
  ? Number.parseInt(process.env.HMR_PROXY_PORT, 10)
  : null
const isHmr = process.env.REMIX_NODE_HMR === '1'

const server = http.createServer(
  createRequestListener(router.fetch, { trustProxy: isHmr || config.trustProxy }),
)

server.listen(config.port, () => {
  if (isHmr) {
    import('remix/node-hmr/runtime').then((nodeHmr) => nodeHmr.emitServerReady())
  }

  console.log(`Server listening on http://localhost:${hmrProxyPort ?? config.port}`)
})

let shuttingDown = false

function shutdown() {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  server.close(() => {
    closeDb().finally(() => process.exit(0))
  })
  server.closeAllConnections()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
