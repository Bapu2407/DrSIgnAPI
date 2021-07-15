

const { check, validationResult } = require('express-validator');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID
//var axios = require('axios');
var request = require('request');
var moment = require('moment');
const Str = require('@supercharge/strings')

var doctorAppDoctorAddINvoicApiEndPoint = "http://" + process.env.DOCTORAPPIPADDRESS + ":" + process.env.DOCTORAPPPORT + "/api/addInvoicecrm"

const figureOutFilter = (filter) => {

  //   if(req.body.fetchOrderByCustomer ==true){
  // filter = {"customerId":req.body.customerId}                           
  //  }
  let finalFilter = {}
  //console.log("req.body and part == "+JSON.stringify(filter['$and']))
  if (filter && filter != null && filter != '') {

    //  let createDatePart = filter['$and']['createdDate']
    //  delete filter['$and']['createdDate']
    let andPartArray = filter['$and']

    // delete filter['$and']['createdDate']
    let fileterArray = []
    let createDatePart = ''
    let OrderIdPart = ''
    for (var i in andPartArray) {
      let individualFilter = andPartArray[i]
      if (individualFilter['createdDate'] && individualFilter['createdDate'] != 'undefined') {
        createDatePart = individualFilter['createdDate']
        continue
      }
      if (individualFilter['orderId'] && individualFilter['orderId'] != 'undefined') {
        OrderIdPart = individualFilter['orderId']
        continue
      }
      console.log("individualFilter == " + JSON.stringify(individualFilter))
      fileterArray.push(individualFilter)
    }

    if (OrderIdPart) {
      fileterArray.push({ _id: new ObjectId(OrderIdPart) })
    }

    if (createDatePart) {
      var dateString = createDatePart.toString()
      var dateParts = dateString.split("-");
      // month is 0-based, that's why we need dataParts[1] - 1
      var newDate = new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);
      //const yesterday = new Date(newDate)
      const yesterday = new Date(new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0], 0, 0, 0))
      yesterday.setDate(newDate.getDate())

      //yesterday.setDate(newDate.getDate() - 1)
      const tomorrow = new Date(newDate)
      tomorrow.setDate(newDate.getDate() + 1)
      fileterArray.push({ "createdDate": { "$gte": yesterday } })
      fileterArray.push({ "createdDate": { "$lt": tomorrow } })
      //let filter = {$and : [ { "createdDate" : {"$gt":yesterday }} ,{ "createdDate" : {"$lt":  tomorrow}} ]}  
    }
    //let finalFilter = {'$and':fileterArray}


    finalFilter = { '$and': fileterArray }
  } else {
    finalFilter = { "active": { $exists: true } }
  }
  return finalFilter
}

const createFiles = (staticImageDir) => {

  return new Promise((resolve, reject) => {
    fs.stat(staticImageDir, function (err) {
      if (!err) {
        dlog('Directory exists, where the images will go');
        resolve('Directory exists, where the images will go')
        //main(demographicFileName,inputCollection,whichfiles)

      }
      else if (err.code === 'ENOENT') {
        dlog('Directory does not exist where the images should be saved');
        reject(new Error('Directory does not exist, where the images will go'))
      }
    });
  });
}
function percentCalculation(a, b) {
  var c = (parseFloat(a) * parseFloat(b)) / 100;
  return parseFloat(c);
}

