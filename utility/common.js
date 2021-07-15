
var moment = require('moment');

var sendemailid = 'info@drsignet.com'
var sendemailidpassword = 'k4dq31JQG}Q#'
var dlog = require('debug')('dlog')
var host = 'mail.drsignet.com'
//var host = 'smtp.gmail.com'
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../databaseconstant');
const Str = require('@supercharge/strings')
var nodemailer = require('nodemailer');
let htmlText, plainText = ''
var fs = require('fs');
const CARDPAYMENTFEESPERCENTAGE = 1;
const PDFDocument = require('pdfkit');
var request = require('request');
var FONTSIZE = 9
var LABELFONTSIZE = 10
var updateCROMINcoiceApiEndPoint = "http://" + process.env.DOCTORAPPIPADDRESS + ":" + process.env.DOCTORAPPPORT + "/api/updateInvoicecrmMain"
var ObjectId = require('mongodb').ObjectID

function percentCalculation(a, b) {
  var c = (parseFloat(a) * parseFloat(b)) / 100;
  return parseFloat(c);
}

const commonInvoiceCalculation = async (invoicecrmObject) => {

  let discountArray = await getAllDiscounts()
  let totalExtraDiscounts = parseFloat('0')


  invoicecrmObject.invoiceAmount = invoicecrmObject.allProductsTotal

  dlog("invoicecrmObject.invoiceAmount AT FIRST *************************  " + invoicecrmObject.invoiceAmount)

  //dlog("BEGIN :: APPLY ALL APPLICABLE DISCOUNTS *************************  ")
  try {
    discountArray.forEach(function (discount, index) {
      //dlog("discount   "+index+":"+ JSON.stringify(discount) )

      let discountAmount = 0.0
      let isDiscountValid = false
      if (discount.discountType == 'delivery_discount') {
        isDiscountValid = true
        //dlog("discount.discount_amount) == "+discountAmount)
      }

      // dlog("INSIDE totalExtraDiscounts  "+totalExtraDiscounts )

      if (discount.discountType == 'order_volume') {
        if (discount.logicType == 'greater_than') {
          if (parseFloat(invoicecrmObject.allProductsTotal) > parseFloat(discount.value)) {
            isDiscountValid = true

          }

        } else if (discount.logicType == 'in_between') {

          if (parseFloat(invoicecrmObject.allProductsTotal) > parseFloat(discount.lower_value) && parseFloat(invoicecrmObject.allProductsTotal) < parseFloat(discount.upper_value)) {
            isDiscountValid = true
          }

        } else if (discount.logicType == 'greater_than_equal_to') {

          if (parseFloat(invoicecrmObject.allProductsTotal) >= parseFloat(discount.value)) {
            isDiscountValid = true
          }

        } else if (discount.logicType == 'equal_to') {
          if (parseFloat(invoicecrmObject.allProductsTotal) == parseFloat(discount.value)) {
            isDiscountValid = true
          }
        }


      }

      if (isDiscountValid) {
        if (discount.byPercentAmount == 'by_value') {
          discountAmount = parseFloat(discount.discount_amount)
        } else if (discount.byPercentAmount == 'by_percent') {
          discountAmount = percentCalculation(invoicecrmObject.allProductsTotal, discount.discount_amount)
        }

        dlog("EXTRA DISCOUNT *****  " + discount.discountType + "==" + discountAmount)

        if (totalExtraDiscounts > 0) {
          totalExtraDiscounts = totalExtraDiscounts + discountAmount
        } else {
          totalExtraDiscounts = discountAmount
        }
      }

      // dlog("INSIDE 2 totalExtraDiscounts  "+totalExtraDiscounts )

    })
    //dlog("END :: APPLY ALL APPLICABLE DISCOUNTS *************************  ")
  } catch (e) {

    dlog("error == " + e)

  }

  invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.invoiceAmount) - totalExtraDiscounts

  dlog("LESS EXTRA DISCOUNT " + totalExtraDiscounts + " invoicecrmObject.invoiceAmount ==  " + invoicecrmObject.invoiceAmount)

  //dlog("BEGIN BEGIN :: COUPON VALUE IS APPLIED *************************  ")

  if (invoicecrmObject.couponCode && invoicecrmObject.couponCode.trim() != "") {
    invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.invoiceAmount) - parseFloat(invoicecrmObject.couponValue)
    dlog("LESS COUPON DISCOUNT " + parseFloat(invoicecrmObject.couponValue) + " invoicecrmObject.invoiceAmount ==  " + invoicecrmObject.invoiceAmount)
  }



  //dlog("END :: THE COUPON VALUE IS APPLIED *************************  ")

  //dlog("BEGIN :: APPLY ALL PRODUCTS DISCOUNTS *************************  ")
  invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.invoiceAmount) - parseFloat(invoicecrmObject.allProductsDiscount)

  dlog("LESS ALL PRODUCTS DEFAULT DISCOUNTs " + parseFloat(invoicecrmObject.allProductsDiscount) + " invoicecrmObject.invoiceAmount ==  " + invoicecrmObject.invoiceAmount)

  //dlog("END :: APPLY ALL PRODUCTS DISCOUNTS *************************   ")


  //dlog("totalExtraDiscounts  "+totalExtraDiscounts )


  invoicecrmObject.totalExtraDiscounts = totalExtraDiscounts.toFixed(2)

  invoicecrmObject.totalProductSgst = percentCalculation(invoicecrmObject.invoiceAmount, invoicecrmObject.totalProductSgst)

  invoicecrmObject.totalProductSgst = invoicecrmObject.totalProductSgst.toFixed(2)

  invoicecrmObject.totalProductCgst = percentCalculation(invoicecrmObject.invoiceAmount, invoicecrmObject.totalProductCgst)




  invoicecrmObject.totalProductCgst = invoicecrmObject.totalProductCgst.toFixed(2)

  invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.invoiceAmount) + parseFloat(invoicecrmObject.totalProductSgst)


  dlog("ADD totalProductSgst  " + parseFloat(invoicecrmObject.totalProductSgst) + " invoicecrmObject.invoiceAmount ==  " + invoicecrmObject.invoiceAmount)


  invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.invoiceAmount) + parseFloat(invoicecrmObject.totalProductCgst)

  dlog("ADD totalProductCgst  " + parseFloat(invoicecrmObject.totalProductCgst) + " invoicecrmObject.invoiceAmount ==  " + invoicecrmObject.invoiceAmount)

  invoicecrmObject.invoiceAmount = invoicecrmObject.invoiceAmount.toFixed(2)

  invoicecrmObject.invoiceAmount = parseFloat(invoicecrmObject.invoiceAmount) + parseFloat(invoicecrmObject.shippingCharge)


  dlog("ADD shippingCharge  " + parseFloat(invoicecrmObject.shippingCharge) + " invoicecrmObject.invoiceAmount ==  " + invoicecrmObject.invoiceAmount)


  //dlog("BEGIN :: CARD FEES ADDITION******************************  ")
  if (invoicecrmObject.paymentMode && invoicecrmObject.paymentMode.trim() != "" && invoicecrmObject.paymentMode.trim() == "Card") {
    let cardBasedPaymentFees = percentCalculation(invoicecrmObject.invoiceAmount, CARDPAYMENTFEESPERCENTAGE)
    //cardBasedPaymentFees = cardBasedPaymentFees.toFixed(2) 
    invoicecrmObject.cardBasedPaymentFees = cardBasedPaymentFees
    dlog("cardBasedPaymentFees  " + invoicecrmObject.cardBasedPaymentFees)

    invoicecrmObject.fielchange.cardBasedPaymentFees = cardBasedPaymentFees

    invoicecrmObject.invoiceAmount = cardBasedPaymentFees + parseFloat(invoicecrmObject.invoiceAmount)

    dlog("ADD cardBasedPaymentFees  " + cardBasedPaymentFees + " invoicecrmObject.invoiceAmount ==  " + invoicecrmObject.invoiceAmount)


  }



  invoicecrmObject.invoicecrmId = invoicecrmObject._id
  //dlog("END :: CARD FEES ADDITION******************************  ")
  invoicecrmObject.grossAmount = invoicecrmObject.invoiceAmount.toFixed(1)
  invoicecrmObject.invoiceAmount = invoicecrmObject.invoiceAmount.toFixed(1)
  //invoicecrmObject.grossAmount = Math.ceil(invoicecrmObject.invoiceAmount.toFixed(2))
  //invoicecrmObject.invoiceAmount = Math.ceil(invoicecrmObject.invoiceAmount.toFixed(2))


  invoicecrmObject.fielchange.invoiceAmount = invoicecrmObject.invoiceAmount
  invoicecrmObject.fielchange.grossAmount = invoicecrmObject.grossAmount
  invoicecrmObject.fielchange = { $set: invoicecrmObject.fielchange }

  setTimeout(() => {
    console.log("jambo");

    dlog("invoicecrmObject in commonInvoiceCalculation == " + JSON.stringify(invoicecrmObject))
    request({
      url: updateCROMINcoiceApiEndPoint,
      method: 'POST',
      headers: {
        'content-Type': "application/json",
        'accept': "application/json"
      },
      body: JSON.stringify(invoicecrmObject)
    }
      , function (error, response, body) {
        if (error) {
          console.log("Invoice can't be updated " + error)
          return
        }
      });
  }, 1000);


  //invoicecrmObject.invoiceAmount = invoicecrmObject.grossAmount

  return invoicecrmObject

}
const getAllDiscounts = async () => {
  return new Promise(resolve => {
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      let filter = { "active": { $exists: true } }
      db.collection('discounts').find(filter).toArray(function (err, discountArry) {

        if (err) {
          database.close();
          discountArry = []
          resolve(discountArry)
        }
        if (!discountArry || (discountArry && discountArry.length == 0)) {
          database.close();
          discountArry = []
          resolve(discountArry)
        }

        database.close();
        resolve(discountArry)
      })
    })

  });
}
//function handleError(err,message,res,code){
const handleError = (err, message, res, code) => {
  let errMsg
  if (code == 999) {
    errMsg = err
  } else {
    errMsg = err ? err.message : ""
  }
  //res.status(code)
  res.status(200)
  return res.json({
    status: false,
    message: message,
    error: errMsg
  });

}



