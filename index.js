//init code
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const database = require('./database');

//var bodyParser = require('body-parser');

//middleware setup
app.use(morgan('dev'));
app.use(cors());
app.use("/public", express.static(__dirname + "/public"));
//app.use("/public", express.static(process.env.STATIC_FOLDER));


//app.use("/adminportal", express.static(__dirname + "/adminportal"));
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ limit: "250mb", extended: true, parameterLimit: 500000 }));
//app.use('/api/doctor',doctorController);
var dlog = require('debug')('dlog')
//defaults routes
/*
app.all('/',function(req,res){
    return res.json({
        status :true,
        message:'Doctorsignet Index page working'
    });
    
});
*/


// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Methods,x-access-token,Access-Control-Allow-Origin,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Requested-With,content-type');



    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//start server
require('./app/doctor/doctor.js')(app);
require('./app/practice-location/practice-location.js')(app);
require('./app/appointment/appointment.js')(app);
require('./app/finance/finance.js')(app);
require('./app/setting/setting.js')(app);
require('./app/eprescription/eprescription.js')(app);
require('./app/patient/patient.js')(app);
require('./app/patient/search-doctor.js')(app);
require('./app/invoice/invoice.js')(app);
require('./app/prescription/prescription.js')(app);
require('./app/manual-prescription/manual-prescription.js')(app);
require('./app/previous-prescription/previous-prescription.js')(app);
require('./app/portal/portal.js')(app);
require('./app/customer/customer.js')(app);
require('./app/order/order.js')(app);
require('./app/practicecategory/practicecategory.js')(app);
require('./app/lab/lab.js')(app);
require('./app/lab/lab-agent.js')(app);
require('./app/lab/lab-config.js')(app);
require('./app/service-location/service-location.js')(app);
require('./app/lab/lab-booking.js')(app);
require('./app/medicine/medicine.js')(app);
require('./app/delivery/delivery.js')(app);
require('./app/category/category.js')(app);
require('./app/charges/charges.js')(app);
require('./app/discount/discount.js')(app);
require('./app/invoicecrm/invoicecrm.js')(app);
require('./app/coupon/coupon.js')(app);
require('./app/digitalmarketing/digitalmarketing.js')(app);
require('./app/lab/labadmin.js')(app);
require('./app/pharma/pharma.js')(app);
require('./test/somtest.js')(app);
console.log(`Your port is ${port}`);
app.listen(
    port,
    function () {
        dlog('Server running at port :' + port);
    }
);