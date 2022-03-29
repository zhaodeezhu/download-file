const webpackConfig = require('cover-webpack-package/lib/webpack.config');
const webpack = require('webpack');
process.env.NODE_ENV = 'production';

const config = webpackConfig('', {
    packageName: 'cover',
    mode: 'production'
})

const compiler = webpack(config);

compiler.run((err, stats) => {
    // console.log(err)
    // console.log(stats)
    if (!err) return;
    console.log('构建成功');
    // console.log(stats);
});