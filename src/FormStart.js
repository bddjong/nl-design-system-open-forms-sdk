import React from 'react';
import PropTypes from 'prop-types';

import digidImg from './img/digid.png';
import Card from './Card';
import { Toolbar, ToolbarList } from './Toolbar';
import Button from './Button';
import Body from './Body';


/**
 * Form start screen.
 *
 * This is shown when the form is initially loaded and provides the explicit user
 * action to start the form, or (in the future) present the login button (DigiD,
 * eHerkenning...)
 */
const FormStart = ({ form, onFormStart }) => (
  <Card title={form.name}>

    <Body modifiers={['compact']}>Log in or start the form anonymously.</Body>

    <Toolbar modifiers={['start']}>
      <ToolbarList>
        <Button variant="primary" component="a" href="#" onClick={onFormStart}>Formulier starten</Button>
        <Button variant="primary" component="a" href="#" onClick={e => e.preventDefault() || alert('TODO')}>
          Inloggen met DigiD
        </Button>
      </ToolbarList>

      <ToolbarList>
        <Button variant="image" disabled component="input" type="image" src={digidImg} />
      </ToolbarList>
    </Toolbar>

  </Card>
);

FormStart.propTypes = {
  form: PropTypes.shape({
    uuid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    loginRequired: PropTypes.bool.isRequired,
    product: PropTypes.object,
    slug: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    steps: PropTypes.arrayOf(PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      formDefinition: PropTypes.string.isRequired,
      index: PropTypes.number.isRequired,
      url: PropTypes.string.isRequired,
    })).isRequired,
  }).isRequired,
  onFormStart: PropTypes.func.isRequired,
};


export default FormStart;
