// you may not import React, nautil-cli will help you to import automaticly
import { Component, Section } from 'nautil'

// import controller
import { HomeController } from './home.controller'

// import css modules, nautil-cli will help you to export locals as a mapping
import HomeCss from './home.css'

export class Home extends Component {
  // import css modules to static css, so that you can use this.css to get css rules as scoped css
  static css = HomeCss

  // initialize controller so that you can use components which defined on it
  controller = new HomeController()

  render() {
    // use components defined in controller
    const { Header, Shop } = this.controller

    return (
      // use css rules on this.css
      // NOTICE: don't use css in controller components, the components in controller are only for interaction, not for layout and styling
      <Section stylesheet={[this.css.homeContainer]}>
        <Header stylesheet={[this.css.homeHeader]} />
        <Shop stylesheet={[this.css.homeShop]} />
      </Section>
    )
  }
}
