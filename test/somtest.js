

const { check, validationResult } = require('express-validator');

mongoDBInstance = require('mongodb');
const Str = require('@supercharge/strings')
var mongoDB = require('../databaseconstant');
var MongoClient = require('mongodb').MongoClient;
const common = require('../utility/common');
var dlog = require('debug')('dlog')
var ObjectId = require('mongodb').ObjectID
var fs = require('fs');
function handleError(err, message, res, code) {

  res.status(code)
  return res.json({
    status: false,
    message: message,
    error: err
  });
}
//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/addEmp', function (req, res) {

    dlog(" inside addUser api ")
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      dlog("doctorDB Database connected successfully at post /addUser")
      var db = database.db()
      var collection_json = req.body

      dlog("req body  == " + JSON.stringify(req.body))

      collection_json.createdDate = new Date()
      collection_json.updatedDate = new Date()

      db.collection('employees').insertOne(collection_json, function (err, result) {
        //  assert.equal(err, null);
        if (err) {
          return common.handleError(err, 'user record Insert Fail at doctorDB...', res, 500)
        }
        dlog("1 user inserted");

        return res.json({
          status: true,
          message: 'DB Insert Success...',
          date: { insertid: result.insertedId }
        });

      });
    });


  })


  app.post('/api/raise-appointment-request', function (req, res) {

    //var dateString = req.body.appointmentDate//"23-04-2020"; 
    //var dateParts = dateString.split("-");    
    // month is 0-based, that's why we need dataParts[1] - 1
    var newDate = common.convertStringTodate(req.body.appointmentDate) //new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);     
    // let  newDate= new Date(appointment.appointmentDate);
    dlog("newDate =" + newDate.toDateString())
    dlog("newDate toISOString=" + newDate.toISOString())
    dlog("newDate toString =" + newDate.toString())

    dlog(" inside dummy-appointment-request api ")
    let promises = []
    promises.push(new Promise(resolve => {
      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("doctorDB Database connected successfully at post /dummy-appointment-request")

        var db = database.db()
        var collection_json = req.body
        collection_json.appointmentDate = newDate//new Date(newDate.toISOString())// newDate

        db.collection('appointments').insertOne(collection_json, function (err, result) {
          //  assert.equal(err, null);
          if (err) {
            return common.handleError(err, 'appointment record Insert Fail at doctorDB...', res, 500)
          }
          dlog("1 appointment inserted");

          dlog("1 appointment inserted in doctorDB == " + result.insertedId);

          //database.close();
          let query = { _id: new ObjectId(result.insertedId) };
          let fielchange = { $set: { "requestId": result.insertedId, "appointmentId": result.insertedId } }

          db.collection('appointments').findOneAndUpdate(query, fielchange, { returnNewDocument: true }, function (err, updateDoc) {
            if (err) { dlog("appointment record can not be updated with request ID "); };
            database.close();
            resolve("appointment record added in doctor DB");
          });


        });

      });
    }))

    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /dummy-appointment-request")

        var db = database.db()
        var collection_json = req.body

        //collection_json.appointmentDate = newDate.toISOString()//newDate
        collection_json.appointmentDate = new Date(newDate.toISOString())// newDate
        db.collection('appointments').insertOne(collection_json, function (err, result) {
          //  assert.equal(err, null);
          if (err) {
            return common.handleError(err, 'appointment record Insert Fail at patientDB...', res, 500)
          }
          dlog("1 appointment inserted in patientDB == " + result.insertedId);


          let query = { _id: new ObjectId(result.insertedId) };
          let fielchange = { $set: { "requestId": result.insertedId, "appointmentId": result.insertedId } }

          db.collection('appointments').findOneAndUpdate(query, fielchange, { returnNewDocument: true }, function (err, updateDoc) {
            if (err) { dlog("appointment record can not be updated with request ID "); };
            database.close();
            resolve("appointment record added in patient DB");
          });


        });

      });
    }))
    Promise.all(promises).then(function (values) {
      return res.json({
        status: true,
        message: 'DB Insert Success...'
      });
    })


  });
}
