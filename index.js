require('dotenv').config();
const express = require('express');
var app = express();

app.use(express.text());
app.use(express.urlencoded({ extended: false }));

// app.use('/v1/api_document/',require('./model/v1/api_document/index'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


// var auth = require('./model/v1/auth/route');
var product = require('./model/v1/product/route');
var user = require('./model/v1/user/route');
var fish_market = require('./model/v1/fish_market/route')

app.use('/', require('./middleware/validation').extractheaderlanguage)
app.use('/', require('./middleware/validation').validateApiKey);
app.use('/', require('./middleware/validation').validateUserToken);

// app.use('/api/v1/auth', auth);
app.use('/api/v1/product', product);
app.use('/api/v1/user',user);
app.use('/api/v1/fish_market',fish_market);

try {
    app.listen(process.env.PORT);
    console.log('app listing on port : 8181');
} catch {
    console.log('connection fails');
}