import { createApp, Navigation, createAsyncComponent } from 'nautil'

const Index = createAsyncComponent(() => import('./modules/index/index'))
const Home = createAsyncComponent(() => import('./modules/home/home'))

const navigation = new Navigation({
  mode: '/',
  routes: [
    {
      name: 'index',
      path: '/',
      component: Index,
    },
    {
      name: 'home',
      path: '/home',
      component: Home,
    },
  ],
  defaultRoute: 'index',
  notFound: () => 'Not Found',
})

export default createApp({
  navigation,
})
