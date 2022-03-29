if(process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/cover-number.min.js');
} else {
  module.exports = require('./dist/cover-number.js');
}