async function createCRMInvoice(order, res) {


  var currTime = moment(new Date()).format("hh:mm A");
  let invoicecrmObject =
  {
    active: true,
    "invoiceDate": new Date(),
    "invoiceTime": currTime,
    "customerId": order.customerId,
    "orderId": order._id,
    "paymentStatus": "Unpaid",
    "paymentMode": "COD",
    transactionId: '',
    "invoiceAmount": 0.0
  }


  let totalProductCount = 0
  let totalProductCgst = 0
  let totalProductSgst = 0
  let allProductsTotal = 0.0
  let allProductsDiscount = 0.0

  let medicineList = order.medicineList
  //medicineList = await getMedicineDetails(medicineList)
  let newMedicineLIst = []
  let count = 1


  let shippingChargeRecord = {}
  let shippingCharge = 0.0
  if (order.customerId) {
    dlog("order.customerId  =" + order.customerId)
    let customer = await common.getCustomer(order.customerId)

    if (customer) {
      invoicecrmObject.customer = customer
    }

    if (customer && customer.pin) {
      dlog("customer pin  =" + customer.pin)
      shippingChargeRecord = await common.calculateShippingCharge(customer.pin, order.deliveryMode)

      if (shippingChargeRecord && shippingChargeRecord['err']) {
        //return common.handleError('',shippingChargeRecord['err'],res,657)             
      }

      invoicecrmObject.deliveryMode = order.deliveryMode
      if (order.deliveryMode == 'Express' && shippingChargeRecord && shippingChargeRecord['expressDeliveryPrice']) {
        shippingCharge = shippingChargeRecord['expressDeliveryPrice']
      }
      if (order.deliveryMode == 'General' && shippingChargeRecord && shippingChargeRecord['generalDeliveryPrice']) {
        shippingCharge = shippingChargeRecord['generalDeliveryPrice']
      }
    }
  }

  dlog("shippingChargeRecord =" + JSON.stringify(shippingChargeRecord))

  //  if(shippingChargeRecord && shippingChargeRecord['err']){
  //   return common.handleError('',shippingChargeRecord['err'],res,657)             
  //   }
  let discountArray = await common.getAllDiscounts()

  console.log("medicineList.length) " + medicineList.length)

  medicineList.forEach(function (medicine, index) {

    let perProductDiscount = 0.0
    let perProductTotal = 0.0
    if (medicine.quantity && parseInt(medicine.quantity)) {
      totalProductCount = parseInt(totalProductCount) + parseInt(medicine.quantity)

      if (medicine.mrp && parseFloat(medicine.mrp)) {
        perProductTotal = parseFloat(medicine.mrp) * parseFloat(medicine.quantity)
        medicine.perProductTotal = perProductTotal
        allProductsTotal = allProductsTotal + perProductTotal
      }

    }

    if (medicine.discounts && parseFloat(medicine.discounts)) {
      perProductDiscount = percentCalculation(medicine.mrp, medicine.discounts)
      allProductsDiscount = allProductsDiscount + perProductDiscount
    }



    medicine.perProductDiscount = perProductDiscount

    if (medicine.gst && parseFloat(medicine.gst)) {

      medicine.cGst = parseFloat(medicine.gst) / 2
      //medicine.cGst = parseFloat(medicine.cGst)

      medicine.sGst = parseFloat(medicine.gst) / 2
      //medicine.sGst = parseFloat(medicine.sGst)
    }

    totalProductCgst = parseFloat(totalProductCgst) + parseFloat(medicine.cGst)
    totalProductSgst = parseFloat(totalProductSgst) + parseFloat(medicine.sGst)

    //
    newMedicineLIst.push(medicine)
  })

  invoicecrmObject.allProductsDiscount = allProductsDiscount



  invoicecrmObject.allProductsTotal = allProductsTotal
  invoicecrmObject.totalProductCount = totalProductCount
  invoicecrmObject.totalProductSgst = totalProductSgst
  invoicecrmObject.totalProductCgst = totalProductCgst
  invoicecrmObject.medicineList = newMedicineLIst
  if (shippingCharge) {
    invoicecrmObject.shippingCharge = shippingCharge
  }

  invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.allProductsTotal) - parseFloat(invoicecrmObject.allProductsDiscount)

  invoicecrmObject.beforTaxInvoiceAmountAfterMedicineDiscounts = parseFloat(invoicecrmObject.allProductsTotal) - parseFloat(invoicecrmObject.allProductsDiscount)

  invoicecrmObject.beforTaxInvoiceAmountAfterMedicineDiscounts = invoicecrmObject.beforTaxInvoiceAmountAfterMedicineDiscounts.toFixed(2)

  invoicecrmObject.totalProductSgst = percentCalculation(invoicecrmObject.invoiceAmount, invoicecrmObject.totalProductSgst)

  invoicecrmObject.totalProductSgst = invoicecrmObject.totalProductSgst.toFixed(2)

  invoicecrmObject.totalProductCgst = percentCalculation(invoicecrmObject.invoiceAmount, invoicecrmObject.totalProductSgst)

  invoicecrmObject.totalProductCgst = invoicecrmObject.totalProductCgst.toFixed(2)


  invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.invoiceAmount) + parseFloat(invoicecrmObject.totalProductSgst) + parseFloat(invoicecrmObject.totalProductCgst)

  invoicecrmObject.invoiceAmount = invoicecrmObject.invoiceAmount.toFixed(2)

  invoicecrmObject.grossAmount = parseFloat(invoicecrmObject.invoiceAmount) + parseFloat(invoicecrmObject.shippingCharge)

  invoicecrmObject.grossAmount = invoicecrmObject.grossAmount.toFixed(2)



  /* let orderArry = []

   orderArry.push(order)
   orderArry = await getCustomerDetails(orderArry)
   */
  let pdfURL = await common.genPDF(invoicecrmObject)
  invoicecrmObject.pdfURL = pdfURL

  //order = orderArry[0]



  //dlog("invoicecrmObject ="+JSON.stringify(invoicecrmObject))
  request({
    url: doctorAppDoctorAddINvoicApiEndPoint,
    method: 'POST',
    headers: {
      'content-Type': "application/json",
      'accept': "application/json"
    },
    body: JSON.stringify(invoicecrmObject)
  }
    , function (error, response, body) {
      if (error) {
        console.log("Invoice can't be created " + error)
        return
      }
    });
}
const getCustomerDetails = async (orderArry) => {
  let promises = []

  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  orderArry.forEach(function (order, index) {

    //order.uploadedFile = ''
    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filter = { _id: new ObjectId(order.customerId) }
        db.collection('customers').findOne(filter, function (error, customer) {

          // console.log("location per doctor == "+JSON.stringify(doctor))
          if (error) {
            database.close();
            resolve(order)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!customer) {
            database.close();
            //return common.handleError(err, 'patient could not be found',res,500)                    
            resolve(order)
          }
          if (customer) {
            order.customer = customer
          }
          //locationNewArray.push(location)
          //resolve(locationNewArray)
          //resolve({location:location,patient:patient})
          resolve(order)
        });
      })

    }));

  })

  return Promise.all(promises)

}

