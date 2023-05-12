const common = require('../../../config/common');
var con = require('../../../config/database');
var global = require('../../../config/constant');
var middleware = require('../../../middleware/validation');
var asyncLoop = require('node-async-loop');
const e = require('express');

var product = {

    // add product to cart

    addToCart: function (request, id, callback) {
        product.checkProduct(request, function (isExist) {
            if (isExist != null) {
                if (isExist[0].quantity > 0) {
                    product.subTotal(request, id, function (result) {
                        if (result) {
                            var qtyFlag = result[0].qty;
                            var qty = ++qtyFlag;
                            if (isExist[0].quantity >= qty) {
                                var subTotal = result[0].price * qty;
                                con.query('update tbl_cart set qty = ?, sub_total = ? where product_id = ?', [qty, subTotal, request.product_id], function (error, updateQty) {
                                    if (updateQty) {
                                        var sql = `SELECT c.user_id,c.product_id,c.cutting_id,c.sub_total,c.qty,pd.service_category_id,pd.market_id,pd.name as product_name,pd.price as product_price,pd.unit,u.first_name,m.market_name FROM tbl_cart c JOIN tbl_product_details pd 
                                        ON c.product_id = pd.id
                                        JOIN tbl_market m
                                        ON pd.market_id = m.id
                                        JOIN tbl_user u
                                        ON c.user_id = u.id
                                        WHERE product_id = ?`;
                                        con.query(sql, [request.product_id], function (error, cartItem) {
                                            if (cartItem) {
                                                if (cartItem[0].cutting_id != null) {
                                                    con.query(`select * from tbl_cutting_cleaning where id = ?`, [cartItem[0].cutting_id], function (error, cutting) {
                                                        if (!error && cutting.length > 0) {
                                                            cartItem[0].cuttind_cleaning = cutting[0];
                                                            callback("1", "reset_keyword_success_message", cartItem);
                                                        } else {
                                                            callback("0", "reset_keyword_something_wrong_message", null)
                                                        }
                                                    })
                                                } else {
                                                    callback("1", "reset_keyword_success_message", cartItem);
                                                }
                                            } else {
                                                console.log(error);
                                                callback("0", "reset_keyword_something_wrong_message", null);
                                            }
                                        })
                                    } else {
                                        callback(null);
                                    }
                                })
                            } else {
                                callback('0', "product out of stock", null)
                            }
                        } else {
                            var sql = `INSERT INTO tbl_cart SET ?`;
                            var insertObj = {
                                user_id: request.user_id,
                                product_id: request.product_id,
                                cutting_id: (request.cutting_id != undefined && request.cutting_id != '') ? request.cutting_id : null,
                                sub_total: isExist[0].price,
                                unit: isExist[0].unit,
                                price: isExist[0].price
                            };
                            con.query(sql, [insertObj], function (err, result) {
                                if (!err) {
                                    var id = result.insertId;
                                    var sql = `SELECT c.user_id,c.product_id,c.cutting_id,c.sub_total,c.qty,pd.service_category_id,pd.market_id,pd.name as product_name,pd.price as product_price,pd.unit,u.first_name,m.market_name FROM tbl_cart c JOIN tbl_product_details pd ON c.product_id = pd.id JOIN tbl_market m ON pd.market_id = m.id JOIN tbl_user u ON c.user_id = u.id WHERE c.id = ?`;
                                    con.query(sql, [id], function (error, product) {
                                        if (!error) {
                                            if (product[0].cutting_id != null) {
                                                con.query(`select * from tbl_cutting_cleaning where id = ?`, [product[0].cutting_id], function (error, cutting) {
                                                    if (!error && cutting.length > 0) {
                                                        product[0].cuttind_cleaning = cutting[0];
                                                        callback("1", "reset_keyword_success_message", product);
                                                    } else {
                                                        callback("0", "reset_keyword_something_wrong_message", null)
                                                    }
                                                })
                                            } else {
                                                callback("1", "reset_keyword_success_message", product);
                                            }
                                        } else {
                                            console.log(error);
                                            callback("0", "reset_keyword_something_wrong_message", null)
                                        }
                                    })
                                } else {
                                    console.log(err)
                                    callback("0", "reset_keyword_something_wrong_message", null)
                                };
                            });
                        }
                    })
                } else {
                    callback('0', "product out of stock", null)
                }
            } else {
                callback('0', "reset_keyword_data_not_found", null)
            }
        })
    },

    subTotal: function (request, id, callback) {
        con.query(`select * from tbl_cart where user_id = ? AND product_id = ?`, [id, request.product_id], function (error, result) {
            if (!error && result.length > 0) {
                callback(result);
            } else {
                callback(null);
            }
        })
    },

    checkProduct: function (request, callback) {
        con.query(`select * from tbl_product_details where id = ?`, [request.product_id], function (error, result) {
            if (!error && result.length > 0) {
                callback(result);
            } else {
                callback(null);
            }
        })
    },

    // confirm order

    confirmOrder: function (request, id, callback) {
        product.orderSender(id, function (sender) {
            if (!sender) {
                callback("0", "reset_keyword_data_not_found", null);
            } else {
                product.recieverDetails(request, id, function (reciever) {
                    if (!reciever) {
                        callback("0", "reset_keyword_data_not_found", null);
                    } else {
                        //get here receivers
                        product.getOrderTotal(id, function (result, subTotal) {
                            if (result) {
                                product.getTaxDetails(request, function (tax, total_tax) {
                                    if (tax) {
                                        if (request.promocode_id != "" && request.promocode_id != undefined) {
                                            product.applyPromoCode(request, subTotal, function (finalPrice, promocode_id, qty) {
                                                if (finalPrice) {
                                                    product.promocodeQtyUpd(promocode_id, qty, function (isUpdate) {
                                                        if (isUpdate) {
                                                            product.getPaymentDetail(request.payment_id, function (paymentDetail) {
                                                                if (paymentDetail) {
                                                                    var grand_total = finalPrice + total_tax;
                                                                    var data = {
                                                                        product: result,
                                                                        tax: tax,
                                                                        sender: sender,
                                                                        grand_total: grand_total,
                                                                        finalPrice: finalPrice,
                                                                        reciever: reciever,
                                                                        paymentDetail: paymentDetail,
                                                                        promocode_id: promocode_id,
                                                                        user_id: id
                                                                    }
                                                                    product.insertOrderData(data, request, function (isInserted) {
                                                                        if (isInserted) {
                                                                            con.query(`update tbl_cart set is_active = '0' where user_id = ${id}`, function (error, result) {
                                                                                if (!error) {
                                                                                    callback("1", "reset_keyword_success_message", data);
                                                                                } else {
                                                                                    callback('0', 'reset_keyword_data_not_found', null);
                                                                                }
                                                                            })
                                                                        } else {
                                                                            callback('0', 'reset_keyword_data_not_found', null);
                                                                        }
                                                                    });
                                                                } else {
                                                                    callback("0", "reset_keyword_data_not_found", null);
                                                                }
                                                            })
                                                        } else {
                                                            callback('0', 'reset_keyword_something_wrong_message', null)
                                                        }
                                                    })
                                                } else {
                                                    callback("0", "reset_keyword_data_not_found", null);
                                                }
                                            })
                                        } else {
                                            var grand_total = subTotal + total_tax;
                                            callback("1", "reset_keyword_success_message", { result, tax, sender, grand_total, subTotal, reciever });
                                        }
                                    } else {
                                        callback("0", "reset_keyword_data_not_found", null);
                                    }
                                });
                            } else {
                                callback('0', "reset_keyword_data_not_found", null)
                            }
                        })
                    }
                })
            }
        });
    },

    getTaxDetails: function (request, callback) {
        con.query(`SELECT id,value_added_tax,service_charges,service_charges_tax FROM tbl_tax`, function (error, result) {
            if (!error && result.length > 0) {
                var total_tax = result[0].value_added_tax + result[0].service_charges + result[0].service_charges_tax;
                callback(result, total_tax);
            } else {
                callback(null);
            }
        });
    },

    getOrderTotal: function (id, callback) {
        con.query(`select product_id,qty,sub_total,cutting_id,price from tbl_cart where user_id = ? AND is_active = '1' AND is_delete = '0'`, [id], function (error, result) {
            if (!error && result.length > 0) {
                var subTotal = 0;
                var clean_cost = 0;
                asyncLoop(result, function (item, next) {
                    subTotal += item.sub_total;
                    product.getExtraCost(item.cutting_id, function (cost) {
                        if (cost) {
                            item.extraCost = cost[0];
                            clean_cost += item.extraCost.price;
                            next();
                        } else {
                            next();
                        }
                    })
                }, () => {
                    subTotal += clean_cost;
                    callback(result, subTotal);
                })
            } else {
                callback(null)
            }
        })
    },

    getExtraCost: function (id, callback) {
        con.query(`select id,name,price,piece from tbl_cutting_cleaning where id = ? limit 1`, [id], function (error, result) {
            if (!error && result.length > 0) {
                callback(result);
            } else {
                callback(null);
            }
        })
    },

    orderSender: function (id, callback) {
        con.query(`SELECT u.id AS user_id,CONCAT(u.first_name,u.last_name) AS sender_name,CONCAT(u.country_code,u.mobile_number) AS sender_contact_number,CONCAT(ad.nearby_landmark,",",ad.area_name,",",ad.street_name)as Adress_info FROM tbl_user u 
        JOIN tbl_address ad 
        on u.id=ad.user_id
        WHERE u.id =${id} limit 1;`, function (error, result) {
            if (!error && result.length > 0) {
                callback(result);
            } else {
                console.log(error);
                callback(null);
            }
        });
    },

    recieverDetails: function (req, id, callback) {
        var reciver_data = new Array;
        asyncLoop(req.reciever_id, (item, next) => {
            con.query("select id,receiver_name,CONCAT(country_code,' ',phone_number) as reciever_contact_number FROM tbl_receiver WHERE id = ? AND user_id = ?", [item, id], (error, result) => {
                if (!error) {
                    reciver_data.push(result[0]);
                    next();
                } else {
                    next()
                }
            })
        }, () => {
            // console.log(reciver_data);
            callback(reciver_data)
        })
    },

    applyPromoCode: function (request, subTotal, callback) {
        con.query(`select * from tbl_promocode where id = ?`, [request.promocode_id], function (error, result) {
            if (!error && result.length > 0) {
                if (result[0].discount_type == 'flat') {
                    finalPrice = subTotal - result[0].discount_value;
                    coupon_id = result[0].id;
                    qty = result[0].quantity;
                    callback(finalPrice, coupon_id, qty)
                } else if (result[0].discount_type == 'percentage') {
                    discountPrice = ((subTotal * result[0].discount_value) / 100)
                    finalPrice = subTotal - discountPrice;
                    coupon_id = result[0].id;
                    qty = result[0].quantity;
                    callback(finalPrice, coupon_id, qty)
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        })
    },

    promocodeQtyUpd: function (id, qty, callback) {
        if (qty > 0) {
            var pQty = qty - 1;
            var updObj = {
                quantity: pQty
            }
            con.query(`update tbl_promocode set ? where id = ?`, [updObj, id], function (error, result) {
                if (!error) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
        } else {
            callback(false);
        }
    },

    getPaymentDetail: function (id, callback) {
        con.query(`select * from tbl_payment where id = ?`, [id], function (error, result) {
            if (!error) {
                callback(result);
            } else {
                callback(null);
            }
        })
    },

    insertOrderData: function (data, request, callback) {
        product.insertOrder(data, request, function (productInsertId) {
            if (productInsertId) {
                product.insertOrderDetail(data, productInsertId, function (orderDetail) {
                    if (orderDetail) {
                        product.insertReciever(data, productInsertId, function (orderReciever) {
                            if (orderReciever) {
                                // console.log('order reciever insert');
                                callback(true);
                            } else {
                                callback(null);
                            }
                        })
                    } else {
                        callback(null);
                    }
                })
            } else {
                callback(null);
            }
        })
    },

    insertOrderDetail: function (data, id, callback) {
        asyncLoop(data.product, function (item, next) {
            var insertObj = {
                order_id: id,
                product_id: item.product_id,
                sub_total: item.sub_total,
                quantity: item.qty,
                price: item.price,
                status: "placed"
            }
            con.query(`insert into tbl_order_details set ?`, [insertObj], function (error, result) {
                if (!error) {
                    next();
                } else {
                    next();
                }
            })
        }, () => {
            callback(true);
        })
    },

    insertOrder: function (data, request, callback) {
        var insertObj = {
            user_id: data.user_id,
            payment_id: data.paymentDetail[0].id,
            tax_id: data.tax[0].id,
            promocode_id: data.promocode_id,
            order_no: "1234",
            order_status: "pending",
            delivery_time: "10:00:00",
            delivery_date: "2023-05-10",
            prefered_way_to_reach_receiver: request.prefered_way_to_reach_receiver
        }
        con.query(`insert into tbl_order set ? `, [insertObj], function (error, result) {
            if (!error) {
                var id = result.insertId
                callback(id);
            } else {
                callback(false);
            }
        })
    },

    insertReciever: function (data, order_id, callback) {
        asyncLoop(data.reciever, function (item, next) {
            var insertObj = {
                order_id: order_id,
                reciever_id: item.id
            }
            con.query(`insert into tbl_order_reciever set ?`, [insertObj], function (error, result) {
                if (!error) {
                    next();
                } else {
                    next();
                }
            })
        }, () => {
            callback(true);
        })
    },

    // show cart item

    cartDetails: function (request, id, callback) {
        con.query("select * from tbl_cart where user_id = ? AND is_active = '1' AND is_delete = '0'", [id], function (err, result) {
            if (!err && result.length > 0) {
                callback("1", "data found successfully", result);
            } else {
                callback("0", "Something went wrong", null);
            }
        })
    },

    // product listing

    product_listing: function (request, id, callback) {
        product.product(request, function (products) {
            if (products) {
                product.getOrderTotal(id, function (result, subTotal) {
                    if (result) {
                        for (let i = 0; i <= products[0].product.length - 1; i++) {
                            if(result[i]){
                                if (products[0].product[i].id == result[i].product_id) {          
                                    products[0].product[i].cartQty = (result[i].qty);
                                }
                            } else {
                                callback('1','bhai nthi thatu',products);
                            }
                        }
                    }
                })
            }
        });
    },

    product: function (request, callback) {
        con.query("SELECT i.product_image, CONCAT('" + global.BASE_URL + global.PRODUCT_URL + "', '',product_image)as image_name FROM tbl_product_image i join tbl_product_details p on p.id = i.product_id", [request.market_id], function (err, result) {
            if (!err && result.length > 0) {
                con.query("select * from tbl_product_details where market_id= ?  ", [request.market_id], function (err, product) {
                    if (!err && product.length > 0) {
                        result[0].product = product;
                        asyncLoop(result, function (item, next) {
                            if (item) {
                                next();
                            } else {
                                next();
                            }
                        }, () => {
                            callback(result);
                        })
                    } else {
                        callback("1", "reset_keyword_success_message", result);
                    }
                })
            } else {
                callback('0', "reset_keyword_data_not_found", null)
            }
        })
    }
}

module.exports = product