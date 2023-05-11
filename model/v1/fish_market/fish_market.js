const common = require('../../../config/common');
var con = require('../../../config/database');
var global = require('../../../config/constant');
var middleware = require('../../../middleware/validation');
var asyncLoop = require('node-async-loop');
const e = require('express');

var fish_market = {


    market_listing: function (request, callback) {
        con.query(`select * from tbl_market where service_category_id = ? AND is_active = '1' AND is_delete = '0'`, [request.service_category_id], function (err, result) {
            if (!err && result.length > 0) {
                callback("1",'reset_keyword_success_message', result);
            } else {
                callback("0",'reset_keyword_success_message', null);
            }
        })
    },

}

module.exports = fish_market