const calculateShippingCharge = async (pin) => {

  return new Promise(resolve => {

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      let erroShippingChargeRecord = { err: 'noChargeFound' }

      let filter = { pinCode: pin, active: true }
      db.collection('deliveries').findOne(filter, function (error, shippingChargeRecord) {

        dlog("lshippingChargeRecord == " + JSON.stringify(shippingChargeRecord))


        if (error) {
          database.close();
          resolve(erroShippingChargeRecord)
          //return common.handleError(err, 'Error fetching patient record',res,500)                    
        }
        if (!shippingChargeRecord) {
          database.close();
          //return common.handleError(err, 'patient could not be found',res,500)                    
          resolve(erroShippingChargeRecord)
        }
        database.close();
        resolve(shippingChargeRecord)

      });
    })
    //locationNewArray.push(location)
    //resolve(locationNewArray)
    //resolve({location:location,patient:patient})
    //resolve(erroShippingChargeRecord) 




  })

}


const getCustomer = async (customerId) => {

  return new Promise(resolve => {

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      let erroShippingChargeRecord = { err: 'noChargeFound' }
      let cusFilter = { _id: new ObjectId(customerId) }
      db.collection('customers').findOne(cusFilter, function (error, customer) {

        dlog("customer at commong == " + JSON.stringify(customer))
        if (error) {
          database.close();
          resolve(error)
          //return common.handleError(err, 'Error fetching patient record',res,500)                    
        }
        if (!customer) {
          database.close();
          //return common.handleError(err, 'patient could not be found',res,500)                    
          resolve(customer)
        }
        resolve(customer)
      });

    })

  })

}


