import { register } from 'nautil/native'
import App from '../app/app.jsx'
import { SafeAreaView } from 'react-native'

function NativeApp() {
  return <SafeAreaView>
    <App />
  </SafeAreaView>
}

register('@@APP_NAME@@', NativeApp)
