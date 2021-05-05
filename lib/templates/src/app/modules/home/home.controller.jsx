import { Controller, Section, Text } from 'nautil'
import { HomeModel } from './home.model'

export class HomeController extends Controller {
  // use HomeModel to static home, so that you can call this.home as an instance of HomeModel in this controller
  static home = HomeModel

  Header(props) {
    return (
      <Section {...props}>
        <Text>Home</Text>
      </Section>
    )
  }

  Shop(props) {
    // use information of HomeModel
    const { shop_name, shop_description } = this.home
    return (
      <Section {...props}>
        <Text>Shop: {shop_name} {shop_description}</Text>
      </Section>
    )
  }
}
