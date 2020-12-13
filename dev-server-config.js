const { existsSync, readFileSync } = require('fs');
const { resolve, dirname, basename } = require('path');
const URL = require('url');
const fetch = require('cross-fetch');
const { platform } = require('os');
const { question } = require('readline-sync');

const server = {
  before(app, server) {
    const fs = server.middleware.fileSystem;
    const contentBase = server.options.contentBase;
    const baseURL = getBaseURL();
    app.get('/:path(*.*)', (req, res, next) => {
      const { path } = req.params;
      server.middleware.waitUntilValid(() => {
        try {
          const ext = extname(path);
          const filename = basename(path);
          const filePath = contentBase + '/www/' + filename;
          const buffer = fs.readFileSync(filePath);
          res.type(ext).send(buffer);
        } catch (err) {
          if (filename === 'favicon.ico') {
            res.sendStatus(204);
            return;
          }
          next(err);
        }
      });
    });
    app.get('/:path(*)', (req, res, next) => {
      const path = req.url;
      const lang = getPreferredLanguage(req);
      server.middleware.waitUntilValid(async () => {
        try {
          const codePath = `${contentBase}/ssr/index.js`;
          const html = await generatePage(fs, codePath, path, lang, baseURL);
          res.type('html').send(html);
        } catch (err) {
          next(err);
        }
      });
    });
  },
  after(app, server) {
    app.use((err, req, res, next) => {
      res.status(err.status || 500);
      if (err.html) {
        res.type('html').send(err.html);
      } else {
        res.type('text').send(err.message);
      }
    });
  }
}

function getBaseURL() {
  const exts = [ '.desktop', '.url' ];
  for (let ext of exts) {
    const filename = `test-server${ext}`;
    const path = Path.resolve(`./${filename}`);
    if (existsSync(path)) {
      const text = readFileSync(path, 'utf-8');
      const m = /^URL=(.*)$/mi.exec(text);
      if (m) {
        return m[1];
      }
    }
  }
  const prompt = 'Server URL: ';
  let url = '';
  do {
    url = question(prompt).trim();
    const parsed = URL.parse(url);
    if (!parsed.hostname || !parsed.protocol) {
      console.log('[Invalid URL]');
      url = null;
    }
  } while(!url);
  saveBaseURL(url);
  return url;
}

function saveBaseURL(url) {
  const lines = [];
  let ext = '.url';
  let nl = '\n';
  switch (platform()) {
    case 'linux':
    case 'freebsd':
      lines.push(
        '[Desktop Entry]',
        'Encoding=UTF-8',
        'Name=Link to test server',
        'Type=Link',
        'Icon=text-html'
      );
      ext = '.desktop';
      break;
    default:
      lines.push('[InternetShortcut]');
      nl = '\r\n';
      break;
  }
  lines.push('URL=' + url);
  const text = lines.join(nl);
  const filename = `test-server${ext}`;
  const path = resolve(`./${filename}`);
  writeFileSync(path, text);
}

global.fetch = function(url, optionsGiven) {
  const options = { timeout: 5000, ...optionsGiven };
  return fetch(url, options);
};

function generatePage(fs, codePath, path, lang, baseURL) {
  const buffer = fs.readFileSync(codePath);
  const dirname = dirname(codePath);
  const filename = basename(codePath);
  const ssr = compileCode(buffer, dirname, filename);
  const options = {
    dataSourceBaseURL: baseURL,
    routeBasePath: '/',
    routePagePath: path,
    ssrTarget: 'hydrate',
    preferredLanguage: lang,
  };
  return ssr.render(options).then(function(html) {
    return '<!DOCTYPE html>\n' + html;
  });
}

/**
 * Compile a CommonJS module
 * @param  {Buffer} buffer
 * @param  {string} dirname
 * @param  {string} filename
 *
 * @return {Object}
 */
function compileCode(buffer, dirname, filename) {
  const code = buffer.toString();
  const cjsHeader = '(function(require, exports, module, __dirname, __filename) {\n';
  const cjsTrailer = '\n})';
  const f = (() => eval(arguments[0]))(cjsHeader + code + cjsTrailer);
  const module = { exports: {} };
  f(require, module.exports, module, dirname, filename);
  return module.exports;
}

/**
 * Return language most preferred by visitor
 * @param  {Request} req
 *
 * @return {string}
 */
function getPreferredLanguage(req) {
  const accept = req.headers['accept-language'] || 'en';
  const tokens = accept.split(/\s*,\s*/);
  const list = tokens.map(function(token) {
    const m = /([^;]+);q=(.*)/.exec(token);
    if (m) {
      return { language: m[1], qFactor: parseFloat(m[2]) };
    } else {
      return { language: token, qFactor: 1 };
    }
  });
  list.sort(function(a, b) {
    return b.qFactor - a.qFactor;
  });
  return list[0].language;
}