const genPDF = async (invoiceCrm) => {

  let pdfURL = ''
  try {

    dlog(" inside gen-pdf")

    // Create a document
    const doc = new PDFDocument({
      autoFirstPage: false
    });;
    doc.addPage({
      margin: 5
    });

    doc.switchToPage(0);

    let fileFirstPart
    if (process.env.ENVIRONMENT == "LOCAL") {
      fileFirstPart = "http://" + process.env.IPADDRESS + ":" + process.env.PORT
    } else {
      fileFirstPart = "http://" + process.env.IPADDRESS
    }


    let invoicPdfFilepath = "invoiceCrm" + "_" + invoiceCrm.orderId + "." + "pdf"

    pdfURL = fileFirstPart + "/public/pdf/" + invoicPdfFilepath

    let SECTIONGAP = 40
    let fileName = invoicPdfFilepath
    let pdfPath = process.env.PDF_FILEPATH
    doc.pipe(fs.createWriteStream(pdfPath + fileName));

    let imagePath = process.env.IMAGE_PATH


    let initialX = 260
    let initialY = 50
    let firstY = initialY
    let LINELENGTH = 580
    var INVOICEHEADERFONTSIZE = 10
    var BLESSCARENAMEEHEADERFONTSIZE = 14
    var NORMALTEXTFONTSIZE = 10
    var FIRSTPOINT = 20
    var REDFONT = "#800000"
    let MOBILENUMBER = "9090111100"

    doc.lineWidth(0.5);
    /*doc.fillColor("black")
      .fontSize(FONTSIZE)
      .moveTo(FIRSTPOINT, initialY)
      .lineTo(LINELENGTH, initialY) 
      .stroke();*/



    initialY = initialY + 10

    /***********************************************
     
    FIRST BLOCK ABOUT BLESS HEALTHCARE 
    
    **************************************************/

    doc.font('Times-Bold')
      .fillColor(REDFONT)
      .fontSize(INVOICEHEADERFONTSIZE)
      .moveTo(70, 100)
      .text('SALES INVOICE', initialX, initialY)
    initialY = initialY + 15

    doc.font('Times-Bold')
      .fillColor(REDFONT)
      .fontSize(BLESSCARENAMEEHEADERFONTSIZE)
      .moveTo(80, 100)
      .text('BLESS HEALTHCARE', initialX - 30, initialY)

    let mobileNUmberY = initialY
    initialY = initialY + 25

    doc.font('Times-Roman')
      .fontSize(INVOICEHEADERFONTSIZE)
      .moveTo(70, 100)
      .text("PLOT NO.190/2972, GOBINDA PRASAD, CANAL ROAD, BBSR BHUBANESHWAR-", initialX - 180, initialY);


    initialY = initialY + 15


    doc.font('Times-Roman')
      .fillColor("black")
      .fontSize(NORMALTEXTFONTSIZE)
      .moveTo(70, 100)
      .text('Mobile No.:-' + MOBILENUMBER, initialX + 170, mobileNUmberY)


    let secondLineY = initialY + 15

    doc.fillColor("black")
      .fontSize(FONTSIZE)
      .moveTo(FIRSTPOINT, secondLineY)
      .lineTo(LINELENGTH + 20, secondLineY)
      .stroke();


    /* END END :------ FIRST BLOCK ABOUT BLESS HEALTHCARE */






    /*LEFT BORDERS AND RIGHT BORDERS */


    let firstLineInsideBoxY = secondLineY


    /*END LEFT AND RIGHT BORDER */



    /***********************************************
     
    SECOND BLOCK ABOUT CUSTOMER NAME AND ADDRESS
    
    **************************************************/
    let invoiceNoDisplayY = initialY
    let invoiceDateDisplayY = initialY
    if (invoiceCrm.customer) {
      initialY = initialY + 25
      doc.font('Times-Bold')
        .fontSize(BLESSCARENAMEEHEADERFONTSIZE)
        .moveTo(FIRSTPOINT + 15, initialY)
        .text(invoiceCrm.customer.name, FIRSTPOINT + 15, initialY)

      let cahCardDisplayY = initialY
      initialY = initialY + 15
      doc.font('Times-Roman')
        .fontSize(INVOICEHEADERFONTSIZE)

        .moveTo(FIRSTPOINT + 15, initialY)
        .text("-" + invoiceCrm.customer.addressline1, FIRSTPOINT + 15, initialY)


      initialY = initialY + 15
      doc.font('Times-Roman')
        .fontSize(INVOICEHEADERFONTSIZE)
        .moveTo(FIRSTPOINT + 15, initialY)
        .text("-" + invoiceCrm.customer.addressline2, FIRSTPOINT + 15, initialY)

      invoiceNoDisplayY = initialY


      initialY = initialY + 15
      doc.font('Times-Roman')
        .fontSize(INVOICEHEADERFONTSIZE)
        .moveTo(FIRSTPOINT + 15, initialY)
        .text("-" + invoiceCrm.customer.area + "," + invoiceCrm.customer.po + "," + invoiceCrm.customer.pin, FIRSTPOINT + 15, initialY)


      initialY = initialY + 20

      doc.font('Times-Bold')
        .fontSize(INVOICEHEADERFONTSIZE)
        .text("Phone ", FIRSTPOINT + 15, initialY)

      doc.font('Times-Roman')
        .fontSize(INVOICEHEADERFONTSIZE)
        .text(" : " + " " + invoiceCrm.customer.mobileNumber, FIRSTPOINT + 15 + 45, initialY)



      invoiceDateDisplayY = initialY
      initialY = initialY + 20
      doc.font('Times-Bold')
        .fontSize(INVOICEHEADERFONTSIZE)
        .text("State Code ", FIRSTPOINT + 15, initialY)

      doc.font('Times-Roman')
        .fontSize(INVOICEHEADERFONTSIZE)
        .text(" : " + " " + invoiceCrm.customer.state, FIRSTPOINT + 15 + 45, initialY)

    }
    initialY = initialY + 20
    let drawVerticalLINELEMGTH = initialY - firstLineInsideBoxY
    doc.lineWidth(0.5);
    //START:- DRAW VERTICAL LINE to ECLOSE CASH/CARD DISPLAY
    doc.fillColor("black")
      .moveTo(FIRSTPOINT + 270, firstLineInsideBoxY)
      .lineTo(FIRSTPOINT + 270, initialY)
      .stroke();
    //invoiceCrm.paymentMode = 'CASH'

    if (invoiceCrm && invoiceCrm.paymentMode && invoiceCrm.paymentMode.trim() != '') {
      invoiceCrm.paymentMode = invoiceCrm.paymentMode.toUpperCase()
    }
    if (invoiceCrm && invoiceCrm.paymentMode && invoiceCrm.paymentMode == 'COD') {
      invoiceCrm.paymentMode = 'CASH'
    }

    doc.font('Times-Bold')
      .fontSize(BLESSCARENAMEEHEADERFONTSIZE)
      .text(invoiceCrm.paymentMode, FIRSTPOINT + 280, invoiceNoDisplayY)


    doc.fillColor("black")
      .moveTo(FIRSTPOINT + 330, firstLineInsideBoxY)
      .lineTo(FIRSTPOINT + 330, initialY)
      .stroke();
    // END :- DRAW VERTICAL LINE to ECLOSE CASH/CARD DISPLAY


    let invoiceNOX = FIRSTPOINT + 330 + 5
    doc.font('Times-Roman')
      .fontSize(INVOICEHEADERFONTSIZE)
      .text("Invoice No.   :", invoiceNOX, invoiceNoDisplayY)
    doc.font('Times-Bold')
      .fontSize(BLESSCARENAMEEHEADERFONTSIZE)
      .text(invoiceCrm._id, invoiceNOX + 75, invoiceNoDisplayY)

    let invoiceHumanReadableDate = ''

    if (invoiceCrm.invoiceDate) {
      invoiceHumanReadableDate = moment(invoiceCrm.invoiceDate).format('DD-MMM-YYYY')
    }
    doc.font('Times-Roman')
      .fontSize(INVOICEHEADERFONTSIZE)
      .text("Invoice Date    :" + " " + invoiceHumanReadableDate, invoiceNOX, invoiceDateDisplayY)

    //ENDING LINE OF THE SECOND BLOCK 
    doc.fillColor("black")
      .fontSize(FONTSIZE)
      .moveTo(FIRSTPOINT, initialY)
      .lineTo(LINELENGTH + 20, initialY)
      .stroke();

    let verticalLineTopY = initialY
    //MEDICINE ROW HEADER 

    initialY = initialY + 10

    let verticalLineBottomY = initialY + 15
    let descriptioHeaderX = FIRSTPOINT + 175
    let ROWHEADERMARGIN = 30
    let HEADERSLEFTMARGIN = 10
    let HEADERSRIGHTMARGIN = 10

    drawText(doc, "Description", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + ROWHEADERMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175, verticalLineTopY, verticalLineBottomY)
    drawText(doc, "HSN", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + 15, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, verticalLineBottomY)
    drawText(doc, "Qty", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, verticalLineBottomY)
    drawText(doc, "MRP", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN, verticalLineTopY, verticalLineBottomY)
    drawText(doc, "Rate", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, verticalLineTopY, verticalLineBottomY)
    drawText(doc, "Disc.", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, verticalLineTopY, verticalLineBottomY)

    drawText(doc, "Total", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20 + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, verticalLineBottomY)


    drawText(doc, "CGST%", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 10, verticalLineTopY, verticalLineBottomY)


    drawText(doc, "SGST%", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20 + ROWHEADERMARGIN + 20, initialY)
    //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+10+ROWHEADERMARGIN+ROWHEADERMARGIN,verticalLineTopY,verticalLineBottomY)



    initialY = initialY + 15
    doc.fillColor("black")
      .fontSize(FONTSIZE)
      .moveTo(FIRSTPOINT, initialY)
      .lineTo(LINELENGTH + 20, initialY)
      .stroke();
    verticalLineTopY = initialY

    for (var i in invoiceCrm.medicineList) {

      let medicine = invoiceCrm.medicineList[i]


      initialY = initialY + 15
      drawText(doc, medicine.medicineName, 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + ROWHEADERMARGIN, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175,verticalLineTopY,verticalLineBottomY)
      drawText(doc, medicine.hsnCode, 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + 15, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN,verticalLineTopY,verticalLineBottomY)
      drawText(doc, medicine.quantity, 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN,verticalLineTopY,verticalLineBottomY)
      drawText(doc, addZeroes(medicine.mrp), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSLEFTMARGIN,verticalLineTopY,verticalLineBottomY)
      drawText(doc, addZeroes(medicine.mrp), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN,verticalLineTopY,verticalLineBottomY)
      drawText(doc, addZeroes(medicine.discounts), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN,verticalLineTopY,verticalLineBottomY)

      drawText(doc, addZeroes(medicine.perProductTotal), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+20+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN,verticalLineTopY,verticalLineBottomY)


      drawText(doc, addZeroes(medicine.cGst), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+10,verticalLineTopY,verticalLineBottomY)


      drawText(doc, addZeroes(medicine.sGst), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20 + ROWHEADERMARGIN + 20, initialY)
      //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+10+ROWHEADERMARGIN+ROWHEADERMARGIN,verticalLineTopY,verticalLineBottomY)




    }

    let horizontlLineY = initialY + 80

    initialY = initialY + 80
    drawVeriticalLine(doc, FIRSTPOINT + 175, verticalLineTopY, horizontlLineY)

    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, horizontlLineY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, horizontlLineY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN, verticalLineTopY, horizontlLineY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, verticalLineTopY, horizontlLineY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, verticalLineTopY, horizontlLineY)

    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20 + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, horizontlLineY)


    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 10, verticalLineTopY, horizontlLineY)



    //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+10+ROWHEADERMARGIN+ROWHEADERMARGIN,verticalLineTopY,horizontlLineY)






    /*Draw a horizontal line now */
    doc.fillColor("black")
      .fontSize(FONTSIZE)
      .moveTo(FIRSTPOINT, horizontlLineY)
      .lineTo(LINELENGTH + 20, horizontlLineY)
      .stroke();


    verticalLineTopY = horizontlLineY
    verticalLineBottomY = initialY + 30
    initialY = initialY + 15

    drawText(doc, "", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + ROWHEADERMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175, verticalLineTopY, verticalLineBottomY)
    drawText(doc, "TOTAL", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + 15, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, verticalLineBottomY)
    drawText(doc, invoiceCrm.totalProductCount, 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, verticalLineBottomY)
    //drawText(doc,"MRP",'Times-Roman',INVOICEHEADERFONTSIZE,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSLEFTMARGIN,initialY)      
    //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSLEFTMARGIN,verticalLineTopY,verticalLineBottomY)
    //drawText(doc,"Rate",'Times-Roman',INVOICEHEADERFONTSIZE,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSLEFTMARGIN+HEADERSRIGHTMARGIN,initialY)      
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, verticalLineTopY, verticalLineBottomY)
    drawText(doc, addZeroes(invoiceCrm.allProductsDiscount), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN, verticalLineTopY, verticalLineBottomY)

    drawText(doc, addZeroes(invoiceCrm.allProductsTotal), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20 + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, verticalLineTopY, verticalLineBottomY)


    drawText(doc, addZeroes(invoiceCrm.totalProductCgst), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20, initialY)
    drawVeriticalLine(doc, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 10, verticalLineTopY, verticalLineBottomY)


    drawText(doc, addZeroes(invoiceCrm.totalProductSgst), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 20 + ROWHEADERMARGIN + 20, initialY)
    //drawVeriticalLine(doc,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+10+ROWHEADERMARGIN+ROWHEADERMARGIN,verticalLineTopY,verticalLineBottomY)




    initialY = initialY + 15
    doc.fillColor("black")
      .fontSize(FONTSIZE)
      .moveTo(FIRSTPOINT, initialY)
      .lineTo(LINELENGTH + 20, initialY)
      .stroke();
    let marginLeftEXTRA = 30

    initialY = initialY + 10
    let bigGROSSAMOUNTY = initialY
    drawText(doc, "Challan No. :", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + ROWHEADERMARGIN, initialY)
    initialY = initialY + 15
    drawText(doc, "No.Of Item :", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + ROWHEADERMARGIN, initialY)
    initialY = initialY + 15
    drawText(doc, "Amount of Tax Subject to Reverse Charges", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + ROWHEADERMARGIN, initialY)

    initialY = initialY + 15

    drawText(doc, "GROSS AMOUNT", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)

    drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)

    drawText(doc, addZeroes(invoiceCrm.allProductsTotal), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)

    bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15

    drawText(doc, "LESS DISC.", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)
    drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)
    drawText(doc, addZeroes(invoiceCrm.allProductsDiscount), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)

    if (invoiceCrm.totalExtraDiscounts && parseFloat(invoiceCrm.totalExtraDiscounts) > 0) {

      bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15
      drawText(doc, "LESS EXTRA DISC.", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)
      drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)
      drawText(doc, addZeroes(invoiceCrm.totalExtraDiscounts), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)
    }


    if (invoiceCrm.couponCode && invoiceCrm.couponCode.trim() != "") {

      bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15
      drawText(doc, "LESS COUPON DISC.", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)
      drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)
      drawText(doc, addZeroes(invoiceCrm.couponValue), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)
    }


    bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15

    drawText(doc, "ADD SHIPPING", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)
    drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)
    drawText(doc, addZeroes(invoiceCrm.shippingCharge), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)


    bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15


    drawText(doc, "ADD CGST", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)
    drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)
    drawText(doc, addZeroes(invoiceCrm.totalProductCgst), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)


    bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15

    drawText(doc, "ADD SGST", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)
    drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)
    drawText(doc, addZeroes(invoiceCrm.totalProductSgst), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)


    dlog("invoiceCrm.paymentMode in CREATEPDF ==" + invoiceCrm.paymentMode)
    if (invoiceCrm.paymentMode && invoiceCrm.paymentMode.trim() != "" && invoiceCrm.paymentMode.trim().toUpperCase() == "Card".toUpperCase()) {

      bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15

      drawText(doc, "ADD 1% Card Payment Fees", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)

      drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)

      drawText(doc, addZeroes(invoiceCrm.cardBasedPaymentFees), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)
    }
    /*
    bigGROSSAMOUNTY = bigGROSSAMOUNTY +15
  
    drawText(doc,"R/OFF AMT.",'Times-Roman',INVOICEHEADERFONTSIZE,FIRSTPOINT+175-20+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSLEFTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSLEFTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN,bigGROSSAMOUNTY)     
    drawText(doc,":",'Times-Roman',INVOICEHEADERFONTSIZE,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSLEFTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSLEFTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+90,bigGROSSAMOUNTY)      
    drawText(doc,addZeroes(dummyVal),'Times-Roman',INVOICEHEADERFONTSIZE,FIRSTPOINT+175+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+HEADERSLEFTMARGIN+HEADERSRIGHTMARGIN+HEADERSRIGHTMARGIN+HEADERSLEFTMARGIN+ROWHEADERMARGIN+ROWHEADERMARGIN+100,bigGROSSAMOUNTY)     
    */
    bigGROSSAMOUNTY = bigGROSSAMOUNTY + 15

    let grandTotal = invoiceCrm.grossAmount
    drawText(doc, "G.Total(Rs.)", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 - marginLeftEXTRA + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN, bigGROSSAMOUNTY)
    drawText(doc, ":", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 90, bigGROSSAMOUNTY)
    drawText(doc, addZeroes(grandTotal), 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, bigGROSSAMOUNTY)


    doc.fillColor("black")
      .fontSize(FONTSIZE)
      .moveTo(FIRSTPOINT, bigGROSSAMOUNTY + 30)
      .lineTo(LINELENGTH + 20, bigGROSSAMOUNTY + 30)
      .stroke();

    doc.rect(FIRSTPOINT, firstY, LINELENGTH, initialY + 250).stroke();

    let textAFterBoxY = bigGROSSAMOUNTY + 30 + 15
    //drawText(doc,"Authorised Signature",'Times-Roman',INVOICEHEADERFONTSIZE,FIRSTPOINT+ROWHEADERMARGIN,textAFterBoxY) 
    drawText(doc, "E.& O.E.", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + 175 + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + HEADERSLEFTMARGIN + HEADERSRIGHTMARGIN + HEADERSRIGHTMARGIN + HEADERSLEFTMARGIN + ROWHEADERMARGIN + ROWHEADERMARGIN + 100, textAFterBoxY)
    textAFterBoxY = textAFterBoxY + 15
    initialY = textAFterBoxY + 15
    drawText(doc, "All Subject to BHUBANESHWARJurisdiction Only.", 'Times-Roman', INVOICEHEADERFONTSIZE, FIRSTPOINT + ROWHEADERMARGIN, textAFterBoxY)



    initialY = initialY + 15




    doc.flushPages();
    doc.save()

    doc.end();


    return pdfURL

  } catch (err) {

    dlog(err)

    return pdfURL

  }

}
function addZeroes(num) {
  // Cast as number
  var num = Number(num);
  // If not a number, return 0
  if (isNaN(num)) {
    return 0;
  }
  // If there is no decimal, or the decimal is less than 2 digits, toFixed
  if (String(num).split(".").length < 2 || String(num).split(".")[1].length <= 2) {
    num = num.toFixed(2);
  }
  // Return the number
  return num;
}
const drawVeriticalLine = (doc, x, firstY, secondY) => {
  doc.fillColor("black")
    .moveTo(x, firstY)
    .lineTo(x, secondY)
    .stroke();
}

