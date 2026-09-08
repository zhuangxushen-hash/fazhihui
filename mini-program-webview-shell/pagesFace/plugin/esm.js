import fs from 'fs'
import path from 'path'

// subpackage config
const packageConfig = {
  "root": "pagesFace",
  "name": "pagesFace",
  "pages": [
    "pages/index/index",
    "pages/webview/webview",
    "pages/middle/middle",
    "pages/avsMiddlePage/avsMiddlePage"
  ]
}

/**
 * copy direction
 * @param {string} src source file
 * @param {string} dest destination file
 * @param {string} ignore ignore file
 */
function copyDir(src, dest, ignore) {
  const dirname = path.basename(src)
  if (dirname === ignore) {
    return
  }

  const exist = fs.existsSync(dest)
  if (exist) {
    return
  }

  fs.mkdirSync(dest)
  fs.readdirSync(src).forEach((file) => {
    const srcPath = path.join(src, file)
    const destPath = path.join(dest, file)
    const stat = fs.statSync(srcPath)
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, ignore)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  })
}

/**
 * write subpackage config to app.json
 * @param {string} appJsonPath app.json path
 * @param {object} packageConfig subpackage config
 * @returns 
 */
function writeAppJson(appJsonPath, packageConfig) {
  const exist = fs.existsSync(appJsonPath)
  if (!exist) {
    return
  }

  const appJsonText = fs.readFileSync(appJsonPath, 'utf-8')
  const appJson = JSON.parse(appJsonText)

  if (!appJson.subPackages) {
    appJson.subPackages = []
  }

  if (appJson.subPackages.find(p => p.name === packageConfig.name)) {
    return
  }

  appJson.subPackages.push(packageConfig)
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson))
}

/**
 * plugin logic
 * @param {string} packagePath subpackage path
 * @param {string} outputPath output path
 */
function plugin(packagePath, outputPath) {
  // copy pacesFace
  copyDir(path.resolve(packagePath), path.join(outputPath, 'pagesFace'), 'plugin')

  // write subpackage config
  writeAppJson(path.join(outputPath, 'app.json'), packageConfig)
}

/**
 * webpack plugin
 */
class PagesFaceWebpackPlugin {
  constructor(packagePath) {
    this.packagePath = packagePath
  }

  apply(compiler) {
    compiler.hooks.done.tap('PagesFaceWebpackPlugin', () => {
      try {
        plugin(this.packagePath, compiler.outputPath)
      } catch (e) {
        console.error('PagesFaceWebpackPlugin', e)
      }
    })
  }
}

/**
 * rollup plugin
 */
function PagesFaceRollupPlugin(packagePath) {
  return {
    name: 'PagesFaceRollupPlugin',
    writeBundle: (options) => {
      try {
        plugin(packagePath, options.dir)
      } catch (e) {
        console.error('PagesFaceRollupPlugin', e)
      }
    }
  }
}

export {
  PagesFaceWebpackPlugin,
  PagesFaceRollupPlugin
}
