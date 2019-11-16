import { register } from 'nautil/react-native'
import App from '../app/app.jsx'
import { SafeAreaView } from 'react-native'

function NativeApp() {
  return <SafeAreaView>
    <App />
  </SafeAreaView>
}

register(process.env.APP_NAME, NativeApp)