const drawText = (doc, text, font, fontSize, x, y, color) => {
  if (!color) {
    color = "black"
  }
  doc.fillColor(color)
    .font(font)
    .fontSize(fontSize)
    .text(text, x, y)

}



const sendHTMLemail = (data) => {
  new Promise((resolve, reject) => {

    let jsondata
    if (data.jsondata) {
      jsondata = data.jsondata
    }
    var toEmail
    toEmail = data.email
    subject = data.subject

    htmlText = data.emailTemplate ? data.emailTemplate : ''
    dlog("htmlText==" + htmlText)
    dlog("toEmail==" + toEmail)

    var transporter = nodemailer.createTransport({
      'host': host,
      port: 587,
      'auth': {
        'user': sendemailid,
        'pass': sendemailidpassword,

      },
      secure: false,
      tls: { rejectUnauthorized: false },
      debug: true
    });

    var sendEmail = transporter.templateSender({
      subject: subject,
      text: plainText,
      html: htmlText
    }, {
      from: sendemailid,
    });
    //  dlog("htmlText=="+htmlText)
    //  dlog("toEmail=="+toEmail)
    // use template based sender to send a message
    sendEmail({
      to: toEmail
    }, jsondata, function (err, info) {

      if (err) {
        resolve({ email_sent: false })
      } //reject(err)
      else resolve({ email_sent: true })

    });

  })
}

