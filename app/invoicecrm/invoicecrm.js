

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
const Str = require('@supercharge/strings');
var request = require('request');

const { resolve } = require('path');
function percentCalculation(a, b) {
  var c = (parseFloat(a) * parseFloat(b)) / 100;
  return parseFloat(c);
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


async function recalculateInvoice(invoicecrmObject, res) {

  try {

    // var currTime = moment(new Date()).format("hh:mm A");



    invoicecrmObject = await common.commonInvoiceCalculation(invoicecrmObject)

    let pdfURL = common.genPDF(invoicecrmObject)
    invoicecrmObject.pdfURL = pdfURL



  } catch (e) {
    console.log(e)
  }

  return invoicecrmObject
}
const figureOutFilter = (filter) => {

  //   if(req.body.fetchInvoicecrmByCustomer ==true){
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
    let InvoicecrmIdPart = ''
    for (var i in andPartArray) {
      let individualFilter = andPartArray[i]
      if (individualFilter['createdDate'] && individualFilter['createdDate'] != 'undefined') {
        createDatePart = individualFilter['createdDate']
        continue
      }
      if (individualFilter['invoicecrmId'] && individualFilter['invoicecrmId'] != 'undefined') {
        InvoicecrmIdPart = individualFilter['invoicecrmId']
        continue
      }
      console.log("individualFilter == " + JSON.stringify(individualFilter))
      fileterArray.push(individualFilter)
    }

    if (InvoicecrmIdPart) {
      fileterArray.push({ _id: new ObjectId(InvoicecrmIdPart) })
    }

    if (createDatePart) {
      var dateString = createDatePart.toString()
      var dateParts = dateString.split("-");
      // month is 0-based, that's why we need dataParts[1] - 1
      var newDate = new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);
      //const yesterday = new Date(newDate)
      const yesterday = new Date(new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0], 0, 0, 0))
      yesterday.setDate(newDate.getDate())
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


const getCustomerDetails = async (invoicecrmArry) => {
  let promises = []

  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  invoicecrmArry.forEach(function (invoicecrm, index) {

    invoicecrm.uploadedFile = ''
    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filter = { _id: new ObjectId(invoicecrm.customerId) }
        db.collection('customers').findOne(filter, function (error, customer) {

          // console.log("location per doctor == "+JSON.stringify(doctor))
          if (error) {
            database.close();
            resolve(invoicecrm)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!customer) {
            database.close();
            //return common.handleError(err, 'patient could not be found',res,500)                    
            resolve(invoicecrm)
          }
          if (customer) {
            invoicecrm.customer = customer
          }
          //locationNewArray.push(location)
          //resolve(locationNewArray)
          //resolve({location:location,patient:patient})
          resolve(invoicecrm)
        });
      })

    }));

  })

  return Promise.all(promises)

}

const getOrderDetails = async (invoicecrmArry) => {
  let promises = []

  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  invoicecrmArry.forEach(function (invoicecrm, index) {

    invoicecrm.uploadedFile = ''
    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filter = { _id: new ObjectId(invoicecrm.orderId) }
        db.collection('orders').findOne(filter, function (error, order) {

          // console.log("location per doctor == "+JSON.stringify(doctor))
          if (error) {
            database.close();
            resolve(invoicecrm)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!order) {
            database.close();
            //return common.handleError(err, 'patient could not be found',res,500)                    
            resolve(invoicecrm)
          }
          if (order) {

            order.uploadedFile = ''
            invoicecrm.order = order
            resolve(invoicecrm)
            /*
            let medicineList = order.medicineList
            //medicineList = await getMedicineDetails(medicineList)
            let newMedicineLIst = []
            let count = 1

            console.log("medicineList.length) "+medicineList.length)

            let promisesMedicineList = []
             medicineList.forEach(function(medicine, index){
              promisesMedicineList.push(  new Promise(resolve => {     
                   // var db = database.db()     
                  let filterMedicine  = {_id : new ObjectId(medicine.medicineId)}
                    db.collection('medicines').findOne(filterMedicine,function(error, medicineResult) {
          
                     // console.log("location per doctor == "+JSON.stringify(doctor))
                      if (error ) {
                        //  database.close(); 
                          //newMedicineLIst.push(medicine)
                          //return common.handleError(err, 'Error fetching patient record',res,500)                    
                        }
                    //  if (!medicineResult ) {                            
                     //   newMedicineLIst.push(medicine)
                    //  }    
                      if(medicine && medicine.quantity && medicineResult){
                        medicineResult.quantity = medicine.quantity
                      }
                      if(medicineResult)
                        resolve(medicineResult)
                      else{
                        resolve(medicine)
                      }
                     // newMedicineLIst.push(medicineResult)
                      count = count +1
                  });     
                  
                  console.log("count "+count)
                //  order.medicineList = newMedicineLIst            
                //  invoicecrm.order = order
                 // if(count == medicineList.length)
                  //resolve(medicineResult)
                }))
              })
              Promise.all(promisesMedicineList).then(function(values) {  
                newMedicineLIst.push(values)

                console.log("newMedicineLIst == "+JSON.stringify(values))
                order.medicineList = values 
                invoicecrm.order = order
              resolve(invoicecrm) 
              })   
*/


          }


        });
      })

    }));

  })

  return Promise.all(promises)

}




