const chalk = require('chalk')
const assert = require('assert')
const webpack = require('webpack/package')
const beautify = require('js-beautify').html
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackLatest = (webpack.version !== null || webpack.version !== void 0) && /.*4(\.\d+){0,2}/gi.test(webpack.version)

function HtmlBeautifyPlugin ({ config = {}, replace = [] }) {

  assert(config && typeof config === 'object' , chalk.red('Beautify config should be an object.'))

  this.options = {
    config: {
      indent_size: 4,
      indent_with_tabs: false,
      html: {
        end_with_newline: true,
        indent_inner_html: true,
        preserve_newlines: true,
      },
      ...config,
    },
    replace
  }
}

function htmlPluginDataFunction (htmlPluginData, callback, _this) {
  htmlPluginData.html = beautify(_this.options.replace.reduce((res, item) => {
    if (typeof item === 'string' || item instanceof RegExp)
      return res.replace(item instanceof RegExp ? item : new RegExp(item, 'gi'), '')
    else
      return res.replace(item.test instanceof RegExp ? item.test : new RegExp(item.test, 'gi'), item.with || '')
  }, htmlPluginData.html), _this.options.config)

  callback(null, htmlPluginData)
}

HtmlBeautifyPlugin.prototype.apply = function (compiler) {
  if (!webpackLatest) {
    compiler.plugin('compilation',
      compilation => compilation.plugin('html-webpack-plugin-after-html-processing',
        (htmlPluginData, callback) => {
          htmlPluginDataFunction(htmlPluginData, callback, this)
        })
      )
  } else {
    compiler.hooks.compilation.tap('HtmlBeautifyPlugin',
      (compilation) => HtmlWebpackPlugin.getHooks
      ? HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('HtmlBeautifyPlugin',
        (htmlPluginData, callback) => {
          htmlPluginDataFunction(htmlPluginData, callback, this);
        })
      : compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync('HtmlBeautifyPlugin',
        (htmlPluginData, callback) => {
          htmlPluginDataFunction(htmlPluginData, callback, this);
        })
    )
  }
}

module.exports = HtmlBeautifyPlugin