const main = async (uploadedFileName, inputCollection, fieldName, whichfiles) => {
  return new Promise((resolve, reject) => {

    if (uploadedFileName) {
      dlog("uploadedFileName :=" + uploadedFileName)

      fs.writeFile(uploadedFileName, inputCollection[fieldName], 'base64', function (err) {
        if (err)

          dlog("uploadedFileName created successfully");
        reject(err)

      });
    }

    resolve("file created at desired folder")
  })
}
const doFileProcessing = (inputCollection, whichfiles, uploadedFileNameSuf, fieldName, fieldNameURL) => {
  return new Promise((resolve, reject) => {
    let fileFirstPart;
    if (process.env.ENVIRONMENT == "LOCAL") {
      fileFirstPart = "http://" + process.env.IPADDRESS + ":" + process.env.PORT
    } else {
      fileFirstPart = "http://" + process.env.IPADDRESS
    }

    var staticImageDir = process.env.IMAGE_PATH
    /*
          const photoRandomString = Str.random(8)  
          dlog("photoRandomString ="+photoRandomString)
    
    
          let uploadedFileNameSuf = "OrderManualPrescription"+photoRandomString+"_"*/
    let uploadedFileName = staticImageDir + uploadedFileNameSuf + "." + process.env.IMAGEFILEEXT

    // inputCollection.uploadedFileURL = inputCollection.fileFirstPart + "/public/images/" + uploadedFileNameSuf+ "." + process.env.IMAGEFILEEXT

    inputCollection[fieldNameURL] = fileFirstPart + "/public/images/" + uploadedFileNameSuf + "." + process.env.IMAGEFILEEXT

    if (inputCollection[fieldName]) {
      inputCollection[fieldName] = inputCollection[fieldName].replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
    }

    /*
          if(inputCollection.uploadedFile){
            inputCollection.uploadedFile = inputCollection.uploadedFile.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
          }   
    */
    Promise.all([createFiles(staticImageDir), main(uploadedFileName, inputCollection, fieldName, whichfiles)])
      .then(() => { resolve(inputCollection); })
      .catch((error) => { reject(error) });

  })
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


function convertStringTodate(dateString) {

  var dateParts = dateString.split("-");

  dlog("before 1 add dateParts[0] =" + dateParts[0])
  //  let day  = dateParts[0]++ 

  // dlog("After 1 add dateParts[0] ="+dateParts[0])
  // month is 0-based, that's why we need dataParts[1] - 1

  let utcD = Date.UTC(dateParts[2], dateParts[1] - 1, dateParts[0],
    0, 0, 0);

  var newDate = new Date(utcD);

  // dateParts[1] = dateParts[1] 

  //let dateStringFUll = dateParts[2]+"-"+ dateParts[1]+"-"+ dateParts[0]+"T01:00"
  //dlog("dateStringFUll ="+dateStringFUll)
  //var newDate = new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);   
  //var newDate = new Date(dateStringFUll);   
  dlog("newDate =" + newDate.toDateString())

  // dlog("UTC day  ="+newDate.getUTCDay())

  return newDate
}
function valuePercent(a, b) {
  var c = (parseFloat(b) / parseFloat(a)) * 100;
  return parseFloat(c);
}
module.exports = {
  sendHTMLemail: sendHTMLemail,
  handleError: handleError,
  calculateShippingCharge: calculateShippingCharge,
  genPDF: genPDF,
  valuePercent, valuePercent,
  getCustomer: getCustomer,
  doFileProcessing: doFileProcessing,
  convertStringTodate: convertStringTodate,
  getAllDiscounts: getAllDiscounts,
  smsAPIKEY: "605c5cbbc7476",
  commonInvoiceCalculation: commonInvoiceCalculation,
  SERVER_KEY: 'AAAATSJpkA4:APA91bFV0SVGakaUAb_CmMTQP564wD_wvEPElqsE-eMvVIe3ZRaSHys-hhKHp-f6eGAZ8gIDLskMDXf30uTmPZSqOJyXtNp1QGAnMaF5_eLWfxeKnxw8sg4-nnFO5_eWocCFukaG8OXg',
  SENDER_ID: '331289825294'
}