const getCustomerDetailsForLocation = async (orderArry, res) => {

  orderArry = await getCustomerDetails(orderArry)
  //  appointmentArry = await geteLocationDetails(appointmentArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Customers retrieval successful.',
    data: orderArry
  });



}

//const fsp = require("fs/promises");
module.exports = function (app) {




  app.post('/api/addOrder', [

    check('customerId').not().isEmpty().trim().escape()


  ], function (req, res) {
    //try{    
    dlog(" inside addOrder api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    dlog("name =" + req.body.name)

    const photoRandomString = Str.random(8)
    dlog("photoRandomString =" + photoRandomString)


    let uploadedFileNameSuf = "OrderManualPrescription" + photoRandomString + "_"

    var inputCollection = req.body
    common.doFileProcessing(inputCollection, "prescription", uploadedFileNameSuf, "uploadedFile", "uploadedFileURL").then((result) => {
      inputCollection = result
      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDBUrl Database connected successfully at post /addOrder")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

        var db = database.db()


        inputCollection.active = true
        //collection_json.appointmentDate = newDate.toISOString()//newDate
        inputCollection.createdDate = new Date()

        db.collection('orders').insertOne(inputCollection, function (error, response) {

          let order = response.ops[0]

          //dlog("NEWLY added patient == "+JSON.stringify(patient))             

          if (error) {
            return common.handleError(error, 'DB Insert Fail...', res, 500)
          }


          return res.json({
            status: true,
            message: 'DB Insert Success...',
            data: order
          });
        });

      });
    }, (err) => {
      let errMsg
      errMsg = err ? err.message : ""
      return res.json({
        status: false,
        message: 'DB Insert fails...',
        error: errMsg
      });
    });

  });

  app.post('/api/fetchorderDetails', [
    check('orderId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchorderDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.orderId) }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("orderDB Database connected successfully at post /login-order ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('orders').findOne(filter, function (error, order) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching order record', res, 500)
          }
          if (!order) {
            database.close();
            return common.handleError(err, 'order could not be found', res, 500)
          }

          order.uploadPhotoDemographic = ''

          database.close();
          return res.json({
            status: true,
            message: 'fetch Success...',
            data: order
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving order record', res, 500)

    }


  });
  app.post('/api/updateOrder', [
    check('orderId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateOrder api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var inputCollection = req.body

    const photoRandomString = Str.random(8)
    dlog("photoRandomString =" + photoRandomString)

    let uploadedFileNameSuf = "OrderManualPrescription" + photoRandomString + "_"

    try {
      let filter = { _id: new ObjectId(req.body.orderId) }
      //  Order.findById(req.body.orderId, function (err, order) {
      common.doFileProcessing(inputCollection, "prescription", uploadedFileNameSuf, "uploadedFile", "uploadedFileURL").then((result) => {

        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
          //   assert.equal(null, err);
          dlog("orderDB Database connected successfully at post /updateOrde,the request object " + JSON.stringify(req.body))


          if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
          var db = database.db()
          let fields = {}

          let fielchange = {}

          if (result.uploadedFileURL)
            fielchange.uploadedFileURL = result.uploadedFileURL

          if (result.uploadedFile)
            fielchange.uploadedFile = result.uploadedFile

          if (result.deliveryMode)
            fielchange.deliveryMode = result.deliveryMode


          if (req.body.medicineList)
            fielchange.medicineList = req.body.medicineList


          let filterCustomer = { _id: new ObjectId(req.body.customerId) }

          if (req.body.status && req.body.status.trim() != "") {
            fielchange.status = req.body.status
            const statusStr = fielchange.status

            if (fielchange.status == "Confirmed") {
              createCRMInvoice(req.body, res)
            }

            db.collection('customers').findOne(filterCustomer, function (error, customer) {

              //  console.log(" fetched customer "+JSON.stringify(customer))
              if (!error && customer) {


                let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=5ec38edd9bf45&sender=DRSIGN&mobileno=" + customer.mobileNumber + "&text= You order status changes to " + statusStr.toUpperCase()

                request({
                  method: "GET",
                  "rejectUnauthorized": false,
                  "url": smsGatewayURL,
                  "headers": { "Content-Type": "application/json" },
                  function(err, data, body) {
                    dlog("data ==" + JSON.stringify(data))
                    dlog("body ==" + JSON.stringify(body))

                  }
                })
                customer.uploadPhotoDemographic = ''

              }
            })
          }



          if (req.body.active == false) {
            fielchange.active = false
          }
          if (req.body.active == true) {
            fielchange.active = true
          }

          fielchange.updatedDate = new Date()

          fielchange = { $set: fielchange }

          //   dlog("fielchange == "+JSON.stringify(fielchange))             
          db.collection('orders').findOne(filter, function (err, orderRec) {

            if (err) {
              database.close();
              return common.handleError(err, 'Error, in fetching order', res, 500)
            }

            if (!orderRec) {
              database.close();
              return common.handleError(err, ' No order record found with the given order ID', res, 500)
            }

            db.collection('orders').findOneAndUpdate(filter, fielchange, { returnNewDocument: true }, function (error, response) {
              if (error) {
                database.close();
                return common.handleError(err, 'order password could not be updated', res, 500)
              }
              let order = response.value

              database.close();
              return res.json({
                status: true,
                message: 'order record update Success...',
                data: order
              });

            });

          });
        });
      }, (err) => {
        let errMsg
        errMsg = err ? err.message : ""
        return res.json({
          status: false,
          message: 'DB update fails...',
          error: errMsg
        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Order password could not be updated', res, 500)

    }


  });

  app.post('/api/fetchOrders', function (req, res) {
    dlog(" inside fetchOrders api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchOrders")
        let filter = { "active": { $exists: true } }

        if (req.body.fetchOrderByCustomer == true) {
          filter = { "customerId": req.body.customerId }
        }

        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage
        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('orders').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, orderArry) {
          let orderList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No order record found', res, 500)
          }
          if (!orderArry || (orderArry && orderArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No order record foundin Patient DB', res, 500)
          }


          database.close();
          getCustomerDetailsForLocation(orderArry, res)

          /*
          return res.json({
            status: true,
            message: 'order retrieval  successful.',
            data: orderList
          });
            */

        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving order record', res, 500)

    }
  });


  app.post('/api/fetchOrdersByFilters', function (req, res) {
    dlog(" inside fetchOrdersByFilters api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      console.log("fetchOrdersByFilters ====  == " + JSON.stringify(req.body))

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchOrders")


        let filter = figureOutFilter(req.body.filter)
        //  console.log("finalFilter == "+JSON.stringify(finalFilter))

        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage
        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('orders').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, orderArry) {
          let orderList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No order record found', res, 500)
          }
          if (!orderArry || (orderArry && orderArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No order record found', res, 500)
          }


          database.close();
          getCustomerDetailsForLocation(orderArry, res)

          /*
          return res.json({
            status: true,
            message: 'order retrieval  successful.',
            data: orderList
          });
            */

        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving order record', res, 500)

    }
  });


  app.post('/api/fetchOrdersByFilterCount', function (req, res) {
    dlog(" inside fetchOrdersCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchOrders")

        /*
        let filter = {"active":{$exists:true}} 
                       
        if(req.body.fetchOrderByCustomer == true){
          filter = {"customerId":req.body.customerId}                           
        }
        */
        let filter = figureOutFilter(req.body.filter)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('orders').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No order record found', res, 500)
          }
          var output
          if (result == undefined) {
            output = {
              "recordCount": 0
            }
          } else {
            output = {
              "recordCount": result
            }
          }

          database.close();

          return res.json({
            status: true,
            message: 'order record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving order record', res, 500)

    }
  });

  /*
    ************
   6. fetchOrders Count API
    ************
  */


  app.post('/api/fetchOrdersCount', function (req, res) {
    dlog(" inside fetchOrdersCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchOrders")


        let filter = { "active": { $exists: true } }

        if (req.body.fetchOrderByCustomer == true) {
          filter = { "customerId": req.body.customerId }
        }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('orders').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No order record found', res, 500)
          }
          var output
          if (result == undefined) {
            output = {
              "recordCount": 0
            }
          } else {
            output = {
              "recordCount": result
            }
          }

          database.close();

          return res.json({
            status: true,
            message: 'order record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving order record', res, 500)

    }
  });

  app.post('/api/fetch-all-medicines-autocom', [
    check('name').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-medicineName api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-doctors")

      //let filter  =  {  name: {'$regex':req.body.name, $options: '-i' } }

      let filter = { $and: [{ name: { '$regex': req.body.name, $options: '-i' } }, { active: true }] }

      //db.collection('medicinedumps').find(filter).toArray(function(err, medicineArry) {
      db.collection('medicines').find(filter).toArray(function (err, medicineArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching doctor ', res, 500)
        if (!medicineArry || (medicineArry && medicineArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No medicinearray record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'MedicineName array retrieval success...',
          //data: doctorIdList
          data: medicineArry
        });

      });

    });

  });

  app.post('/api/fetch-all-customers-autocom', [
    check('name').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-customers api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-customers")

      let filter = { name: { '$regex': req.body.name, $options: '-i' } }

      db.collection('customers').find(filter).toArray(function (err, customerArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching customer ', res, 500)
        if (!customerArry || (customerArry && customerArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No customerArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Patient array retrieval success...',
          //data: doctorIdList
          data: customerArry
        });

      });

    });

  });

  app.post('/api/fetch-all-orders-autocom', [
    check('name').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-orders api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-orders")

      let filter = { _id: new ObjectId(req.body.orderId) }

      db.collection('orders').find(filter).toArray(function (err, orderArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching order ', res, 500)
        if (!orderArry || (orderArry && orderArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No orderArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Patient array retrieval success...',
          //data: doctorIdList
          data: orderArry
        });

      });

    });

  });



}