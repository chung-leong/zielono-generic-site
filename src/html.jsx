import React from 'react';
import { useProgress } from 'relaks';

export async function HTML(props) {
  const [ show ] = useProgress();

  render();
  const metadata = await {};
  render();

  function render() {
    if (!metadata) {
      show(null);
    } else {
      show(
        <html>
          <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{metadata.title}</title>
            <link href="main.css" rel="stylesheet" />
          </head>
          <body>
            <div id="react-container" />
            <script type="text/javascript" src="index.js" />
          </body>
        </html>
      );
    }
  }
}
