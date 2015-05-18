/**
 * General Util
 */

'use strict';

module.exports = {
  parseUrl: function(obj, callback) {
    if(obj.type === 'resetPassSubmit') {
      var exp = obj.url.split(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);
      return callback(exp[5].split("/")[3]);
    }
  }
}