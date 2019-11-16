import '../dom/index.less'

import { hydrate } from 'nautil/ssr-client'
import App from '../app/app.jsx'

hydrate('#app', App)
