

const { check, validationResult } = require('express-validator');
const Patient = require('../../models/patient');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');
var ObjectId = require('mongodb').ObjectID
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var moment = require('moment');


const getDoctorDetails = async (locationArry) => {
  let promises = []
  var locationNewArray = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  locationArry.forEach(function (location, index) {

    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filter = { _id: new ObjectId(location.doctorID) }
        db.collection('doctor_professional_details').findOne(filter, function (error, doctor) {

          console.log("location per doctor == " + JSON.stringify(doctor))
          if (error) {
            database.close();
            resolve(location)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!doctor) {
            database.close();
            //return common.handleError(err, 'patient could not be found',res,500)                    
            resolve(location)
          }
          if (doctor) {
            doctor.uploadPhotoProfessional = ''
            doctor.uploadPhotoDemographic = ''
            location.doctor = doctor
          }
          //locationNewArray.push(location)
          //resolve(locationNewArray)
          //resolve({location:location,patient:patient})
          resolve(location)
        });
      })

    }));

  })

  return Promise.all(promises)

}
const getePatientDetails = async (appointmentArry) => {
  let promises = []
  var appointmentNewArray = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  appointmentArry.forEach(function (appointment, index) {

    appointment.status = appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {
        var db = database.db()
        let filter = { _id: new ObjectId(appointment.patientId) }
        db.collection('patient_profile_details').findOne(filter, function (error, patient) {
          if (error) {
            database.close();
            resolve(appointment)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!patient) {
            database.close();
            //return common.handleError(err, 'patient could not be found',res,500)                    
            resolve(appointment)
          }
          if (patient)
            patient.uploadPhotoDemographic = ''
          appointment.patient = patient
          appointmentNewArray.push(appointment)
          //resolve(appointmentNewArray)
          //resolve({appointment:appointment,patient:patient})
          resolve(appointment)
        });
      })

    }));

  })

  return Promise.all(promises)

}
const geteLocationDetails = async (appointmentArry) => {
  let promises = []
  var appointmentNewArray = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  appointmentArry.forEach(function (appointment, index) {

    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filterLocation = { _id: new ObjectId(appointment.locationId) }

        db.collection('practice_locations').findOne(filterLocation, function (error, location) {
          if (error) {
            database.close();
            resolve(appointment)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!location) {
            database.close();
            resolve(appointment)
            //return common.handleError(err, 'location could not be found',res,500)                    
          }

          appointment.location = location
          // resolve({appointment:appointment,location:location})
          resolve(appointment)

        });

      });

    }));
  })

  return Promise.all(promises)
}
const getPatientLocationDetails = async (appointmentArry, res) => {

  appointmentArry = await getePatientDetails(appointmentArry)
  appointmentArry = await geteLocationDetails(appointmentArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Appointments retrieval successful.',
    data: appointmentArry
  });



}

const getDoctorDetailsForLocation = async (locationArry, res) => {

  locationArry = await getDoctorDetails(locationArry)
  //  appointmentArry = await geteLocationDetails(appointmentArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Locations retrieval successful.',
    data: locationArry
  });



}


