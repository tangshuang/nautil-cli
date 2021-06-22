import { register } from 'nautil/native'
import App from '../app/app.jsx'
import { SafeAreaView, useColorScheme } from 'react-native'

function ViewPort() {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <App />
    </SafeAreaView>
  )
}

register('App', ViewPort)
