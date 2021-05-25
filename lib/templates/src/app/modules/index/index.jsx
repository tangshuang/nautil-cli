import { Component, Section, Text, Image } from 'nautil'
import LogoSrc from './nautil.png'
import * as indexCss from './index.css'

export default class Index extends Component {
  static css = indexCss

  render() {
    return (
      <Section stylesheet={this.css.indexContainer}>
        <Section stylesheet={this.css.indexLogo}><Image source={LogoSrc} /></Section>
        <Section stylesheet={this.css.indexTitle}><Text>Nautil</Text></Section>
      </Section>
    )
  }
}
