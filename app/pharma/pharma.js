
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


const qrcode = require('qrcode');
var fs = require('fs');

const getMonthlyorderstatepercent = async (req, res) => {
    let promises = []
    var d = new Date();
    var year = d.getFullYear();
    var month = req.body.month

    let filterAllRequests = { $and: [{ pharmacyId: req.body.pharmacyId }, { "$expr": { "$eq": [{ "$month": "$createdDate" }, parseInt(month)] } }, { "$expr": { "$eq": [{ "$year": "$createdDate" }, parseInt(year)] } }] }

    console.log("filterAllRequests" + JSON.stringify(filterAllRequests))

    promises.push(new Promise(resolve => {
        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            db.collection('pharma-orders').count(filterAllRequests,
                function (err, result) {

                    if (err) {
                        database.close();
                        resolve({ totalOrderCount: 0 })
                        console.error("Error while calculating totalOrderCount " + err)

                    }
                    database.close();
                    if (result == undefined) {
                        resolve({ totalOrderCount: 0 })
                    } else {
                        resolve({ totalOrderCount: result })
                    }

                });
        })
    }));

    let extra = "pending"


    let filterPending = { $and: [{ status: new RegExp(["^", extra, "$"].join(""), "i") }, { pharmacyId: req.body.pharmacyId }, { "$expr": { "$eq": [{ "$month": "$createdDate" }, parseInt(month)] } }, { "$expr": { "$eq": [{ "$year": "$createdDate" }, parseInt(year)] } }] }

    console.log("filterPending" + JSON.stringify(filterPending))

    promises.push(new Promise(resolve => {
        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            db.collection('pharma-orders').count(filterPending, function (err, result) {

                if (err) {
                    database.close();
                    resolve({ totalPendingOrderCount: 0 })
                    console.error("Error while calculating totalPendingOrderCount " + err)

                }
                database.close();
                if (result == undefined) {
                    resolve({ totalPendingOrderCount: 0 })
                } else {
                    resolve({ totalPendingOrderCount: result })
                }

            });
        })
    }));
    extra = "Accepted"

    let filterCOnfirmed = { $and: [{ status: new RegExp(["^", extra, "$"].join(""), "i") }, { pharmacyId: req.body.pharmacyId }, { "$expr": { "$eq": [{ "$month": "$createdDate" }, parseInt(month)] } }, { "$expr": { "$eq": [{ "$year": "$createdDate" }, parseInt(year)] } }] }

    console.log("filterCOnfirmed" + JSON.stringify(filterCOnfirmed))
    promises.push(new Promise(resolve => {
        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            db.collection('pharma-orders').count(filterCOnfirmed, function (err, result) {

                if (err) {
                    database.close();
                    resolve({ totalConfirmedOrderCount: 0 })
                    console.error("Error while calculating totalConfirmedOrderCount " + err)

                }
                database.close();
                if (result == undefined) {
                    resolve({ totalConfirmedOrderCount: 0 })
                } else {
                    resolve({ totalConfirmedOrderCount: result })
                }

            });
        })
    }));
    extra = "declined"


    let filterRejected = { $and: [{ status: new RegExp(["^", extra, "$"].join(""), "i") }, { pharmacyId: req.body.pharmacyId }, { "$expr": { "$eq": [{ "$month": "$createdDate" }, parseInt(month)] } }, { "$expr": { "$eq": [{ "$year": "$createdDate" }, parseInt(year)] } }] }
    promises.push(new Promise(resolve => {
        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            db.collection('pharma-orders').count(filterRejected, function (err, result) {

                if (err) {
                    database.close();
                    resolve({ totalRejectedOrderCount: 0 })
                    console.error("Error while calculating totalRejectedOrderCount " + err)

                }
                database.close();
                if (result == undefined) {
                    resolve({ totalRejectedOrderCount: 0 })
                } else {
                    resolve({ totalRejectedOrderCount: result })
                }

            });
        })
    }));


    Promise.all(promises).then(function (valuesArray) {

        let finalCountJson = {
        }
        dlog("valuesArray == " + JSON.stringify(valuesArray))

        valuesArray.forEach(function (values, index) {
            // let values = valuesArray[j]    
            dlog("values == " + JSON.stringify(values))

            dlog("values['totalOrderCount'] == " + values['totalOrderCount'])
            dlog("values['totalConfirmedOrderCount'] == " + values['totalConfirmedOrderCount'])

            dlog("values['totalRejectedOrderCount'] == " + values['totalRejectedOrderCount'])

            if (values['totalOrderCount'] != undefined) {
                finalCountJson["totalOrderCount"] = values['totalOrderCount']



            }
            if (values['totalConfirmedOrderCount'] != undefined) {
                finalCountJson["totalConfirmedOrderCount"] = values['totalConfirmedOrderCount']
                finalCountJson["totalConfirmedOrderCount"] = common.valuePercent(finalCountJson["totalOrderCount"], finalCountJson["totalConfirmedOrderCount"])
            }

            if (values["totalRejectedOrderCount"] != undefined) {
                finalCountJson["totalRejectedOrderCount"] = values['totalRejectedOrderCount']

                finalCountJson["totalRejectedOrderCount"] = common.valuePercent(finalCountJson["totalOrderCount"], finalCountJson["totalRejectedOrderCount"])
            }

            if (values['totalPendingOrderCount'] != undefined) {
                finalCountJson["totalPendingOrderCount"] = values['totalPendingOrderCount']

                finalCountJson["totalPendingOrderCount"] = common.valuePercent(finalCountJson["totalOrderCount"], finalCountJson["totalPendingOrderCount"])
            }

        })
        //OrderNewArray.push(values)

        dlog("finalCountJson == " + JSON.stringify(finalCountJson))

        // let finalOrderStatusArray = [{ "Confirmed": finalCountJson["totalConfirmedOrderCount"].toFixed(1) }, { "Rejected": finalCountJson["totalRejectedOrderCount"].toFixed(1) }, { "Pending": finalCountJson["totalPendingOrderCount"].toFixed(1) }]

        let finalOrderStatusArray = [finalCountJson["totalPendingOrderCount"] ? finalCountJson["totalPendingOrderCount"].toFixed(1) : 0, finalCountJson["totalConfirmedOrderCount"] ? finalCountJson["totalConfirmedOrderCount"].toFixed(1) : 0, finalCountJson["totalRejectedOrderCount"] ? finalCountJson["totalRejectedOrderCount"].toFixed(1) : 0]



        return res.json({
            status: true,
            message: 'Order Percents.',
            data: finalOrderStatusArray
        });

        // database.close();                          

    })
    //});


}

