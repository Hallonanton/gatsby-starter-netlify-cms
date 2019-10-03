import React from 'react'
import PropTypes from 'prop-types'
import { SettingsPageTemplate } from '../../templates/settings-page'

const SettingsPagePreview = ({ entry, widgetFor }) => (
  <SettingsPageTemplate
    title={entry.getIn(['data', 'title'])}
    content={widgetFor('body')}
  />
)

SettingsPagePreview.propTypes = {
  entry: PropTypes.shape({
    getIn: PropTypes.func,
  }),
  widgetFor: PropTypes.func,
}

export default SettingsPagePreview