const getPatientDetailsOld = async (appointmentArry, res) => {
  let promises = []
  var appointmentNewArray = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  appointmentArry.forEach(function (appointment, index) {
    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {
        var db = database.db()
        let filter = { _id: new ObjectId(appointment.patientId) }
        db.collection('patient_profile_details').findOne(filter, function (error, patient) {
          if (error) {
            database.close();
            resolve({ id: null, patient: null })
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!patient) {
            database.close();
            //return common.handleError(err, 'patient could not be found',res,500)                    
            resolve({ id: null, patient: null })
          }
          if (patient)
            patient.uploadPhotoDemographic = ''
          //appointment.patientName = patient.name
          //appointmentNewArray.push(appointment)
          //resolve(appointmentNewArray)
          //resolve({appointment:appointment,patient:patient})
          resolve({ id: appointment['_id'], patient: patient })
        });
      })

    }));
    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filterLocation = { _id: new ObjectId(appointment.locationId) }

        db.collection('practice_locations').findOne(filterLocation, function (error, location) {
          if (error) {
            database.close();
            resolve({ id: null, location: null })
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!location) {
            database.close();
            resolve({ id: null, location: null })
            //return common.handleError(err, 'location could not be found',res,500)                    
          }

          // appointment.area = location.area
          // resolve({appointment:appointment,location:location})
          resolve({ id: appointment['_id'], location: location })
          //appointmentNewArray.push(appointment)
          //resolve(appointmentNewArray)
          //resolve(appointment)
        });

      });

    }));
  })

  Promise.all(promises).then(function (valuesArray) {

    dlog("valuesArray == " + JSON.stringify(valuesArray))
    for (var j in valuesArray) {
      let values = valuesArray[j]

      for (var i in appointmentArry) {
        let existinAppointment = appointmentArry[i]

        if (existinAppointment && values && values['location'] && existinAppointment['_id'] == values["id"] && existinAppointment.locationId == values['location']["_id"]) {
          //appointmentArry[i].area = values.location["area"]
          appointmentArry[i].location = values.location
        }

        if (existinAppointment && values && values['patient'] && existinAppointment['_id'] == values["id"] && existinAppointment.patientId == values['patient']["_id"]) {
          //appointmentArry[i].patientName = values.patient["name"]
          appointmentArry[i].patient = values.patient
        }

      }
    }
    //appointmentNewArray.push(values)

    dlog("appointmentArry == " + JSON.stringify(appointmentArry))
    // database.close();                          
    return res.json({
      status: true,
      message: 'Appointments retrieval successful.',
      data: appointmentArry
    });
  })
  //});


}

