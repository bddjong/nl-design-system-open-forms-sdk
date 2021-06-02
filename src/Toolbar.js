import React from 'react';
import PropTypes from 'prop-types';

import {getBEMClassName} from './utils';


const ToolbarList = ({ children }) => {
  return (
    <ul className={getBEMClassName('toolbar__list')}>
      { React.Children.map(children, child => (
        <li className={getBEMClassName('toolbar__list-item')}>
          {child}
        </li>
      )) }
    </ul>
  );
};

ToolbarList.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};


const Toolbar = ({ children, modifiers=[] }) => {
  const className = getBEMClassName('toolbar', modifiers);
  return (
    <div className={className}>
      {children}
    </div>
  );
};

Toolbar.propTypes = {
    children: PropTypes.node,
    modifiers: PropTypes.arrayOf(PropTypes.string),
};


export {Toolbar, ToolbarList};
