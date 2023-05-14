const common = require('../../../config/common');
var con = require('../../../config/database');
var global = require('../../../config/constant');
var middleware = require('../../../middleware/validation');
var asyncLoop = require('node-async-loop');
const e = require('express');

var fish_market = {

    market_listing: function (request, callback) {
        var day = new Date()
        con.query(`select m.service_category_id,m.market_name,m.market_image,dw.days,dw.open_time,dw.close_time,
        CASE
            WHEN dw.is_open = '0' THEN 'open on monday'
            WHEN CURRENT_TIME() > dw.close_time THEN 'close'
            WHEN dw.is_open = '1' THEN concat( 'open untill'," ",dw.close_time) 
        END AS status 
        from tbl_market m join tbl_days_week dw on m.id = dw.market_id where m.service_category_id = ? AND dw.day_id = ${day.getDay()} AND m.is_active = '1' AND m.is_delete = '0' ORDER BY DESC;`, [request.service_category_id], function (err, result) {
            if (!err && result.length > 0) {
                callback("1", 'listing_success_message', result);
            } else {
                console.log(err)
                callback("0", 'listing_error_message', null);
            }
        })
    },

}

module.exports = fish_market