const getCustomerOrderDetailsPerInvoice = async (invoicecrmArry, res) => {

  invoicecrmArry = await getCustomerDetails(invoicecrmArry)
  invoicecrmArry = await getOrderDetails(invoicecrmArry)
  //invoicecrmArry = await iterateMedicineLIt(invoicecrmArry)

  /*
  let invoiceNewList = []
  invoicecrmArry.forEach(function(invoicecrm, index){
    let medicineList = invoicecrm.order.medicineList
    medicineList = await getMedicineDetails(medicineList)
    invoicecrm.order.medicineList = medicineList

    invoiceNewList.push(invoicecrm)
  })

*/
  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Customers retrieval successful.',
    data: invoicecrmArry
  });



}


const getPDFDone = async (invoiceCrm, res) => {

  let pdfURL = common.genPDF(invoiceCrm)

  invoiceCrm.pdfURL = pdfURL

  return res.json({
    status: true,
    message: 'Invoice Generated successfully.',
    data: invoiceCrm
  });



}

//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/addInvoicecrm', function (req, res) {
    //try{    
    dlog(" inside addInvoicecrm api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    //dlog("body ="+JSON.stringify(req.body))

    //dlog("name ="+req.body.name)

    var inputCollection = req.body

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      //   assert.equal(null, err);
      dlog("doctorDBUrl Database connected successfully at post /addInvoicecrm")

      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      var db = database.db()


      inputCollection.active = true
      //collection_json.appointmentDate = newDate.toISOString()//newDate
      inputCollection.createdDate = new Date()

      db.collection('invoicecrms').insertOne(inputCollection, function (error, response) {

        let invoicecrm = response.ops[0]


        //    getPDFDone(invoicecrm,res)                 
        let pdfURL = common.genPDF(invoicecrm)
        //dlog("NEWLY added patient == "+JSON.stringify(patient))             

        if (error) {
          return common.handleError(error, 'DB Insert Fail...', res, 500)
        }


        return res.json({
          status: true,
          message: 'DB Insert Success...',
          data: invoicecrm
        });
      });

    });


  });


  app.post('/api/genCrmInvoice', [
    check('invoicecrmId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchinvoicecrmDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.invoicecrmId) }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("invoicecrmDB Database connected successfully at post /login-invoicecrm ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('invoicecrms').findOne(filter, function (error, invoicecrm) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching invoicecrm record', res, 500)
          }
          if (!invoicecrm) {
            database.close();
            return common.handleError(err, 'invoicecrm could not be found', res, 500)
          }

          invoicecrm.uploadPhotoDemographic = ''
          database.close();
          getPDFDone(invoicecrm, res)

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }


  });
  app.post('/api/fetchinvoicecrmDetails', [
    check('invoicecrmId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetchinvoicecrmDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let filter = { _id: new ObjectId(req.body.invoicecrmId) }
    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("invoicecrmDB Database connected successfully at post /login-invoicecrm ")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('invoicecrms').findOne(filter, function (error, invoicecrm) {
          if (error) {
            database.close();
            return common.handleError(err, 'Error fetching invoicecrm record', res, 500)
          }
          if (!invoicecrm) {
            database.close();
            return common.handleError(err, 'invoicecrm could not be found', res, 500)
          }

          invoicecrm.uploadPhotoDemographic = ''

          database.close();
          return res.json({
            status: true,
            message: 'fetch Success...',
            data: invoicecrm
          });

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }


  });
  app.post('/api/updateInvoicecrm', [
    check('invoicecrmId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateInvoicecrm api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {
      let filter = { _id: new ObjectId(req.body.invoicecrmId) }
      //  Invoicecrm.findById(req.body.invoicecrmId, function (err, invoicecrm) {



      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("invoicecrmDB Database connected successfully at post /updateProfile")


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        let fields = {}

        let fielchange = {}

        let recalcInvoice = false

        db.collection('invoicecrms').findOne(filter, function (err, invoicecrmRec) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, in fetching invoicecrm', res, 500)
          }

          if (!invoicecrmRec) {
            database.close();
            return common.handleError(err, ' No invoicecrm record found with the given invoicecrm ID', res, 500)
          }
          const randomTransactionID = Str.random(8)
          dlog("randomTransactionID =" + randomTransactionID)

          if (!invoicecrmRec.transactionId) {
            fielchange.transactionId = randomTransactionID
          }

          if (req.body.paymentStatus && req.body.paymentStatus.trim() != "")
            fielchange.paymentStatus = req.body.paymentStatus

          if (req.body.paymentMode && req.body.paymentMode.trim() != "")
            fielchange.paymentMode = req.body.paymentMode

          if (req.body.paymentMode && req.body.paymentMode.trim() != ""
            && req.body.paymentMode.trim() == "Card") {
            recalcInvoice = true

          }

          if (req.body.couponCode && req.body.couponCode.trim() != "") {
            fielchange.couponCode = req.body.couponCode
            recalcInvoice = true
          }


          if (req.body.active == false) {
            fielchange.active = false
          }
          if (req.body.active == true) {
            fielchange.active = true
          }

          fielchange.updatedDate = new Date()




          if (req.body.paymentMode && req.body.paymentMode.trim() != ""
          ) {
            invoicecrmRec.paymentMode = req.body.paymentMode
          }


          if (req.body.paymentMode && req.body.paymentMode.trim() != ""
            && req.body.paymentMode.trim() == "Card") {
            invoicecrmRec.paymentMode = "Card"
          }


          if (req.body.couponCode && req.body.couponCode.trim() != "") {
            invoicecrmRec.couponCode = req.body.couponCode
            invoicecrmRec.couponValue = req.body.couponValue
            invoicecrmRec.couponId = req.body.couponId
            invoicecrmRec.alreadyTimes = req.body.alreadyTimes
          }
          dlog("recalcInvoice == " + recalcInvoice)


          //dlog("req.body == "+JSON.stringify(req.body))

          if (req.body.invoiceAmount)
            fielchange.invoiceAmount = req.body.invoiceAmount

          if (req.body.allProductsDiscount)
            fielchange.allProductsDiscount = req.body.allProductsDiscount


          if (req.body.paymentMode && req.body.paymentMode.trim() != ""
            && req.body.paymentMode.trim() == "Card") {

            fielchange.cardBasedPaymentFees = req.body.cardBasedPaymentFees
          }

          if (req.body.couponCode && req.body.couponCode.trim() != "") {
            fielchange.couponCode = req.body.couponCode
            fielchange.couponValue = req.body.couponValue
            fielchange.couponId = req.body.couponId
          }

          if (req.body.allProductsTotal)
            fielchange.allProductsTotal = req.body.allProductsTotal

          if (req.body.totalProductCount)
            fielchange.totalProductCount = req.body.totalProductCount

          if (req.body.totalProductSgst)
            fielchange.totalProductSgst = req.body.totalProductSgst

          if (req.body.totalProductCgst)
            fielchange.totalProductCgst = req.body.totalProductCgst

          if (req.body.medicineList)
            fielchange.medicineList = req.body.medicineList

          if (req.body.shippingCharge)
            fielchange.shippingCharge = req.body.shippingCharge

          if (req.body.grossAmount)
            fielchange.grossAmount = req.body.grossAmount




          //dlog("fielchange == "+JSON.stringify(fielchange))     



          invoicecrmRec.fielchange = fielchange

          if (recalcInvoice) {

            invoicecrmRec = recalculateInvoice(invoicecrmRec, res)

          }



          return res.json({
            status: true,
            message: 'invoicecrm record update Success...',
            data: invoicecrmRec
          });


        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Invoicecrm password could not be updated', res, 500)

    }


  });


  app.post('/api/updateInvoicecrmMain', [
    check('invoicecrmId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside updateInvoicecrmMain api ")

    dlog(" STEP1 ")


    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(), 'validation error.', res, 999)
      }

      dlog(" STEP2 ")


      let filter = { _id: new ObjectId(req.body.invoicecrmId) }
      //  Invoicecrm.findById(req.body.invoicecrmId, function (err, invoicecrm) {

      dlog(" STEP3 ")


      dlog("invoicecrmObject in updateInvoicecrmMain == " + JSON.stringify(req.body))
      let invoicecrmRec = req.body
      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("invoicecrmDB Database connected successfully at post /updateProfile")


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()


        db.collection('invoicecrms').findOneAndUpdate(filter, req.body.fielchange, { returnOriginal: false }, function (error, response) {
          if (error) {
            database.close();
            return common.handleError(err, 'invoicecrm password could not be updated', res, 500)
          }
          let invoicecrm = response.value
          invoicecrmRec.alreadyTimes = parseInt(invoicecrmRec.alreadyTimes) + 1

          dlog(">>>invoicecrmRec.alreadyTimes in updateInvoicecrmMain == " + invoicecrmRec.alreadyTimes)
          if (req.body.couponCode && req.body.couponCode.trim() != "") {
            let couponObject = { couponId: invoicecrmRec.couponId, alreadyTimes: invoicecrmRec.alreadyTimes }

            dlog("couponObject ==" + JSON.stringify(couponObject))

            let updateCouponAlreadyUSedValue = "http://" + process.env.DOCTORAPPIPADDRESS + ":" + process.env.DOCTORAPPPORT + "/api/updateCoupons"


            request({
              url: updateCouponAlreadyUSedValue,
              method: 'POST',
              headers: {
                'content-Type': "application/json",
                'accept': "application/json"
              },
              body: JSON.stringify(couponObject)
            }
              , function (error, response, body) {

                dlog("couponObject updated successfully==new alreadyTimes value is " + invoicecrmRec.alreadyTimes)

                if (error) {
                  console.log("Coupon can't be created " + error)
                  return
                }
              });
          }

          database.close();
          return res.json({
            status: true,
            message: 'invoicecrm record update Success...',
            data: invoicecrm
          });

        });

        //  });
      });

    } catch (error) {
      console.error(error)
      return common.handleError(error, 'Invoicecrm password could not be updated', res, 500)

    }


  });


  app.post('/api/fetchInvoicecrms', function (req, res) {
    dlog(" inside fetchInvoicecrms api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchInvoicecrms")
        let filter = { "active": { $exists: true } }

        if (req.body.fetchInvoicecrmByCustomer == true) {
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

        db.collection('invoicecrms').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, invoicecrmArry) {
          let invoicecrmList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No invoicecrm record found', res, 500)
          }
          if (!invoicecrmArry || (invoicecrmArry && invoicecrmArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No invoicecrm record foundin Patient DB', res, 500)
          }


          database.close();
          getCustomerOrderDetailsPerInvoice(invoicecrmArry, res)

          /*
          return res.json({
            status: true,
            message: 'invoicecrm retrieval  successful.',
            data: invoicecrmList
          });
            */

        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }
  });


  app.post('/api/fetchInvoicecrmsByFilters', function (req, res) {
    dlog(" inside fetchInvoicecrmsByFilters api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      console.log("req.body == " + JSON.stringify(req.body))

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchInvoicecrms")


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

        db.collection('invoicecrms').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, invoicecrmArry) {
          let invoicecrmList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No invoicecrm record found', res, 500)
          }
          if (!invoicecrmArry || (invoicecrmArry && invoicecrmArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No invoicecrm record found', res, 500)
          }


          database.close();
          getCustomerOrderDetailsPerInvoice(invoicecrmArry, res)

          /*
          return res.json({
            status: true,
            message: 'invoicecrm retrieval  successful.',
            data: invoicecrmList
          });
            */

        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }
  });


  app.post('/api/fetchInvoicecrmsByFilterCount', function (req, res) {
    dlog(" inside fetchInvoicecrmsCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchInvoicecrms")

        /*
        let filter = {"active":{$exists:true}} 
                       
        if(req.body.fetchInvoicecrmByCustomer == true){
          filter = {"customerId":req.body.customerId}                           
        }
        */
        let filter = figureOutFilter(req.body.filter)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('invoicecrms').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No invoicecrm record found', res, 500)
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
            message: 'invoicecrm record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }
  });

  /*
    ************
   6. fetchInvoicecrms Count API
    ************
  */


  app.post('/api/fetchInvoicecrmsCount', function (req, res) {
    dlog(" inside fetchInvoicecrmsCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchInvoicecrms")


        let filter = { "active": { $exists: true } }

        if (req.body.fetchInvoicecrmByCustomer == true) {
          filter = { "customerId": req.body.customerId }
        }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('invoicecrms').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No invoicecrm record found', res, 500)
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
            message: 'invoicecrm record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoicecrm record', res, 500)

    }
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

  app.post('/api/fetch-all-invoicecrms-autocom', [
    check('name').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-invoicecrms api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-invoicecrms")

      let filter = { _id: new ObjectId(req.body.invoicecrmId) }

      db.collection('invoicecrms').find(filter).toArray(function (err, invoicecrmArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching invoicecrm ', res, 500)
        if (!invoicecrmArry || (invoicecrmArry && invoicecrmArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No invoicecrmArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Patient array retrieval success...',
          //data: doctorIdList
          data: invoicecrmArry
        });

      });

    });

  });
  app.post('/api/fetch-coupon-by-code', [
    check('couponCode').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-coupons api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-coupons")

      let filter = { coupon_code: req.body.couponCode }

      var todaydate = moment(new Date())

      db.collection('coupons').findOne(filter, function (err, couponRec) {


        if (err) {
          database.close();
          return common.handleError(err, 'Error, in fetching discount', res, 500)
        }

        if (!couponRec) {
          database.close();
          return common.handleError(err, ' No coupon record found with the given coupon code', res, 500)
        }

        let couponExpirydate = moment(couponRec.expiryDate)

        if (couponExpirydate.isBefore(todaydate)) {
          return common.handleError(err, ' This coupon has expired', res, 500)
        }

        if (parseInt(couponRec.maximumUseTimes) == parseInt(couponRec.alreadyTimes)) {
          return common.handleError(err, 'This coupon is already used maximum number of times', res, 500)
        }

        if (couponRec.paymentMode != 'All' && couponRec.paymentMode != req.body.paymentMode) {
          return common.handleError(err, 'This coupon can be used only when the payment mode is  ' + couponRec.paymentMode, res, 500)
        }

        database.close();
        return res.json({
          status: true,
          message: 'Coupon array retrieval success...',
          //data: doctorIdList
          data: couponRec
        });

      });

    });

  });


  app.post('/api/send-otp-dm', [
    check('phone').not().isEmpty().trim().escape(),
    check('otp').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }


    let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=" + common.smsAPIKEY + "&sender=DRSIGN&mobileno=" + req.body.phone + "&text=" + req.body.otp

    dlog("smsGatewayURL ==" + smsGatewayURL)

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



    return res.json({
      status: true,
      message: 'OTP Sent Success.fully..',
    });



  });


}