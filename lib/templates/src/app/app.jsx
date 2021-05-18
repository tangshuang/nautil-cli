import { createApp, Navigation, createAsyncComponent } from 'nautil'

const Home = createAsyncComponent(() => import('./modules/home/home'))

const navigation = new Navigation({
  // mode will be ignored in native
  mode: 'history',
  routes: [
    {
      name: 'home',
      path: '/home',
      component: Home,
    },
  ],
  defaultRoute: 'home',
  notFound: () => 'Not Found',
})

export default createApp({
  navigation,
})
