import React from 'react';

import './style.scss';

export function FrontEnd(props) {
  const { ssr } = props;
  const classNames = [ 'front-end' ];
  if (ssr) {
    classNames.push('ssr');
  }
  return (
    <div className={classNames.join(' ')}>
      <div className="page-container">
        <h1>This is a test</h1>
      </div>
    </div>
  );
}
