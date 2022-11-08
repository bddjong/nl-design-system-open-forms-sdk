import React from 'react';
import ReactDOM from "react-dom";
import {Switch, Route} from 'react-router-dom';

import Form from 'components/Form';
import { Layout, LayoutRow } from 'components/Layout';
import ManageAppointment from 'components/appointments/ManageAppointment';

import LanguageSelection from "components/LanguageSelection";


const LanguageSwitcher = ({ languageSelectorTarget }) => (
  languageSelectorTarget ? (
    ReactDOM.createPortal(<LanguageSelection />, languageSelectorTarget)
  ) : (
    <LayoutRow>
      <LanguageSelection />
    </LayoutRow>
  )
);

/*
Top level router - routing between an actual form or supporting screens.
 */
const App = ({ languageSelectorTarget, ...props }) => {
  return (
    <Layout>
      <LanguageSwitcher languageSelectorTarget={languageSelectorTarget} />
      <LayoutRow>
        <Switch>
          {/* Anything dealing with appointments gets routed to it's own sub-router */}
          <Route path="/afspraak*" component={ManageAppointment} />

          {/* All the rest goes to the actual form flow */}
          <Route path="/">
            <Form {...props} />
          </Route>
        </Switch>
      </LayoutRow>
    </Layout>
  );
};

export default App;