module.exports = function (app) {
  /*
  ************
  fetchPatients API
    ************
  */

  app.post('/api/fetchPatients', function (req, res) {
    dlog(" inside fetchPatients api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {

      MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchPatients")

        dlog("req.body " + JSON.stringify(req.body))
        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage

        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        let filter = { "emailId": { $exists: true } }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('patient_profile_details').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, patientArry) {
          let patientList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No Patient record found', res, 500)
          }
          if (!patientArry || (patientArry && patientArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No Patient record foundin Patient DB', res, 500)
          }
          for (var i in patientArry) {
            let patient = patientArry[i]
            patient.uploadPhotoDemographic = ''
            patientList.push(patient)
          }
          database.close();

          return res.json({
            status: true,
            message: 'Patients retrieval  successful.',
            data: patientList
          });


        });
      });

    } catch (error) {
      dlog(error)
      //  return  common.handleError(error, 'Error retrieving Patient record',res,500)

    }
  });


  /*
    ************
  fetch Patients count API
    ************
  */

  app.post('/api/fetchPatientsCount', function (req, res) {
    dlog(" inside fetchPatients api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {

      MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchPatients")

        let filter = { "emailId": { $exists: true } }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('patient_profile_details').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No Patient record found', res, 500)
          }
          var output
          if (result == undefined) {
            result1 = {
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
            message: 'Patients record count API  successful.',
            data: output
          });


        });
      });

    } catch (error) {
      //console.error(error)
      dlog(error)
      // return  common.handleError(error, 'Error retrieving Patient record',res,500)

    }
  });



  /*
    ************
   6. fetchDoctors API
    ************
  */


  app.post('/api/fetchDoctors', function (req, res) {
    dlog(" inside fetchDoctors api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchDoctors")
        let filter = { "emailId": { $exists: true } }
        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage
        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('doctor_professional_details').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, doctorArry) {
          let doctorList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No doctor record found', res, 500)
          }
          if (!doctorArry || (doctorArry && doctorArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No doctor record foundin Patient DB', res, 500)
          }
          for (var i in doctorArry) {
            let doctor = doctorArry[i]
            doctor.uploadPhotoDemographic = ''
            doctor.uploadPhotoProfessional = ''
            doctorList.push(doctor)
          }

          database.close();

          return res.json({
            status: true,
            message: 'doctor retrieval  successful.',
            data: doctorList
          });


        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving doctor record', res, 500)

    }
  });


  /*
    ************
   6. fetchDoctors Count API
    ************
  */


  app.post('/api/fetchDoctorsCount', function (req, res) {
    dlog(" inside fetchDoctorsCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchDoctors")


        let filter = { "emailId": { $exists: true } }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('doctor_professional_details').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No doctor record found', res, 500)
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
            message: 'doctor record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving doctor record', res, 500)

    }
  });


  app.post('/api/fetchUsersCount', function (req, res) {
    dlog(" inside fetchUsersCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchDoctors")


        let filter = { "email": { $exists: true } }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('users').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No user record found', res, 500)
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
            message: 'user record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving doctor record', res, 500)

    }
  });



  app.post('/api/fetchUsers', function (req, res) {
    dlog(" inside fetchUsers api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {
      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchUsers")
        let filter = { "email": { $exists: true } }
        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage
        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('users').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, userArry) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No user record found', res, 500)
          }
          if (!userArry || (userArry && userArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No user record foundin Patient DB', res, 500)
          }

          database.close();

          return res.json({
            status: true,
            message: 'users retrieval  successful.',
            data: userArry
          });
        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving doctor record', res, 500)

    }
  });

  app.post('/api/view-alltodays-appointments', function (req, res) {
    dlog(" inside get view-alltodays-appointment api   ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    let selectedDate = new Date()//req.body.selectedDate

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()

      dlog("step1.1")
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at view-alltodays-appointments")

      let filter = { "appointmentDate": { "$eq": selectedDate } }
      db.collection('appointments').find(filter).toArray(function (err, appointmentArry) {

        if (err) return common.handleError(err, 'Error, No Appointment record found with the given month', res, 500)
        if (!appointmentArry || (appointmentArry && appointmentArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No Appointment record found', res, 500)
        }

        database.close();

        return res.json({
          status: true,
          message: 'Appointments retrieval by date successful.',
          data: appointmentArry
        });


      });

    });
  })

  app.post('/api/fetch-allmonths-appointment', function (req, res) {

    dlog(" inside fetch-allmonths-appointment api ")
    let promises = []

    var appointmentCountArray = []

    let monthArry = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",]
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      monthArry.forEach(function (month, index) {
        promises.push(new Promise(resolve => {


          dlog("patientDB Database connected successfully at post /fetch-allmonths-appointment ")

          var db = database.db()

          var d = new Date();
          var year = d.getFullYear();
          let filter = { $and: [{ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, parseInt(month)] } }, { "$expr": { "$eq": [{ "$year": "$appointmentDate" }, parseInt(year)] } }] }
          //let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, parseInt(month)] }}      
          dlog("filter == " + JSON.stringify(filter))

          db.collection('appointments').count(filter, function (err, result) {
            if (err) {
              database.close();
              // return  common.handleError(err, 'Error, in fetching Appointment',res,                      500)   
              appointmentCountArray.push({ month: month, count: 0 })
              resolve(appointmentCountArray)
            }
            dlog("result ==" + result)
            appointmentCountArray.push({ month: month, count: result })
            resolve(appointmentCountArray)
          });

        }));

      })
      Promise.all(promises).then(function (values) {
        //dlog("values =="+JSON.stringify(values))
        let monthCountArry = []
        for (var i = 1; i <= 12; i++) {
          for (var j in appointmentCountArray) {
            let appointmentCount = appointmentCountArray[j]
            if (parseInt(appointmentCount["month"]) == i) {
              monthCountArry.push(parseInt(appointmentCount["count"]))
            }
          }
        }

        database.close();
        return res.json({
          status: true,
          message: ' Fetch-allmonths-appointment Success...',
          data: monthCountArry
        });
      })
    })



  });



  app.post('/api/fetchMonthInvoices', [

    check('fromDate').not().isEmpty().trim().escape(),
    check('toDate').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside get fetchMonthInvoicesapi  by locationId ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    dlog("**req.body   ===== **" + JSON.stringify(req.body))
    //let filter = { locationId:  req.body.locationId};
    try {


      let allDates = req.body.allDates
      let fromDate = req.body.fromDate;
      fromDate = fromDate.split("-");
      let toDate = req.body.toDate;
      toDate = toDate.split("-");


      var fromDateDa = new Date(fromDate[2], fromDate[1] - 1, ++fromDate[0]);
      var toDateDa = new Date(toDate[2], toDate[1] - 1, ++toDate[0]);

      dlog("fromDate toISOString=" + fromDateDa.toISOString())
      dlog("fromDate toString =" + fromDateDa.toString())
      dlog("toDate toISOString=" + toDateDa.toISOString())
      dlog("toDate toString =" + toDateDa.toString())

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

        var db = database.db()



        if (err) return common.handleError(err, 'No DB connection could be made to DB', res, 500)
        dlog(" Database connected successfully at fetchMonthInvoices")

        let filter = { $and: [{ "invoiceDate": { "$gte": fromDateDa } }, { "invoiceDate": { "$lt": toDateDa } }] }

        db.collection('invoices').find(filter).toArray(function (err, invoiceArry) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No invoice record found in the given date range', res, 500)
          }
          if (!invoiceArry || (invoiceArry && invoiceArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No Appointment record found', res, 500)
          }
          database.close();
          let invoiceLIst = []
          for (var i in allDates) {
            let eachDate = allDates[i]
            let added = false
            for (var j in invoiceArry) {
              let invoice = invoiceArry[j]

              let invoiceDate = moment(invoice.invoiceDate).format('DD-MM-YYYY');

              if (eachDate == invoiceDate) {
                dlog(" eachDate " + eachDate)
                dlog(" invoiceDate " + invoiceDate)
                invoiceLIst.push(parseFloat(invoice.invoiceAmount))
                added = true
              }


            }
            if (!added)
              invoiceLIst.push(0)

          }
          return res.json({
            status: true,
            message: 'Invoices retrieval by date range successful.',
            data: invoiceLIst
          });


        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving Invoices record', res, 500)

    }

  });



  app.post('/api/view-todays-appointment', function (req, res) {
    dlog(" inside get view-todays-appointment api  by locationId ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    //let filter = { locationId:  req.body.locationId};
    try {
      var today = new Date()


      let utcD = Date.UTC(today.getFullYear(), today.getUTCMonth(), today.getUTCDate(),
        0, 0, 0);

      today = new Date(utcD);

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      dlog("today toISOString=" + today.toISOString())
      dlog("today toString =" + today.toString())
      dlog("tomorrow toISOString=" + tomorrow.toISOString())
      dlog("tomorrow toString =" + tomorrow.toString())

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

        var db = database.db()

        dlog("step1.1")
        if (err) return common.handleError(err, 'No DB connection could be made to DB', res, 500)

        dlog(" Database connected successfully at view-appointment-bylocation")

        //        let filter = { "appointmentDate" : {"$eq": today}} 

        let filter = { $and: [{ "appointmentDate": { "$gte": today } }, { "appointmentDate": { "$lt": tomorrow } }] }

        db.collection('appointments').find(filter).toArray(function (err, appointmentArry) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No Appointment record found with the given locationId', res, 500)
          }
          if (!appointmentArry || (appointmentArry && appointmentArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No Appointment record found', res, 500)
          }
          //getAlldetails(database,appointmentArry,res)
          getPatientLocationDetails(appointmentArry, res)
          /* database.close();              
           
           return res.json({
             status: true,
             message: 'Appointments retrieval by locationId successful.',
             data: appointmentArry
           });
            */

        });
      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving AppointmentPatientApp  record', res, 500)

    }

  });


  app.post('/api/addUser', function (req, res) {

    dlog(" inside addUser api ")
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      dlog("doctorDB Database connected successfully at post /addUser")
      var db = database.db()
      var collection_json = req.body

      dlog("req body  == " + JSON.stringify(req.body))

      collection_json.createdDate = new Date()
      collection_json.updatedDate = new Date()
      collection_json.updatedBy = req.body.updatedBy
      collection_json.createdBy = req.body.createdBy

      db.collection('users').insertOne(collection_json, function (err, result) {
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


  app.post('/api/editUser', [
    check('userId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside editUser api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }
    var collection_json = req.body
    collection_json.updatedDate = new Date()
    collection_json.updatedBy = req.body.updatedBy


    dlog(" inside editUser req body  " + JSON.stringify(req.body))
    let filter = { _id: new ObjectId(req.body.userId) }
    // let filter  = {_id :  new ObjectId(ObjectId(req.body.userId).toString())}

    dlog("req.body.role == " + JSON.stringify(req.body.role))

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
      dlog("doctorDB Database connected successfully at post /editUser")
      var db = database.db()
      var collection_json = req.body
      collection_json.updatedDate = new Date()

      let fielchange = {}
      if (req.body.userName && req.body.userName.trim() != "")
        fielchange.userName = req.body.userName

      if (req.body.password && req.body.password.trim() != "")
        fielchange.password = req.body.password

      if (req.body.email && req.body.email.trim() != "")
        fielchange.email = req.body.email

      if (req.body.role)
        fielchange.role = req.body.role


      if (req.body.active == false) {
        fielchange.active = false
      }
      if (req.body.active == true) {
        fielchange.active = true
      }

      fielchange.updatedDate = new Date()

      fielchange = { $set: fielchange }


      if (req.body.updatedBy && req.body.updatedBy.trim() != "")
        fielchange.updatedBy = req.body.updatedBy

      dlog("fielchange == " + JSON.stringify(fielchange))
      db.collection('users').findOne(filter, function (err, userRec) {

        if (err) {
          database.close();
          return common.handleError(err, 'Error, in fetching user with given ID', res, 500)
        }

        if (!userRec) {
          database.close();
          return common.handleError(err, ' No user record found with the given user ID', res, 500)
        }

        db.collection('users').updateOne(filter, fielchange, function (error, response) {
          if (error) {
            console.error(error)
            database.close();
            return common.handleError(err, 'User record could not be updated', res, 500)
          }
          let user = response.value
          database.close();
          return res.json({
            status: true,
            message: 'user Update Success...',
            data: user
          });

        });

      });

    });


  })

  app.post('/api/login-user', [
    check('emailPhone').not().isEmpty().trim().escape(),
    check('password').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside login api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    const v = new Validator(req.body, {
      emailPhone: 'email'
    });

    let filter = { email: req.body.emailPhone, password: req.body.password, active: true };

    v.check().then((matched) => {

      try {


        MongoClient.connect(mongoDB.doctorDBUrl,{ useNewUrlParser: true }, function (err, database) {
          //   assert.equal(null, err);
          dlog("patientDB Database connected successfully at post /login-user ")

          if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
          var db = database.db()

          db.collection('users').findOne(filter, function (error, user) {
            if (error) {
              database.close();
              return common.handleError(err, 'Error fetching user record', res, 500)
            }
            if (!user) {
              database.close();
              return common.handleError(err, 'user could not be found', res, 500)
            }


            database.close();
            return res.json({
              status: true,
              message: 'login Success...',
              data: user
            });

          });
        });
      } catch (error) {
        //console.error(error)
        return common.handleError(error, 'Error retrieving patient record', res, 500)

      }
    });

  });
  app.post('/api/all-practice-locations', function (req, res) {
    dlog(" inside all-practice-locations api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at updateAppointmentPatientDB")

      let filter = { active: true }

      db.collection('practice_locations').find(filter).toArray(function (err, practiceLocationArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching Practice Location', res, 500)
        if (!practiceLocationArry || (practiceLocationArry && practiceLocationArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No Practice Location record found with the given city Or Area or address', res, 500)
        }

        let practiceLocationArryNew = []
        for (var i in practiceLocationArry) {
          let practiceLocation = practiceLocationArry[i]
          if (practiceLocation) {
            practiceLocation.longName = "Address:" + practiceLocation.address + ", \n Area:" + practiceLocation.area + "\n, City:" + practiceLocation.city
          }

          practiceLocationArryNew.push(practiceLocation)

        }

        database.close();
        return res.json({
          status: true,
          message: 'Practice Location array retrieval success...',
          //data: doctorIdList
          data: practiceLocationArryNew
        });

      });

    });

  });


  app.post('/api/all-practice-locations-autocom', [
    check('name').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-practice-locations autocom api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at updateAppointmentPatientDB")


      let filter =
      {
        $or: [{ city: { '$regex': req.body.name, $options: '-i' } },
        { name: { '$regex': req.body.name, $options: '-i' } },
        { state: { '$regex': req.body.name, $options: '-i' } },
        { address: { '$regex': req.body.name, $options: '-i' } },
        { area: { '$regex': req.body.name, $options: '-i' } }]
      }



      db.collection('practice_locations').find(filter).toArray(function (err, practiceLocationArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching Practice Location', res, 500)
        if (!practiceLocationArry || (practiceLocationArry && practiceLocationArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No Practice Location record found with the given city Or Area or address', res, 500)
        }

        let practiceLocationArryNew = []
        for (var i in practiceLocationArry) {
          let practiceLocation = practiceLocationArry[i]
          if (practiceLocation) {
            practiceLocation.longName = "Address:" + practiceLocation.address + ", \n Area:" + practiceLocation.area + "\n, City:" + practiceLocation.city
          }

          practiceLocationArryNew.push(practiceLocation)

        }

        database.close();
        return res.json({
          status: true,
          message: 'Practice Location array retrieval success...',
          //data: doctorIdList
          data: practiceLocationArryNew
        });

      });

    });

  });
  app.post('/api/fetch-all-patients', function (req, res) {
    dlog(" inside all-patients api  ")

    MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-patients")

      let filter = { active: true }

      db.collection('patient_profile_details').find(filter).toArray(function (err, patientArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching patient ', res, 500)
        if (!patientArry || (patientArry && patientArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No patientArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Patient array retrieval success...',
          //data: doctorIdList
          data: patientArry
        });

      });

    });

  });
  app.post('/api/fetch-all-patients-autocom', [
    check('name').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-patients api  ")

    MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-patients")

      let filter = { name: { '$regex': req.body.name, $options: '-i' } }

      db.collection('patient_profile_details').find(filter).toArray(function (err, patientArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching patient ', res, 500)
        if (!patientArry || (patientArry && patientArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No patientArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Patient array retrieval success...',
          //data: doctorIdList
          data: patientArry
        });

      });

    });

  });



  /*
    ************
   6. fetchAppointments API
    ************
  */


  app.post('/api/fetchAppointments', function (req, res) {
    dlog(" inside fetchAppointments api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchAppointments")

        let filter = { "appointmentDate": { $exists: true } }

        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage
        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('appointments').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, appointmentArry) {
          let appointmentList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No appointment record found', res, 500)
          }
          if (!appointmentArry || (appointmentArry && appointmentArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No appointment record foundin Patient DB', res, 500)
          }
          /*
          for( var i in appointmentArry){  
            let appointment = appointmentArry[i]                 
            appointmentList.push(appointment)                                
          }
    */
          database.close();

          /*    return res.json({
                status: true,
                message: 'appointment retrieval  successful.',
                data: appointmentList
              });
            */
          getPatientLocationDetails(appointmentArry, res)

        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving appointment record', res, 500)

    }
  });


  /*
    ************
   6. fetchAppointments Count API
    ************
  */


  app.post('/api/fetchAppointmentsCount', function (req, res) {
    dlog(" inside fetchAppointmentsCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchAppointments")


        let filter = { "appointmentDate": { $exists: true } }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('appointments').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No appointment record found', res, 500)
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
            message: 'appointment record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving appointment record', res, 500)

    }
  });




  app.post('/api/fetchLocations', function (req, res) {
    dlog(" inside fetchLocations api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchLocations")

        let filter = { "createdDate": { $exists: true } }

        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage
        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('practice_locations').find(filter).limit(perPage).skip(skipNumber).sort({ 'createdDate': -1 }).toArray(function (err, locationArry) {
          let locationList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No location record found', res, 500)
          }
          if (!locationArry || (locationArry && locationArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No location record foundin Patient DB', res, 500)
          }
          /*
          for( var i in locationArry){  
            let location = locationArry[i]                 
            locationList.push(location)                                
          }
    */
          database.close();

          /*    return res.json({
                status: true,
                message: 'location retrieval  successful.',
                data: locationList
              });
            */
          getDoctorDetailsForLocation(locationArry, res)

        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving location record', res, 500)

    }
  });


  /*
    ************
   6. fetchLocations Count API
    ************
  */


  app.post('/api/fetchLocationsCount', function (req, res) {
    dlog(" inside fetchLocationsCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchLocations")


        let filter = { "locationDate": { $exists: true } }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('practice_locations').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No location record found', res, 500)
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
            message: 'location record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving location record', res, 500)

    }
  });


  app.post('/api/fetch-all-doctors', function (req, res) {
    dlog(" inside all-doctors api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-doctors")

      let filter = { active: true }

      db.collection('doctor_professional_details').find(filter).toArray(function (err, doctorArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching doctor ', res, 500)
        if (!doctorArry || (doctorArry && doctorArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No doctorArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Doctor array retrieval success...',
          //data: doctorIdList
          data: doctorArry
        });

      });

    });

  });

  app.post('/api/fetch-all-doctors-autocom', [
    check('name').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside all-doctors api  ")

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at all-doctors")

      let filter = { name: { '$regex': req.body.name, $options: '-i' } }

      db.collection('doctor_professional_details').find(filter).toArray(function (err, doctorArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching doctor ', res, 500)
        if (!doctorArry || (doctorArry && doctorArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No doctorArry record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Doctor array retrieval success...',
          //data: doctorIdList
          data: doctorArry
        });

      });

    });

  });

  /*
      *****************************************
      1. Patient Upload-Order-Prescription
      *****************************************
  */
  app.post('/api/upload-order-prescription', [
    check('customerId').not().isEmpty().trim(),
    check('uploadPhotoOrderPrescription').not().isEmpty().trim()
  ], function (req, res) {
    dlog(" inside upload-Order-Prescription api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    dlog("PatientId =" + req.body.patientId)

    var inputCollection = req.body

    const photoRandomString = Str.random(8)
    dlog("photoRandomString =" + photoRandomString)


    let uploadedFileNameSuf = "Order_Prescription_" + photoRandomString + "_"

    //  inputCollection =  doFileProcessing(inputCollection,"both")

    common.doFileProcessing(inputCollection, "Order_Prescription", uploadedFileNameSuf, "uploadPhotoOrderPrescription", "uploadPhotoOrderPrescriptionURL").then((result) => {
      inputCollection = result

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDBUrl Database connected successfully at post /order-prescription")

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

        var db = database.db()


        inputCollection.active = true
        //collection_json.appointmentDate = newDate.toISOString()//newDate
        inputCollection.createdDate = new Date()

        db.collection('order-prescriptions').insertOne(inputCollection, function (error, response) {

          let orderPrescription = response.ops[0]

          //dlog("NEWLY added patient == "+JSON.stringify(patient))             

          if (error) {
            return common.handleError(error, 'DB Insert Fail...', res, 500)
          }

          if (orderPrescription) {
            //orderPrescription.uploadPhotoOrderPrescription = ''
            orderPrescription.uploadPhotoOrderPrescriptionURL = inputCollection.uploadPhotoOrderPrescriptionURL
          }

          return res.json({
            status: true,
            message: 'DB Insert Success...',
            data: orderPrescription
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

  })

  app.post('/api/fetch-all-order-prescriptions-for-orders', [
    check('customerId').not().isEmpty().trim().escape()
  ], function (req, res) {
    dlog(" inside fetch-all-order-prescriptions-for-orders api  ")

    let filter = { customerId: ObjectId(req.body.customerId).toString() }

    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" inside fetch-all-order-prescriptions-for-orders api  step 2")

      db.collection('order-prescriptions').find(filter).toArray(function (err, prescArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching patient ', res, 500)
        if (!prescArry || (prescArry && prescArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No prescriptions record found for the customer', res, 500)
        }
        dlog(" inside fetch-all-order-prescriptions-for-orders api  step 3")
        let prescArryNew = []
        prescArry.forEach(function (prescriptionObject, index) {

          //prescriptionObject.uploadPhotoOrderPrescription = ''
          prescArryNew.push(prescriptionObject)
        })
        dlog(" inside fetch-all-order-prescriptions-for-orders api  step 4")
        database.close();
        return res.json({
          status: true,
          message: 'Prescription array retrieval success...',
          data: prescArryNew
        });

      });

    });

  });




  app.post('/api/fetchInvoices', function (req, res) {
    dlog(" inside fetchInvoices api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchInvoices")

        let filter = { "invoiceDate": { $exists: true } }

        var pageno = req.body.pageNo
        var perPage = req.body.perPage
        var skipNumber = (pageno - 1) * perPage
        dlog("pageno " + pageno)
        dlog("perPage " + perPage)
        dlog("skipNumber " + skipNumber)

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()

        db.collection('invoices').find(filter).limit(perPage).skip(skipNumber).sort({ 'createDate': -1 }).toArray(function (err, invoiceArry) {
          let invoiceList = []
          if (err) {
            database.close();
            return common.handleError(err, 'Error, No invoice record found', res, 500)
          }
          if (!invoiceArry || (invoiceArry && invoiceArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No invoice record foundin Patient DB', res, 500)
          }
          /*
          for( var i in invoiceArry){  
            let invoice = invoiceArry[i]                 
            invoiceList.push(invoice)                                
          }
    */
          database.close();

          return res.json({
            status: true,
            message: 'invoice retrieval  successful.',
            data: invoiceArry
          });

          //  getDoctorDetailsForInvoice(invoiceArry,res)    

        });
      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoice record', res, 500)

    }
  });


  /*
    ************
   6. fetchInvoices Count API
    ************
  */


  app.post('/api/fetchInvoicesCount', function (req, res) {
    dlog(" inside fetchInvoicesCount api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.', res, 999)
    }

    try {


      //  Patient.findById(req.body.patientId, function (err, patient) {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        //   assert.equal(null, err);
        dlog("patientDB Database connected successfully at post /fetchInvoices")


        let filter = { "invoiceDate": { $exists: true } }

        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)
        var db = database.db()
        db.collection('invoices').count(filter, function (err, result) {

          if (err) {
            database.close();
            return common.handleError(err, 'Error, No invoice record found', res, 500)
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
            message: 'invoice record count API  successful.',
            data: output
          });


        });

      });

    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving invoice record', res, 500)

    }
  });



}
