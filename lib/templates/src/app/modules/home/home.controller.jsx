import { Controller, Section, Text, useEffect } from 'nautil'
import { HomeModel } from './home.model'
import { HomeService } from './home.service'

export class HomeController extends Controller {
  // use HomeModel to static home, so that you can call this.home as an instance of HomeModel in this controller
  static model = HomeModel
  static service = HomeService

  useLog(message) {
    // record a log to know the component is called
    useEffect(() => {
      this.service.writeLog(message)
    }, [])
  }

  Header(props) {
    this.useLog('Home.Header is called.')

    return (
      <Section {...props}>
        <Text>Home</Text>
      </Section>
    )
  }

  Shop(props) {
    this.useLog('Home.Shop is called.')

    // use information of HomeModel
    const { shop_name, shop_description } = this.model.shop
    return (
      <Section {...props}>
        <Text>Shop Name: "{shop_name}"</Text>
        <Text>Shop Description: "{shop_description}"</Text>
      </Section>
    )
  }
}
