import { createHttp } from 'nautil/ssr'
import App from '../app/app.jsx'

import express from 'express'
import path from 'path'

const app = express()
const http = createHttp(App)

app.use(express.static(path.resolve(__dirname, 'public')))
app.use('*', http)

app.listen(9000)
