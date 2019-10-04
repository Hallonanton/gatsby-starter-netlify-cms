import React, { Component } from 'react'
import styled from '@emotion/styled'

import SectionText from './SectionText'
import SectionNumber from './SectionNumber'
import SectionImage from './SectionImage'

/*==============================================================================
  # Styles
==============================================================================*/

const Wrapper = styled('div')`
  width: 100%;
  padding: 30px 0px;
  text-align: center;
`


/*==============================================================================
  # Component
==============================================================================*/

class Provider extends Component {

  render () {

    console.log( this.props.sections )

    return (
      <Wrapper>Provider</Wrapper>
    )
  }
}

export default Provider


