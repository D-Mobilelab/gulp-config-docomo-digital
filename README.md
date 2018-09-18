# gulp-config-docomo-digital

[![Greenkeeper badge](https://badges.greenkeeper.io/D-Mobilelab/gulp-config-docomo-digital.svg)](https://greenkeeper.io/)

## setup

Copy **example/local.json** from this repository to **js/gulp/local.json**.

Install SwitchyOmega Chrome extension (https://chrome.google.com/webstore/detail/proxy-switchyomega/padekgcemlokbadohgkifijomclgjgif), go to extensions Options, "Import/Export" and load **SwitchyOmega.bak** from this repository to "Restore from file" field.

## settings

- **domain** : domain to get configuration, dictionary and footer
- **secret** : secret id to get configuration
- **stageURL** : URL to open when run *gulp stage* (usually *http://localhost:3000* or same value of *domain*, in this case proxy configuration is mandatory)
- **imagePrefix** : prefix URL to prepend to images URL for css development in *gulp stage* task
- **jsPrefix** : prefix URL to prepend to javascript files URL for, useful in *gulp stage* and *gulp build* task (i.e. /js/wl/webstore_news/app/)
- **mainAngularModule** : name of main Angular module, useful for ngTemplates process in *gulp build* task
- **fwName** : name of framework (lite, news, gameasy, html5game, etc)
- **mergeHtml** : if true the templates will merge to build javascript file (*scripts.js*), else the templates will copy directly from app/ to dist/
- **revCss** : if true add revision number to css build
- **config** : configuration keys will override configuration values taken from domain
- **dictionary** : dictionary keys will override dictionary values taken from domain
- **footer** : footer keys will override footer values taken from domain

## priority for settings, config, dictionary and footer

Priority for settings, configuration, dictionary and footer:
1. gulp/config.json and gulp/hybrid.json
2. domain configuration/dictionary/footer, loaded from API
3. default values from this repository (see gulp/base.js)

## tasks

- **gulp beautify** : run beautifier for Javascript files
- **gulp lint** : run eslint on JavaScript files on app/ folder (if you add --fix then eslint fix some possible errors)
- **gulp crtolf** : convert cr to lf
- **gulp stage** : run local server to debug app/ folder (set config.json before, if necessary)
- **gulp build** : create build (minified and map) into dist/ folder
- **gulp serve-dist** : create build (minified and map) into dist/ and run local server to debug dist/ folder
- **gulp hybrid:stage** : create www for hybrid app into hybrid/www and run hybrid app on an android device connected; it need a proper cordova project in hybrid folder
- **gulp hybrid:build** : create production www for hybrid app into hybrid/www and run hybrid app on an android device connected