const getRegionWiseOrders = async (req, serviceAreaArry, res) => {
    let promises = []

    var d = new Date();
    for (var i in serviceAreaArry) {
        let areaName = serviceAreaArry[i]
        //
        let filter =
        {
            $and: [{ pharmacyId: req.body.pharmacyId }, { orderArray: { $elemMatch: { serviceArea: new RegExp(["^", areaName, "$"].join(""), "i") } } }]
        }
        console.log("filter" + JSON.stringify(filter))

        promises.push(new Promise(resolve => {
            let obj = {}
            //obj["rating" + i] = 0
            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                var db = database.db()
                db.collection('pharmacytasks').find(filter).toArray(function (err, taskArry) {
                    if (err) {
                        database.close();
                        obj["dummy"] = 0
                        resolve(obj)
                        console.error("Error while calculating totalRating5Count " + err)

                    }
                    database.close();
                    if (taskArry == undefined) {
                        obj["dummy"] = 0
                        resolve(obj)
                    } else {
                        let count = 0

                        for (var ta in taskArry) {
                            let task = taskArry[ta]
                            console.log("taskArry length : " + taskArry.length + " for areaname : " + areaName + " orderarray length :" + task.orderArray.length)
                            for (var ml in task.orderArray) {
                                let order = task.orderArray[ml]
                                if (order && order.serviceArea == areaName) {
                                    count = count + 1
                                }
                                console.log("count : " + count)
                            }
                        }
                        obj[areaName] = count
                        resolve(obj)
                    }

                });
            })
        }));
    }

    Promise.all(promises).then(function (valuesArray) {

        let finalCountJson = {
        }
        dlog("valuesArray == " + JSON.stringify(valuesArray))
        let totalRating = 0


        // valuesArray.forEach(function (values, index) {
        // let values = valuesArray[j]    
        //dlog("values == " + JSON.stringify(values))

        for (var i in serviceAreaArry) {
            let areaName = serviceAreaArry[i]
            for (var j in valuesArray) {
                let values = valuesArray[j]
                if (values[areaName] != undefined && areaName != "dummy" && values[areaName] > 0) {
                    finalCountJson[areaName] = values[areaName]
                    totalRating = totalRating + values[areaName]
                }
            }
        }

        let finalArrayOrdersPerRegion = []
        for (var k in serviceAreaArry) {
            let areaName = serviceAreaArry[k]

            if (finalCountJson[areaName])
                finalCountJson[areaName] = common.valuePercent(totalRating, finalCountJson[areaName])
            //finalCountJson[areaName] = finalCountJson[areaName].toFixed(1)
            if (finalCountJson[areaName] > 0)
                finalArrayOrdersPerRegion.push(finalCountJson[areaName].toFixed(1))
        }

        dlog("finalCountJson == " + JSON.stringify(finalCountJson))
        dlog("totalRating == " + totalRating)


        return res.json({
            status: true,
            message: 'Orders Per Region.',
            data: finalArrayOrdersPerRegion
        });

    })


}
const getRatingCount = async (req, res) => {
    let promises = []

    var d = new Date();
    for (var i = 5; i > 0; i--) {
        let extra = i
        let ratingString = "rating" + i
        dlog("ratingString ==" + ratingString)
        let filter =
        {
            $and: [{ pharmacyId: req.body.pharmacyId },
            { ratingValue: { "$gte": extra } }, { ratingValue: { "$lt": extra + 1 } }]
        }
        console.log("filter" + JSON.stringify(filter))

        promises.push(new Promise(resolve => {
            let obj = {}
            //obj["rating" + i] = 0
            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                var db = database.db()
                db.collection('pharma-orders').count(filter, function (err, result) {
                    if (err) {
                        database.close();
                        obj[ratingString] = 0
                        resolve(obj)
                        console.error("Error while calculating totalRating5Count " + err)

                    }
                    database.close();
                    if (result == undefined) {
                        obj[ratingString] = 0
                        resolve(obj)
                    } else {
                        obj[ratingString] = result
                        resolve(obj)
                    }

                });
            })
        }));
    }

    Promise.all(promises).then(function (valuesArray) {

        let finalCountJson = {
        }
        dlog("valuesArray == " + JSON.stringify(valuesArray))
        let totalRating = 0
        valuesArray.forEach(function (values, index) {
            // let values = valuesArray[j]    
            dlog("values == " + JSON.stringify(values))


            if (values['rating4'] != undefined) {
                finalCountJson["rating4"] = values['rating4']
                totalRating = totalRating + values['rating4']
            }
            if (values['rating5'] != undefined) {
                finalCountJson["rating5"] = values['rating5']
                totalRating = totalRating + values['rating5']
            }
            if (values['rating3'] != undefined) {
                finalCountJson["rating3"] = values['rating3']
                totalRating = totalRating + values['rating3']
            }
            if (values['rating2'] != undefined) {
                finalCountJson["rating2"] = values['rating2']
                totalRating = totalRating + values['rating2']
            }
            if (values['rating1'] != undefined) {
                finalCountJson["rating1"] = values['rating1']
                totalRating = totalRating + values['rating1']
            }

        })
        //appointmentNewArray.push(values)

        dlog("finalCountJson == " + JSON.stringify(finalCountJson))
        dlog("totalRating == " + totalRating)
        if (finalCountJson["rating2"])
            finalCountJson["rating2"] = common.valuePercent(totalRating, finalCountJson["rating2"])

        if (finalCountJson["rating5"])
            finalCountJson["rating5"] = common.valuePercent(totalRating, finalCountJson["rating5"])

        if (finalCountJson["rating4"])
            finalCountJson["rating4"] = common.valuePercent(totalRating, finalCountJson["rating4"])

        if (finalCountJson["rating3"])
            finalCountJson["rating3"] = common.valuePercent(totalRating, finalCountJson["rating3"])

        if (finalCountJson["rating1"])
            finalCountJson["rating1"] = common.valuePercent(totalRating, finalCountJson["rating1"])

        //  let finalratingCountArray = [{ 1: finalCountJson["rating1"].toFixed(1) }, { 2: finalCountJson["rating2"].toFixed(1) }, { 3: finalCountJson["rating3"].toFixed(1) }, { 4: finalCountJson["rating4"].toFixed(1) }, { 5: finalCountJson["rating5"].toFixed(0) }]
        let finalratingCountArray = [{ index: 5, value: finalCountJson["rating5"] ? finalCountJson["rating5"].toFixed(0) : 0 }, { index: 4, value: finalCountJson["rating4"] ? finalCountJson["rating4"].toFixed(0) : 0 }, { index: 3, value: finalCountJson["rating3"] ? finalCountJson["rating3"].toFixed(0) : 0 }, { index: 2, value: finalCountJson["rating2"] ? finalCountJson["rating2"].toFixed(0) : 0 }, { index: 1, value: finalCountJson["rating1"] ? finalCountJson["rating1"].toFixed(0) : 0 }]

        //let totalRatingCost = parseFloat(totalRatingGST)  + parseFloat(testObj.totalCost) 
        //totalRatingCost = totalRatingCost.toFixed(2)
        //.toFixed(0)  

        return res.json({
            status: true,
            message: 'Ratings.',
            data: finalratingCountArray
        });

        // database.close();                          

    })
    //});


}

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
            console.log("dateString == " + dateString)
            var dateParts = dateString.split("-");

            console.log("dateParts == " + JSON.stringify(dateParts))

            // month is 0-based, that's why we need dataParts[1] - 1
            var newDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], 0, 0, 0);


            //   var date = newDate.toISOString().split("T")[0]
            // inputCollection.createdDate = new Date(date);


            //const yesterday = new Date(newDate)
            const yesterday = new Date(new Date(dateParts[2], dateParts[1] - 1, dateParts[0], 0, 0, 0))
            yesterday.setDate(newDate.getDate())

            //yesterday.setDate(newDate.getDate() - 1)
            const tomorrow = new Date(newDate)
            tomorrow.setDate(newDate.getDate() + 1)
            fileterArray.push({ "createdDate": { "$gte": yesterday } })
            fileterArray.push({ "createdDate": { "$lte": tomorrow } })
            //let filter = {$and : [ { "createdDate" : {"$gt":yesterday }} ,{ "createdDate" : {"$lt":  tomorrow}} ]}  
        }
        //let finalFilter = {'$and':fileterArray}


        finalFilter = { '$and': fileterArray }
    } else {
        finalFilter = { "active": { $exists: true } }
    }
    return finalFilter
}
const getCustomerDetails = async (orderArry) => {
    let promises = []

    //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    orderArry.forEach(function (order, index) {

        // order.uploadedFile = ''
        //  order.medicineList = []
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

const getOrderDetails = async (taskArry) => {
    let promises = []
    let promisesOrders = []
    //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    taskArry.forEach(function (task, index) {
        let orderArray = task.orderArray
        let newArray = []
        promises.push(new Promise(resolve => {

            // order.uploadedFile = ''
            //  order.medicineList = []
            orderArray.forEach(function (order, index) {
                promisesOrders.push(new Promise(resolve => {

                    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                        var db = database.db()
                        let filter = { _id: new ObjectId(order.orderId) }
                        db.collection('pharma-orders').findOne(filter, function (error, orderRec) {
                            orderRec.uploadedFile = ''

                            if (error) {
                                database.close();
                                resolve(order)
                            }
                            if (!orderRec) {
                                resolve(order)
                            }
                            if (orderRec) {

                                order.uploadedFile = ''
                                order.medicineList = orderRec.medicineList
                                database.close()
                                resolve(order)
                                // newArray.push(orderRec)
                            }

                        });
                    });


                    //
                    //resolve(task)
                }));
            });

            Promise.all(promisesOrders).then(function (values) {

                task.orderArray = values

                resolve(task)
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


const getOrderListDetails = async (taskArry, res) => {

    taskArry = await getOrderDetails(taskArry)
    //  appointmentArry = await geteLocationDetails(appointmentArry)

    //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
    // database.close();                          
    return res.json({
        status: true,
        message: 'Customers retrieval successful.',
        data: taskArry
    });

}


//const fsp = require("fs/promises");
module.exports = function (app) {


    app.post('/api/addPharmaOrder', function (req, res) {
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


        let uploadedFileNameSuf = "OrderPrescription" + photoRandomString + "_"

        var inputCollection = req.body

        let fullProductPrice = 0.0
        for (var i in inputCollection.medicineList) {
            let med = inputCollection.medicineList[i]

            fullProductPrice = fullProductPrice + parseFloat(med.mrp) * parseFloat(med.quantity)
        }

        inputCollection.totalAmountPayableWDelivChg = fullProductPrice + parseFloat(inputCollection.deliveryCharge)
        inputCollection.fullProductPriceWODelivChg = fullProductPrice.toFixed(2)

        common.doFileProcessing(inputCollection, "prescription", uploadedFileNameSuf, "uploadedFile", "uploadedFileURL").then((result) => {
            inputCollection = result
            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                dlog("patientDBUrl Database connected successfully at post /addOrder")

                if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

                var db = database.db()
                MongoClient.connect(mongoDB.patientDBUrl, function (err, databasePaient) {
                    let dbPatient = databasePaient.db()
                    let filter = { _id: new ObjectId(req.body.patientId) };
                    dbPatient.collection('patient_profile_details').findOne(filter, function (error, customerRec) {
                        inputCollection.active = true
                        //collection_json.appointmentDate = newDate.toISOString()//newDate
                        inputCollection.createdDate = new Date()

                        if (customerRec) {

                            inputCollection.pinCode = customerRec.pinCode
                            inputCollection.shippingAddress = customerRec.presentAddress
                        }
                        if (req.body.serviceArea) {
                            inputCollection.serviceArea = req.body.serviceArea
                        } else {
                            inputCollection.serviceArea = "dummy"
                        }

                        dlog("customerRec =" + JSON.stringify(customerRec))

                        databasePaient.close();

                        db.collection('pharma-orders').insertOne(inputCollection, function (error, response) {
                            if (response) {
                                let order = response.ops[0]

                                //dlog("NEWLY added patient == "+JSON.stringify(patient))          

                                database.close();

                                if (error) {
                                    return common.handleError(error, 'DB Insert Fail...', res, 500)
                                }


                                return res.json({
                                    status: true,
                                    message: 'DB Insert Success...',
                                    data: order
                                });
                            }
                        });

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

    app.post('/api/fetchPharmaOrdersByFilters', function (req, res) {
        dlog(" inside fetchOrdersByFilters api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        try {
            dlog("orderBy = " + req.body.orderBy)
            let orderBy = req.body.orderBy
            if (!orderBy) {
                orderBy = "createdDate"
            }

            //  dlog("orderBy = " + orderBy)

            // orderBy = "\"" + orderBy + "\""
            let mySort = { orderBy: -1 }
            if (orderBy && orderBy == "createdDate") {
                mySort = { createdDate: -1 }
            } else if (orderBy && orderBy == "pinCode") {
                mySort = { pinCode: -1 }
            } else if (orderBy && orderBy == "serviceArea") {
                mySort = { serviceArea: -1 }
            }

            //  Patient.findById(req.body.patientId, function (err, patient) {

            console.log("fetchOrdersByFilters ====  == " + JSON.stringify(req.body))

            console.log("mySort ====  == " + JSON.stringify(mySort))

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

                db.collection('pharma-orders').find(filter).limit(perPage).skip(skipNumber).sort(mySort).toArray(function (err, orderArry) {
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


    app.post('/api/fetchPharmaOrdersByFilterCount', function (req, res) {
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
                db.collection('pharma-orders').count(filter, function (err, result) {

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


    app.post('/api/fetchPharmaAgentssByFilterCount', function (req, res) {
        dlog(" inside fetchPharmaAgentssByFilterCount api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        try {


            //  Patient.findById(req.body.patientId, function (err, patient) {

            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                dlog("doctorDB Database connected successfully at post /fetchOrders")

                /*
                let filter = {"active":{$exists:true}} 
                               
                if(req.body.fetchOrderByCustomer == true){
                  filter = {"customerId":req.body.customerId}                           
                }
                */
                let filter = figureOutFilter(req.body.filter)

                if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
                var db = database.db()
                db.collection('agents').count(filter, function (err, result) {

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
                        message: 'Agent record count API  successful.',
                        data: output
                    });


                });

            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving order record', res, 500)

        }
    });

    app.post('/api/fetchPharmaAgentssByFilters', function (req, res) {
        dlog(" inside fetchOrdersByFilters api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        try {
            dlog("orderBy = " + req.body.orderBy)
            let orderBy = req.body.orderBy
            if (!orderBy) {
                orderBy = "createdDate"
            }

            //  dlog("orderBy = " + orderBy)

            // orderBy = "\"" + orderBy + "\""
            let mySort = { orderBy: -1 }
            if (orderBy && orderBy == "createdDate") {
                mySort = { createdDate: -1 }
            } else if (orderBy && orderBy == "name") {
                mySort = { name: -1 }
            } else if (orderBy && orderBy == "email") {
                mySort = { email: -1 }
            } else if (orderBy && orderBy == "mobileNumber") {
                mySort = { mobileNumber: -1 }
            }

            //  Patient.findById(req.body.patientId, function (err, patient) {

            console.log("fetchOrdersByFilters ====  == " + JSON.stringify(req.body))

            console.log("mySort ====  == " + JSON.stringify(mySort))

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

                db.collection('agents').find(filter).limit(perPage).skip(skipNumber).sort(mySort).toArray(function (err, orderArry) {
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

    app.post('/api/fetchPharmaManagetasksByFilterCount', function (req, res) {
        dlog(" inside fetchPharmaAgentssByFilterCount api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        try {


            //  Patient.findById(req.body.patientId, function (err, patient) {

            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                dlog("doctorDB Database connected successfully at post /fetchOrders")

                /*
                let filter = {"active":{$exists:true}} 
                               
                if(req.body.fetchOrderByCustomer == true){
                  filter = {"customerId":req.body.customerId}                           
                }
                */
                let filter = figureOutFilter(req.body.filter)

                if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
                var db = database.db()
                db.collection('pharmacytasks').count(filter, function (err, result) {

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
                        message: 'Task record count API  successful.',
                        data: output
                    });


                });

            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving order record', res, 500)

        }
    });

    app.post('/api/fetchPharmaManagetasksByFilters', function (req, res) {
        dlog(" inside fetchPharmaManagetasksByFilters api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        try {
            dlog("orderBy = " + req.body.orderBy)
            let orderBy = req.body.orderBy
            if (!orderBy) {
                orderBy = "createdDate"
            }

            //  dlog("orderBy = " + orderBy)

            // orderBy = "\"" + orderBy + "\""
            let mySort = { orderBy: -1 }
            if (orderBy && orderBy == "createdDate") {
                mySort = { createdDate: -1 }
            } else if (orderBy && orderBy == "Packaging") {
                mySort = { packaging: -1 }
            } /*
             else if (orderBy && orderBy == "serviceArea") {
                mySort = { serviceArea: -1 }
            } else if (orderBy && orderBy == "shoppingAddress") {
                mySort = { shoppingAddress: -1 }
            }
            */

            //  Patient.findById(req.body.patientId, function (err, patient) {

            console.log("fetchOrdersByFilters ====  == " + JSON.stringify(req.body))

            console.log("mySort ====  == " + JSON.stringify(mySort))

            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                dlog(" Database connected successfully at post /fetchOrders")


                let filter = figureOutFilter(req.body.filter)
                console.log("finalFilter == " + JSON.stringify(filter))

                var pageno = req.body.pageNo
                var perPage = req.body.perPage
                var skipNumber = (pageno - 1) * perPage
                dlog("pageno " + pageno)
                dlog("perPage " + perPage)
                dlog("skipNumber " + skipNumber)

                if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
                var db = database.db()

                db.collection('pharmacytasks').find(filter).limit(perPage).skip(skipNumber).sort(mySort).toArray(function (err, taskArry) {

                    if (err) {
                        database.close();
                        return common.handleError(err, 'Error, No order record found', res, 500)
                    }
                    if (!taskArry || (taskArry && taskArry.length == 0)) {
                        database.close();
                        return common.handleError(err, 'No order record found', res, 500)
                    }
                    database.close();
                    //getOrderListDetails(taskArry, res)


                    return res.json({
                        status: true,
                        message: 'pharmacytasks retrieval  successful.',
                        data: taskArry
                    });



                });
            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving order record', res, 500)

        }
    });


    app.post('/api/fetchPharmaManagetasksByAgentId', function (req, res) {
        dlog(" inside fetchPharmaManagetasksByAgentId api req.body.agentId == " + req.body.agentId)

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        try {
            dlog("orderBy = " + req.body.orderBy)
            let orderBy = req.body.orderBy
            if (!orderBy) {
                orderBy = "createdDate"
            }

            //  dlog("orderBy = " + orderBy)

            // orderBy = "\"" + orderBy + "\""
            let mySort = { orderBy: -1 }
            if (orderBy && orderBy == "createdDate") {
                mySort = { createdDate: -1 }
            } else if (orderBy && orderBy == "Packaging") {
                mySort = { packaging: -1 }
            }
            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                dlog(" Database connected successfully at post /fetchOrders")


                let filter = { agentId: req.body.agentId }
                console.log("finalFilter == " + JSON.stringify(filter))


                if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
                var db = database.db()

                db.collection('pharmacytasks').find(filter).sort(mySort).toArray(function (err, taskArry) {

                    if (err) {
                        database.close();
                        return common.handleError(err, 'Error, No order record found', res, 500)
                    }
                    if (!taskArry || (taskArry && taskArry.length == 0)) {
                        database.close();
                        return common.handleError(err, 'No order record found', res, 500)
                    }
                    database.close();
                    //getOrderListDetails(taskArry, res)


                    return res.json({
                        status: true,
                        message: 'Pharmacy tasks retrieval  successful.',
                        data: taskArry
                    });



                });
            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving order record', res, 500)

        }
    });


    app.post('/api/fetchPharmatasksCountDelivery', function (req, res) {
        dlog(" inside fetchPharmatasksCountDelivery api  ")
        let promises = []

        try {
            dlog("orderBy = " + req.body.orderBy)
            let orderBy = req.body.orderBy
            if (!orderBy) {
                orderBy = "createdDate"
            }

            //  dlog("orderBy = " + orderBy)

            // orderBy = "\"" + orderBy + "\""
            let mySort = { orderBy: -1 }
            if (orderBy && orderBy == "createdDate") {
                mySort = { createdDate: -1 }
            } else if (orderBy && orderBy == "packaging") {
                mySort = { packaging: -1 }
            } /*
             else if (orderBy && orderBy == "serviceArea") {
                mySort = { serviceArea: -1 }
            } else if (orderBy && orderBy == "shoppingAddress") {
                mySort = { shoppingAddress: -1 }
            }
            */

            //  Patient.findById(req.body.patientId, function (err, patient) {

            console.log("fetchOrdersByFilters ====  == " + JSON.stringify(req.body))

            console.log("mySort ====  == " + JSON.stringify(mySort))

            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                dlog(" Database connected successfully at post /fetchOrders")
                //  monthArry.forEach(function(month, index){
                let daysInMonth = moment().daysInMonth();
                // for (let i = daysInMonth; i > 0; i--) {

                for (var i = 1; i <= daysInMonth; i++) {
                    promises.push(new Promise(resolve => {

                        let filter = req.body.filter
                        let andPartArray = filter['$and']
                        andPartArray.push({ 'createdDate': i + "-" + req.body.month + "-" + req.body.year })
                        filter = { '$and': andPartArray }

                        // console.log("BEFORE PROCESSING filter == " + JSON.stringify(filter))


                        filter = figureOutFilter(filter)
                        console.log("After processing Filter == " + JSON.stringify(filter))

                        var pageno = req.body.pageNo
                        var perPage = req.body.perPage
                        var skipNumber = (pageno - 1) * perPage
                        dlog("pageno " + pageno)
                        dlog("perPage " + perPage)
                        dlog("skipNumber " + skipNumber)

                        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
                        var db = database.db()

                        db.collection('pharmacytasks').find(filter).toArray(function (err, taskArray) {


                            if (err) {
                                database.close();
                            }
                            // dlog("taskArray ==" + JSON.stringify(taskArray))

                            // resolve(taskArray)
                            if (!taskArray || (taskArray && taskArray.length == 0)) {
                                // database.close();

                                //return common.handleError(err, 'patient could not be found',res,500)                    
                                //  colAgent.rating = 0
                                //(taskArray)
                            }
                            if (taskArray || (taskArray && taskArray.length > 0)) {
                                dlog("taskArray Agent" + JSON.stringify(taskArray))

                                resolve(taskArray)
                            }

                        });

                    }))
                }
                Promise.all(promises).then(function (values) {
                    // dlog("values ==" + JSON.stringify(values))
                    let netresult = []

                    for (var i in values) {
                        var arrayEl = values[i]
                        var arrayEl = values[i]
                        let sumTotal = 0
                        let date
                        if (arrayEl && arrayEl.length > 0) {
                            for (var j in arrayEl) {

                                sumTotal = sumTotal + arrayEl[j].totalToBeCollectedPerTask
                                date = arrayEl[j].createdDate
                            }
                            netresult.push({ totalAmountReceived: sumTotal.toFixed(2), totalNoDeliveries: arrayEl.length, date: date })
                        } else {
                            continue
                        }
                    }
                    database.close();
                    return res.json({
                        status: true,
                        message: ' fetch monthly record counts Success...',
                        data: netresult
                    });
                })


            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving order record', res, 500)

        }
    });



    app.post('/api/updatePharmaOrder', [
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

        let uploadedFileNameSuf = "OrderPrescription" + photoRandomString + "_"

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


                    if (req.body.ratingValue) {
                        fielchange.ratingValue = req.body.ratingValue
                    }

                    if (req.body.feedback && req.body.feedback.trim() != "") {
                        fielchange.feedback = req.body.feedback
                    }


                    if (req.body.medicineList)
                        fielchange.medicineList = req.body.medicineList


                    //  let filterCustomer = { _id: new ObjectId(req.body.customerId) }

                    if (req.body.status && req.body.status.trim() != "") {
                        fielchange.status = req.body.status
                        const statusStr = fielchange.status
                        /*
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
                                    })*/
                    }


                    if (req.body.taskCreatedForThisOrder == false) {
                        fielchange.taskCreatedForThisOrder = false
                    }
                    if (req.body.taskCreatedForThisOrder == true) {
                        fielchange.taskCreatedForThisOrder = true
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
                    db.collection('pharma-orders').findOne(filter, function (err, orderRec) {

                        if (err) {
                            database.close();
                            return common.handleError(err, 'Error, in fetching order', res, 500)
                        }

                        if (!orderRec) {
                            database.close();
                            return common.handleError(err, ' No order record found with the given order ID', res, 500)
                        }

                        db.collection('pharma-orders').findOneAndUpdate(filter, fielchange, { returnOriginal: false }, function (error, response) {
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

    app.post('/api/addObjectArray', function (req, res) {
        //try{    
        dlog(" inside addObjectArray api  ")

        var objectArray = req.body.objectArray

        var endPoint = "http://" + process.env.DOCTORAPPIPADDRESS + ":" + process.env.DOCTORAPPPORT + "/api/addObject"
        //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        objectArray.forEach(function (object, index) {
            object.type = req.body.type
            request({
                url: endPoint,
                method: 'POST',
                headers: {
                    'content-Type': "application/json",
                    'accept': "application/json"
                },
                body: JSON.stringify(object)
            }
                , function (error, response, body) {
                    if (error) {
                        return common.handleError(error, 'Failed to save object', res, 500)
                    }

                });
        })

    });


    app.post('/api/updatePharmaManagetask', [
        check('pharmaTaskId').not().isEmpty().trim().escape()
    ], function (req, res) {
        dlog(" inside updatePharmaTask api ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }
        var collection_json = req.body
        collection_json.updatedDate = new Date()
        collection_json.updatedBy = req.body.updatedBy


        //dlog(" inside editUser req body  " + JSON.stringify(req.body))
        let filter = { _id: new ObjectId(req.body.pharmaTaskId) }
        // let filter  = {_id :  new ObjectId(ObjectId(req.body.userId).toString())}

        //  dlog("req.body.role == " + JSON.stringify(req.body.role))

        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            dlog("doctorDB Database connected successfully at post /pharmaTaskId")
            var db = database.db()
            var collection_json = req.body
            collection_json.updatedDate = new Date()

            let fielchange = {}
            if (req.body.agentId && req.body.agentId.trim() != "")
                fielchange.agentId = req.body.agentId

            if (req.body.agentName && req.body.agentName.trim() != "")
                fielchange.agentName = req.body.agentName

            if (req.body.uploadedFileURL && req.body.uploadedFileURL.trim() != "")
                fielchange.uploadedFileURL = req.body.uploadedFileURL

            if (req.body.agentTaskAcceptStatus && req.body.agentTaskAcceptStatus.trim() != "")
                fielchange.agentTaskAcceptStatus = req.body.agentTaskAcceptStatus

            if (req.body.packaging && req.body.packaging.trim() != "")
                fielchange.packaging = req.body.packaging


            if (req.body.payment
                && req.body.payment
                    .trim() != "")
                fielchange.payment = req.body.payment


            //if (req.body.payment && (req.body.payment == "done" || req.body.payment == "Done")) {
            //   fielchange.delivery = "done"
            // }

            if (req.body.delivery && req.body.delivery.trim() != "")
                fielchange.delivery = req.body.delivery


            if (req.body.active == false) {
                fielchange.active = false
            }
            if (req.body.active == true) {
                fielchange.active = true
            }
            fielchange.updatedDate = new Date()


            if (req.body.updatedBy && req.body.updatedBy.trim() != "")
                fielchange.updatedBy = req.body.updatedBy

            dlog("fielchange == " + JSON.stringify(fielchange))
            db.collection('pharmacytasks').findOne(filter, function (err, pharmaTaskRec) {

                if (err) {
                    database.close();
                    return common.handleError(err, 'Error, in fetching user with given ID', res, 500)
                }
                //if (pharmaTaskRec && req.body.orderId) {
                if (pharmaTaskRec) {
                    for (var i in pharmaTaskRec.orderArray) {

                        if (req.body.payment == "done" || req.body.payment == "Done") {
                            pharmaTaskRec.orderArray[i].paymentStatus = "done"
                            pharmaTaskRec.orderArray[i].deliveryStatus = "done"
                        }
                        if (pharmaTaskRec.orderArray[i]['_id'] == req.body.orderId) {
                            if (req.body.pickupStatus && req.body.pickupStatus.trim() != "") {
                                pharmaTaskRec.orderArray[i].pickupStatus = req.body.pickupStatus
                            }
                            if (req.body.paymentStatus && req.body.paymentStatus.trim() != "") {
                                pharmaTaskRec.orderArray[i].paymentStatus = req.body.paymentStatus
                            }
                            if (req.body.deliveryStatus && req.body.deliveryStatus.trim() != "") {
                                pharmaTaskRec.orderArray[i].deliveryStatus = req.body.deliveryStatus
                            }
                        }/* else {
                            continue
                        }*/
                        if (req.body.packaging && req.body.packaging.trim() == "Initiated") {
                            //const token = Str.random(10)

                            let infoQrCode = "orderid: " + pharmaTaskRec.orderArray[i]['_id']

                            let fileUrLFirstPart
                            if (process.env.ENVIRONMENT == "LOCAL") {
                                fileUrLFirstPart = "http://" + process.env.IPADDRESS + ":" + process.env.PORT
                            } else {
                                fileUrLFirstPart = "http://" + process.env.IPADDRESS
                            }
                            var staticImageDir = process.env.IMAGE_PATH
                            let fileName = staticImageDir + pharmaTaskRec.orderArray[i]['_id'] + "_qrocode" + "." + process.env.IMAGEFILEEXT
                            var fileURL = fileUrLFirstPart + "/public/images/" + pharmaTaskRec.orderArray[i]['_id'] + "_qrocode" + "." + process.env.IMAGEFILEEXT

                            pharmaTaskRec.orderArray[i].qrCodeURL = fileURL

                            console.log("infoQrCode == " + infoQrCode)
                            dlog("Qr Code url :== " + pharmaTaskRec.orderArray[i].qrCodeURL)

                            qrcode.toDataURL(infoQrCode).then(qrCodeImage => {
                                qrCodeImage = qrCodeImage.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
                                fs.writeFile(fileName, qrCodeImage, 'base64', function (err) {
                                    if (err)
                                        return common.handleError(err, ' qrCOde could not be save to file ...', res, 200)
                                    dlog("fileName save successfully ");
                                    return fileURL
                                });

                            })
                        }


                    }
                    fielchange.orderArray = pharmaTaskRec.orderArray
                }

                fielchange = { $set: fielchange }
                if (!pharmaTaskRec) {
                    database.close();
                    return common.handleError(err, ' No user record found with the given user ID', res, 500)
                }

                db.collection('pharmacytasks').updateOne(filter, fielchange, function (error, response) {
                    if (error) {
                        console.error(error)
                        database.close();
                        return common.handleError(err, 'User record could not be updated', res, 500)
                    }
                    let pharmaTask = response.value
                    database.close();
                    return res.json({
                        status: true,
                        message: 'pharmacytasks Update Success...',
                        data: pharmaTask
                    });

                });

            });

        });


    })

    app.post('/api/view-ratingcounts', function (req, res) {
        dlog(" inside view-ratingcounts api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'Validation error.', res, 999)
        }
        getRatingCount(req, res)
    });

    app.post('/api/view-monthlyorderstatepercent', [
        check('month').not().isEmpty().trim().escape(),
    ], function (req, res) {
        dlog(" inside monthlyorderstatepercent api  ")

        //  let month = moment( "FEB",'MMM').format("MM")
        // console.log("month == " + month)

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'Validation error.', res, 999)
        }
        getMonthlyorderstatepercent(req, res)

    });

    app.post('/api/fetch-orders-per-region', function (req, res) {
        dlog(" inside fetch-orders-per-region api  ")


        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

            var db = database.db()


            if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

            dlog(" Database connected successfully at fetch-orders-per-region")

            let filter = { pharmacyId: req.body.pharmacyId }

            db.collection('serviceareas-pharma').find(filter).toArray(function (err, serviceAreaArry) {

                if (err) return common.handleError(err, 'Error, No doctor record found with the given specialty ', res, 500)
                if (!serviceAreaArry || (serviceAreaArry && serviceAreaArry.length == 0)) {
                    database.close();
                    return common.handleError(err, 'No serviceAreaArry record found for the given pharmacy', res, 500)
                }

                database.close();
                let newServiceAreaArry = []

                for (var i in serviceAreaArry) {
                    let areaName = serviceAreaArry[i].areaName
                    if (newServiceAreaArry.length == 0 || !newServiceAreaArry.includes(areaName)) {
                        newServiceAreaArry.push(areaName)
                    }
                }

                getRegionWiseOrders(req, newServiceAreaArry, res)


            });

        });

    });

    app.post('/api/getTotalClosedDealsEachDay', function (req, res) {
        dlog(" inside getTotalClosedDealsEachDay api  ")
        let promises = []

        try {

            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                var db = database.db()
                dlog(" Database connected successfully at post /fetchOrders")
                //  monthArry.forEach(function(month, index){
                var d = new Date();
                var year = d.getFullYear();
                // let date = moment('MMM', req.body.month)
                let month = moment(req.body.month, 'MMM').format("MM")
                console.log("month == " + month)

                let daysInMonth = moment(req.body.month, 'MMM').daysInMonth();
                console.log("daysInMonth == " + daysInMonth)
                for (var i = 1; i <= daysInMonth; i++) {
                    let day = i + " " + req.body.month
                    promises.push(new Promise(resolve => {


                        let deliveryStatus = "done"
                        let paymentStatus = "done"
                        var newDate = new Date(year, month - 1, i, 0, 0, 0);
                        const yesterday = new Date(newDate)
                        yesterday.setDate(newDate.getDate())


                        const tomorrow = new Date(newDate)
                        tomorrow.setDate(newDate.getDate() + 1)

                        let filter = {
                            $and: [{ pharmacyId: req.body.pharmacyId }, { "createdDate": { "$gte": yesterday } },
                            { "createdDate": { "$lte": tomorrow } },
                            { "delivery": new RegExp(["^", deliveryStatus, "$"].join(""), "i") },
                            { "payment": new RegExp(["^", paymentStatus, "$"].join(""), "i") }]
                        }
                        console.log("filter" + JSON.stringify(filter))
                        db.collection('pharmacytasks').count(filter, function (err, result) {

                            let deals = {}
                            if (err) {
                                database.close();
                                deals[day] = 0
                                resolve(0)
                                console.error("Error while calculating totalClosedDeals " + err)

                            }
                            database.close();
                            if (result == undefined) {
                                deals[day] = 0
                                resolve(0)
                            } else {
                                deals[day] = result
                                resolve(result)
                            }

                        });

                    }))
                }
                Promise.all(promises).then(function (valuesArray) {
                    return res.json({
                        status: true,
                        message: 'Closed deals per day.',
                        data: valuesArray
                    });
                })

            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving order record', res, 500)

        }
    });


    app.post('/api/getAvgRatingPharmacy', function (req, res) {
        dlog(" inside getAvgRatingPharmacy api  ")


        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

            var db = database.db()


            if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

            dlog(" Database connected successfully at getAvgRatingPharmacy")

            db.collection('pharma-orders').aggregate(
                [
                    {
                        "$match": {
                            "pharmacyId": req.body.pharmacyId
                        }
                    },
                    {
                        $group:
                        {
                            _id: { "pharmacyId": req.body.pharmacyId },
                            avgRating: { $avg: "$ratingValue" }
                        }
                    }
                ]
            ).toArray(function (err, ratingArray) {

                dlog("ratingArray Cole Agent" + JSON.stringify(ratingArray))



                if (err) {
                    database.close();
                    return common.handleError(err, 'Error fetching average rating of pharmacy', res, 500)
                }
                let rating = 0
                if (ratingArray && ratingArray.length > 0 && ratingArray[0] && ratingArray[0].avgRating && ratingArray[0].avgRating != null && ratingArray[0].avgRating.toFixed(1)) {
                    rating = ratingArray[0].avgRating.toFixed(1)
                }
                dlog("ratingArray[0].avgRating " + rating)
                database.close();
                return res.json({
                    status: true,
                    message: 'Average rating of pharmacy',
                    data: rating
                });

            });

        });

    });

    app.post('/api/fetchRatingReviews', function (req, res) {
        dlog(" inside fetchPharmaOrdersRatingandReview api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        try {
            dlog("orderBy = " + req.body.orderBy)
            let orderBy = req.body.orderBy
            if (!orderBy) {
                orderBy = "createdDate"
            }

            //  dlog("orderBy = " + orderBy)

            // orderBy = "\"" + orderBy + "\""
            let mySort = { orderBy: -1 }
            if (orderBy && orderBy == "createdDate") {
                mySort = { createdDate: -1 }
            } else if (orderBy && orderBy == "ratingValue") {
                mySort = { ratingValue: -1 }
            }

            //  Patient.findById(req.body.patientId, function (err, patient) {

            console.log("fetchOrdersByFilters ====  == " + JSON.stringify(req.body))

            console.log("mySort ====  == " + JSON.stringify(mySort))

            MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
                //   assert.equal(null, err);
                dlog("patientDB Database connected successfully at post /fetchOrders")
                let filter = figureOutFilter(req.body.filter)
                //  console.log("finalFilter == "+JSON.stringify(finalFilter))

                // var pageno = req.body.pageNo
                // var perPage = 300 //req.body.perPage
                // var skipNumber = 0//(pageno - 1) * perPage
                //  dlog("pageno " + pageno)
                // dlog("perPage " + perPage)
                // dlog("skipNumber " + skipNumber)

                if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
                var db = database.db()
                //.limit(perPage).skip(skipNumber)
                db.collection('pharma-orders').find(filter).sort(mySort).toArray(function (err, orderArry) {

                    if (err) {
                        database.close();
                        return common.handleError(err, 'Error, No order record found', res, 500)
                    }
                    if (!orderArry || (orderArry && orderArry.length == 0)) {
                        database.close();
                        return common.handleError(err, 'No order record found', res, 500)
                    }
                    let orderList = []
                    for (var i in orderArry) {
                        let order = orderArry[i]
                        if (!order.feedback) {
                            order.feedback = "--No Comment Left By Client--"
                        }
                        delete order['uploadedFile']
                        delete order['medicineList']
                        orderList.push(order)
                    }

                    database.close();
                    return res.json({
                        status: true,
                        message: 'Order with ratings retrieval successful.',
                        data: orderArry
                    });


                });
            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving order record', res, 500)

        }
    });

    app.post('/api/send-otp-delivryapp', [
        check('mobileNumber').not().isEmpty().trim().escape(),
        check('otp').not().isEmpty().trim().escape()
    ], function (req, res) {
        dlog(" inside login api  ")

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return common.handleError(errors.array(), 'validation error.', res, 999)
        }

        const v = new Validator(req.body, {
            emailPhone: 'email'
        });

        let filter = { mobileNumber: req.body.mobileNumber };

        try {

            MongoClient.connect(mongoDB.doctorDBUrl, { useNewUrlParser: true }, function (err, database) {
                //   assert.equal(null, err);
                dlog("labAdminDB Database connected successfully at post /send-otp-labAdmin")

                if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
                var db = database.db()

                db.collection('agents').findOne(filter, function (error, agent) {
                    if (error) {
                        database.close();
                        return common.handleError(err, 'Error fetching agent record', res, 500)
                    }
                    if (!agent) {
                        database.close();
                        return common.handleError(err, 'No agent record found with the given mobile', res, 500)
                    }

                    let smsGatewayURL = "https://app.rpsms.in/api/push.json?apikey=" + common.smsAPIKEY + "&sender=DRSIGN&mobileno=" + agent.mobileNumber + "&text=" + req.body.otp


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



                    /*
                        *****************************************
                        Call the SMS GateWay to send SMS to user mobile 
                        *****************************************
           
                    */

                    agent.uploadedFile = ''
                    agent.aadharFile = ''
                    agent.driverLicenseFile = ''

                    return res.json({
                        status: true,
                        message: 'OTP Sent Success.fully..',
                        data: agent
                    });
                });
            });

        } catch (error) {
            //console.error(error)
            return common.handleError(error, 'Error retrieving labAdmin record', res, 500)

        }
        //});



    });

}