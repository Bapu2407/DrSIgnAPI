

const { check, validationResult } = require('express-validator');
const Patient = require('../../models/patient');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
var mongoDB = require('../../databaseconstant');
var MongoClient = require('mongodb').MongoClient;
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');
var request = require('request');
var ObjectId = require('mongodb').ObjectID


const getDoctorDetailsList = async (locationArry) => {
  let promises = []
  var locationNewArray = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  locationArry.forEach(function (location, index) {

    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filter = { _id: new ObjectId(location.doctorID) }
        db.collection('doctor_professional_details').findOne(filter, function (error, doctor) {

          //   console.log("location per doctor == "+JSON.stringify(doctor))
          if (error) {
            database.close();
            resolve(doctor)
            //return common.handleError(err, 'Error fetching patient record',res,500)                    
          }
          if (!doctor) {
            database.close();
            //return common.handleError(err, 'patient could not be found',res,500)                    
            resolve(doctor)
          }
          if (doctor) {
            doctor.uploadPhotoProfessional = ''
            doctor.uploadPhotoDemographic = ''
            doctor.password = ''

            // location.doctor = doctor
          }
          database.close();
          resolve(doctor)
        });
      })

    }));

  })

  return Promise.all(promises)

}


const getDoctorDetailsFromIdList = async (doctorsArray) => {
  let promises = []

  doctorsArray.forEach(function (doctorIdObject, index) {
    if (ObjectId.isValid(doctorIdObject.doctorId)) {
      promises.push(new Promise(resolve => {

        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
          var db = database.db()
          let filter = { _id: new ObjectId(doctorIdObject.doctorId) }

          //  console.log(" doctorIdObject.doctorId =="+doctorIdObject.doctorId)
          db.collection('doctor_professional_details').findOne(filter, function (error, doctor) {

            //  console.log("location per doctor == "+JSON.stringify(doctor))
            if (error) {
              database.close();
              resolve(doctor)
              //return common.handleError(err, 'Error fetching patient record',res,500)                    
            }
            if (!doctor) {
              database.close();
              //return common.handleError(err, 'patient could not be found',res,500)                    
              resolve(doctor)
            }
            if (doctor) {
              doctor.uploadPhotoProfessional = ''
              doctor.uploadPhotoDemographic = ''
              doctor.password = ''

              // location.doctor = doctor
            }
            database.close();
            //locationNewArray.push(location)
            //resolve(locationNewArray)
            //resolve({location:location,patient:patient})
            resolve(doctor)
          });
        })

      }));
    }
    //else{
    //      continue
    //  }

  })

  return Promise.all(promises)

}



const getDoctorDetailsFromIdNameList = async (doctorsArray, name) => {
  let promises = []

  doctorsArray.forEach(function (doctorIdObject, index) {
    if (ObjectId.isValid(doctorIdObject.doctorId)) {
      promises.push(new Promise(resolve => {

        MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
          var db = database.db()
          let filter =
          {
            $and: [{ _id: new ObjectId(doctorIdObject.doctorId) },
            { name: { '$regex': name, $options: '-i' } }]
          }



          //  console.log(" doctorIdObject.doctorId =="+doctorIdObject.doctorId)
          db.collection('doctor_professional_details').findOne(filter, function (error, doctor) {

            //  console.log("location per doctor == "+JSON.stringify(doctor))
            if (error) {
              database.close();
              resolve(doctor)
              //return common.handleError(err, 'Error fetching patient record',res,500)                    
            }
            if (!doctor) {
              database.close();
              //return common.handleError(err, 'patient could not be found',res,500)                    
              resolve(doctor)
            }
            if (doctor) {
              doctor.uploadPhotoProfessional = ''
              doctor.uploadPhotoDemographic = ''
              doctor.password = ''

              // location.doctor = doctor
            }
            database.close();
            //locationNewArray.push(location)
            //resolve(locationNewArray)
            //resolve({location:location,patient:patient})
            resolve(doctor)
          });
        })

      }));
    }
    //else{
    //      continue
    //  }

  })

  return Promise.all(promises)

}

const getFeedbackListByDoctor = async (doctorsArray) => {
  let promises = []
  let feedbackPromises = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  doctorsArray.forEach(function (doctor, index) {
    if (doctor && ObjectId.isValid(doctor._id)) {
      //doctor.password = ''
      doctor.uploadPhotoProfessional = ''
      doctor.uploadPhotoDemographic = ''
      doctor.password = ''
      promises.push(new Promise(resolve => {
        try {
          MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            let filter = { doctorId: ObjectId(doctor._id).toString() }



            //   db.collection('practice_locations').findOne(filter,function(error, location) {
            db.collection('feedbacks').find(filter).toArray(function (err, feedbacksArry) {


              if (err) {
                database.close();
                resolve(doctor)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
              if (!feedbacksArry || (feedbacksArry && feedbacksArry.length == 0)) {
                database.close();
                //return common.handleError(err, 'patient could not be found',res,500)                    
                resolve(doctor)
              }

              if (feedbacksArry && feedbacksArry.length > 0) {

                feedbacksArry.forEach(function (feedback, index) {

                  feedbackPromises.push(new Promise(resolve => {

                    MongoClient.connect(mongoDB.patientDBUrl, function (err, database) {
                      var db = database.db()
                      let filter = { _id: new ObjectId(feedback.patientId) }
                      db.collection('patient_profile_details').findOne(filter, function (error, patient) {
                        if (error) {
                          //database.close(); 
                          resolve(feedback)
                          //return common.handleError(err, 'Error fetching patient record',res,500)                    
                        }
                        if (!patient) {
                          //database.close(); 
                          //return common.handleError(err, 'patient could not be found',res,500)                    
                          resolve(feedback)
                        }
                        if (patient) {
                          patient.uploadPhotoDemographic = ''

                          feedback.patientName = patient.name
                        }
                        //newFeedbackArray.push(feedback)
                        //resolve(appointmentNewArray)
                        //resolve({appointment:appointment,patient:patient})
                        resolve(feedback)
                      });
                    })

                  }));

                })
                //newFeedbackArray =  Promise.all(feedbackPromises)

                Promise.all(feedbackPromises).then(function (values) {

                  doctor.feedbacksArry = values
                  database.close();
                  resolve(doctor)
                })


              }


            });
          })
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Error retrieving customer record', res, 500)

        }


      }));
    }
    //else{
    //continue
    //}

  })

  return Promise.all(promises)

}


const getLocationDetailsByLocationNameWITHFEESList = async (doctorsArray, fees, cityOrArea) => {
  let promises = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  doctorsArray.forEach(function (doctor, index) {
    if (doctor && ObjectId.isValid(doctor._id)) {
      //doctor.password = ''
      doctor.uploadPhotoProfessional = ''
      doctor.uploadPhotoDemographic = ''
      doctor.password = ''
      promises.push(new Promise(resolve => {
        try {
          MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            //let filter  = {doctorID :ObjectId(doctor._id).toString() }

            let filter = {
              $and: [{ doctorID: ObjectId(doctor._id).toString() },
              { $or: [{ city: { '$regex': cityOrArea, $options: '-i' } }, { area: { '$regex': cityOrArea, $options: '-i' } }, { address: { '$regex': cityOrArea, $options: '-i' } }] }
              ]
            }

            //   db.collection('practice_locations').findOne(filter,function(error, location) {
            db.collection('practice_locations').find(filter).toArray(function (err, locationArry) {


              if (err) {
                database.close();
                resolve(doctor)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
              if (!locationArry || (locationArry && locationArry.length == 0)) {
                database.close();
                //return common.handleError(err, 'patient could not be found',res,500)                    
                resolve(doctor)
              }

              let filterSetting = { doctorId: ObjectId(doctor._id).toString(), serviceFees: fees }


              db.collection('settings').findOne(filterSetting, function (error, setting) {


                let practice_details = []
                locationArry.forEach(function (location, index) {
                  let address = location.address + "," + location.area + "," + location.city
                  let fees = 0
                  if (setting) {
                    fees = setting['serviceFees']
                  }
                  practice_details.push({ "practice_location": address, locationid: location._id, "Fees": fees })

                })
                doctor.practice_details = practice_details
                database.close();
                resolve(doctor)

              })

            });
          })
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Error retrieving customer record', res, 500)

        }


      }));
    }
    //else{
    //continue
    //}

  })

  return Promise.all(promises)

}



const getLocationDetailsByLocationNameList = async (doctorsArray, cityOrArea) => {
  let promises = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  doctorsArray.forEach(function (doctor, index) {
    if (doctor && ObjectId.isValid(doctor._id)) {
      //doctor.password = ''
      doctor.uploadPhotoProfessional = ''
      doctor.uploadPhotoDemographic = ''
      doctor.password = ''
      promises.push(new Promise(resolve => {
        try {
          MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            //let filter  = {doctorID :ObjectId(doctor._id).toString() }

            let filter = {
              $and: [{ doctorID: ObjectId(doctor._id).toString() },
              { $or: [{ city: { '$regex': cityOrArea, $options: '-i' } }, { area: { '$regex': cityOrArea, $options: '-i' } }, { address: { '$regex': cityOrArea, $options: '-i' } }] }
              ]
            }

            //   db.collection('practice_locations').findOne(filter,function(error, location) {
            db.collection('practice_locations').find(filter).toArray(function (err, locationArry) {


              if (err) {
                database.close();
                resolve(doctor)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
              if (!locationArry || (locationArry && locationArry.length == 0)) {
                database.close();
                //return common.handleError(err, 'patient could not be found',res,500)                    
                resolve(doctor)
              }

              let filterSetting = { doctorId: ObjectId(doctor._id).toString() }


              db.collection('settings').findOne(filterSetting, function (error, setting) {


                let practice_details = []
                locationArry.forEach(function (location, index) {
                  let address = location.address + "," + location.area + "," + location.city
                  let fees = 0
                  if (setting) {
                    fees = setting['serviceFees']
                  }
                  practice_details.push({ "practice_location": address, locationid: location._id, "Fees": fees })

                })
                doctor.practice_details = practice_details
                database.close();
                resolve(doctor)

              })

            });
          })
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Error retrieving customer record', res, 500)

        }


      }));
    }
    //else{
    //continue
    //}

  })

  return Promise.all(promises)

}


const getLocationDetailsList = async (doctorsArray) => {
  let promises = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  doctorsArray.forEach(function (doctor, index) {
    if (doctor && ObjectId.isValid(doctor._id)) {
      //doctor.password = ''
      doctor.uploadPhotoProfessional = ''
      doctor.uploadPhotoDemographic = ''
      doctor.password = ''
      promises.push(new Promise(resolve => {
        try {
          MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            let filter = { doctorID: ObjectId(doctor._id).toString() }
            //   db.collection('practice_locations').findOne(filter,function(error, location) {
            db.collection('practice_locations').find(filter).toArray(function (err, locationArry) {


              if (err) {
                database.close();
                resolve(doctor)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
              if (!locationArry || (locationArry && locationArry.length == 0)) {
                database.close();
                //return common.handleError(err, 'patient could not be found',res,500)                    
                resolve(doctor)
              }

              let filterSetting = { doctorId: ObjectId(doctor._id).toString() }
              db.collection('settings').findOne(filterSetting, function (error, setting) {


                let practice_details = []
                locationArry.forEach(function (location, index) {
                  let address = location.address + "," + location.area + "," + location.city
                  let fees = 0
                  if (setting) {
                    fees = setting['serviceFees']
                  }
                  practice_details.push({ "practice_location": address, locationid: location._id, "Fees": fees })

                })
                doctor.practice_details = practice_details
                database.close();
                resolve(doctor)

              })

            });
          })
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Error retrieving customer record', res, 500)

        }


      }));
    }
    //else{
    //continue
    //}

  })

  return Promise.all(promises)

}



const getLocationDetailsWITHFEESList = async (doctorsArray, fees) => {
  let promises = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  doctorsArray.forEach(function (doctor, index) {
    if (doctor && ObjectId.isValid(doctor._id)) {
      //doctor.password = ''
      doctor.uploadPhotoProfessional = ''
      doctor.uploadPhotoDemographic = ''
      doctor.password = ''
      promises.push(new Promise(resolve => {
        try {
          MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
            var db = database.db()
            let filter = { doctorID: ObjectId(doctor._id).toString() }
            //   db.collection('practice_locations').findOne(filter,function(error, location) {
            db.collection('practice_locations').find(filter).toArray(function (err, locationArry) {


              if (err) {
                database.close();
                resolve(doctor)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
              if (!locationArry || (locationArry && locationArry.length == 0)) {
                database.close();
                //return common.handleError(err, 'patient could not be found',res,500)                    
                resolve(doctor)
              }

              let filterSetting = { doctorId: ObjectId(doctor._id).toString(), serviceFees: fees }
              db.collection('settings').findOne(filterSetting, function (error, setting) {


                let practice_details = []
                locationArry.forEach(function (location, index) {
                  let address = location.address + "," + location.area + "," + location.city
                  let fees = 0
                  if (setting) {
                    fees = setting['serviceFees']
                  }
                  practice_details.push({ "practice_location": address, locationid: location._id, "Fees": fees })

                })
                doctor.practice_details = practice_details
                database.close();
                resolve(doctor)

              })

            });
          })
        } catch (error) {
          //console.error(error)
          return common.handleError(error, 'Error retrieving customer record', res, 500)

        }


      }));
    }
    //else{
    //continue
    //}

  })

  return Promise.all(promises)

}


const geteFeesDetails = async (doctorsArray) => {
  let promises = []
  var locationNewArray = []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  doctorsArray.forEach(function (doctor, index) {

    promises.push(new Promise(resolve => {

      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {
        var db = database.db()
        let filter = { doctorId: ObjectId(doctor._id).toString() }
        db.collection('settings').findOne(filter, function (error, doctor) {

          console.log("fees per doctor == " + JSON.stringify(doctor))
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


const getdoctorByNameAndFeesList = async (doctorsIDArray, fees, name, res) => {
  doctorsArray = await getDoctorDetailsFromIdNameList(doctorsIDArray, name)
  //doctorsArray = await getLocationDetailsList(doctorsArray)
  doctorsArray = await getLocationDetailsWITHFEESList(doctorsArray, fees)
  doctorsArray = await getFeedbackListByDoctor(doctorsArray)
  //  doctorsArray = await geteFeesDetails(practiceLocationArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });

}
const getdoctorByLocationAndNameAndFeesList = async (doctorsIDArray, fees, location, name, res) => {
  //doctorsArray = await getDoctorDetailsFromIdList(doctorsIDArray)
  doctorsArray = await getDoctorDetailsFromIdNameList(doctorsIDArray, name)
  // doctorsArray = await getLocationDetailsByLocationNameList(doctorsArray,location)
  doctorsArray = await getLocationDetailsByLocationNameWITHFEESList(doctorsArray, fees, location)
  doctorsArray = await getFeedbackListByDoctor(doctorsArray)
  //  doctorsArray = await geteFeesDetails(practiceLocationArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });

}
const getdoctorByLocationAndFeesList = async (doctorsIDArray, fees, location, res) => {
  doctorsArray = await getDoctorDetailsFromIdList(doctorsIDArray)
  doctorsArray = await getLocationDetailsByLocationNameWITHFEESList(doctorsArray, fees, location)
  doctorsArray = await getFeedbackListByDoctor(doctorsArray)
  //  doctorsArray = await geteFeesDetails(practiceLocationArry)

  dlog("doctorsArray == " + JSON.stringify(doctorsArray))
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });

}

const getdoctorLOcationwithFeesFORFetchDoctorByPrice = async (doctorsIDArray, fees, res) => {
  doctorsArray = await getDoctorDetailsFromIdList(doctorsIDArray)
  //doctorsArray = await getLocationDetailsList(doctorsArray)
  doctorsArray = await getLocationDetailsWITHFEESList(doctorsArray, fees)
  doctorsArray = await getFeedbackListByDoctor(doctorsArray)
  //  doctorsArray = await geteFeesDetails(practiceLocationArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });

}



const getConfirmeddoctorListByPtient = async (doctorsIDArray, res) => {
  doctorsArray = await getDoctorDetailsFromIdList(doctorsIDArray)

  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });

}

const getdoctorByLocationAndNameList = async (doctorsArray, location, res) => {
  //doctorsArray = await getDoctorDetailsFromIdList(doctorsIDArray)

  doctorsArray = await getLocationDetailsByLocationNameList(doctorsArray, location)
  doctorsArray = await getFeedbackListByDoctor(doctorsArray)
  //  doctorsArray = await geteFeesDetails(practiceLocationArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });

}

const getdoctorLOcationwithFees = async (doctorsArray, res) => {
  doctorsArray = await getLocationDetailsList(doctorsArray)
  doctorsArray = await getFeedbackListByDoctor(doctorsArray)
  //  doctorsArray = await geteFeesDetails(practiceLocationArry)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });

}

const getDOctorByLocationList = async (practiceLocationArry, location, res) => {

  doctorsArray = await getDoctorDetailsList(practiceLocationArry)
  doctorsArray = await getLocationDetailsByLocationNameList(doctorsArray, location)
  //doctorsArray = await getLocationDetailsList(doctorsArray)

  doctorsArray = await getFeedbackListByDoctor(doctorsArray)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });



}

const getDOctoraAndFees = async (practiceLocationArry, res) => {

  doctorsArray = await getDoctorDetailsList(practiceLocationArry)
  doctorsArray = await getLocationDetailsList(doctorsArray)


  doctorsArray = await getFeedbackListByDoctor(doctorsArray)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });



}


const getDOctoraByLocationName = async (practiceLocationArry, location, res) => {

  doctorsArray = await getDoctorDetailsList(practiceLocationArry)
  //doctorsArray = await getLocationDetailsList(doctorsArray)
  doctorsArray = await getLocationDetailsByLocationNameList(doctorsArray, location)

  doctorsArray = await getFeedbackListByDoctor(doctorsArray)

  //  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
  return res.json({
    status: true,
    message: 'Doctors array retrieval successful.',
    data: doctorsArray
  });



}


var doctorAppDoctorFetchApiEndPoint = "http://" + process.env.DOCTORAPPIPADDRESS + ":" + process.env.DOCTORAPPPORT + "/api/fetchDoctorDetails"

module.exports = function (app) {

  app.post('/api/fetch-doctors-by-feeslocationname', [
    check('fees').trim().escape(),
    check('location').trim().escape(),
    check('name').trim().escape()
  ], function (req, res) {
    try {

      dlog(" inside fetch-doctors-by-price api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(), 'Validation error.', res, 999)
      }

      dlog("price =" + req.body.fees)


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

        var db = database.db()


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

        dlog(" Database connected successfully at updateAppointmentPatientDB")

        if (req.body.fees
          && (
            (req.body.location && req.body.name)
            || (!req.body.location && req.body.name)
            || (req.body.location && !req.body.name)
          )
        ) {
          let filter = { serviceFees: req.body.fees }

          db.collection('settings').find(filter).toArray(function (err, settingArry) {

            if (err) return common.handleError(err, 'Error, No doctor record found with the given service fees', res, 500)
            if (!settingArry || (settingArry && settingArry.length == 0)) {
              database.close();
              return common.handleError(err, 'No doctor record found with the given service fees', res, 500)
            }

            var doctorIdList = []
            var doctorIdAlreadyList = []

            for (var i in settingArry) {

              let attendant = settingArry[i]
              if (!doctorIdAlreadyList.includes(attendant['doctorId']) && attendant['doctorId'] != null) {
                doctorIdAlreadyList.push(attendant['doctorId'])
                doctorIdList.push({ doctorId: attendant['doctorId'] })
              }

            }

            if (doctorIdList && doctorIdList.length > 0) {

              if (req.body.location && req.body.name) {
                getdoctorByLocationAndNameAndFeesList(doctorIdList, req.body.fees, req.body.location, req.body.name, res)
              }
              if (!req.body.location && req.body.name) {
                getdoctorByNameAndFeesList(doctorIdList, req.body.fees, req.body.name, res)
              }
              if (req.body.location && !req.body.name) {
                getdoctorByLocationAndFeesList(doctorIdList, req.body.fees, req.body.location, res)
              }

            } else {
              return common.handleError(err, 'No doctor record found with the given service fees', res, 500)
            }

          });
        }

        if (req.body.name
          && (
            (req.body.location && !req.body.fees)
            || (!req.body.location && !req.body.fees)
          )
        ) {
          let filter = { name: { '$regex': req.body.name, $options: '-i' } }

          db.collection('doctor_professional_details').find(filter).toArray(function (err, doctorsArry) {
            //  console.log("doctorsArry == "+JSON.stringify(doctorsArry))
            if (err) return common.handleError(err, 'Error, No doctor record found with the given specialty ', res, 500)
            if (!doctorsArry || (doctorsArry && doctorsArry.length == 0)) {

              database.close();
              return common.handleError(err, 'No doctor record found with the given specialty', res, 500)
            }

            database.close();
            if (req.body.location && !req.body.fees) {
              getdoctorByLocationAndNameList(doctorsArry, req.body.location, res)
            }
            if (!req.body.location && !req.body.fees) {
              getdoctorLOcationwithFees(doctorsArry, res)
            }
          });
        }
        if (req.body.location
          && (
            (!req.body.name && !req.body.fees)
          )
        ) {
          let cityOrArea = req.body.location
          let filter = { $or: [{ city: { '$regex': cityOrArea, $options: '-i' } }, { area: { '$regex': cityOrArea, $options: '-i' } }, { address: { '$regex': cityOrArea, $options: '-i' } }] }

          db.collection('practice_locations').find(filter).toArray(function (err, practiceLocationArry) {

            if (err) return common.handleError(err, 'Error, Erro fetching Practice Location', res, 500)
            if (!practiceLocationArry || (practiceLocationArry && practiceLocationArry.length == 0)) {
              database.close();
              return common.handleError(err, 'No Practice Location record found with the given city Or Area or address', res, 500)
            }
            if (practiceLocationArry) {
              getDOctorByLocationList(practiceLocationArry, req.body.location, res)
              //callDoctorListFunction(practiceLocationArry,res)

            }

          });

        }

      });

      // }

      /*
      
      */
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving record', res, 500)

    }


  });

  app.post('/api/fetchDoctorListofAcceptedAppointments', [
    check('patientId').not().isEmpty().trim()
  ], function (req, res) {
    dlog(" inside get view-alltodays-appointment api   ")

    if (ObjectId.isValid(req.body.patientId)) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(), 'validation error.', res, 999)
      }

      let extra = "Confirm"


      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

        var db = database.db()

        dlog("step1.1")
        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

        dlog(" Database connected successfully at view-alltodays-appointments")

        // extra = "Confirm"
        //let filter ={$and : [ {"status": new RegExp(["^", extra, "$"].join(""), "i")},{"patientId" : ObjectId(req.body.patientId).toString()}]}  



        let filter = { $and: [{ status: { '$regex': extra, $options: 'i' } }, { patientId: ObjectId(req.body.patientId).toString() }] }



        console.log("filter" + JSON.stringify(filter))
        db.collection('appointments').find(filter).toArray(function (err, appointmentArry) {
          console.log("fiappointmentArrylter" + JSON.stringify(appointmentArry))
          if (err) return common.handleError(err, 'Error, No Appointment record found with the given month', res, 500)
          if (!appointmentArry || (appointmentArry && appointmentArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No Appointment record found', res, 500)
          }

          database.close();

          var doctorIdList = []
          var doctorIdAlreadyList = []

          for (var i in appointmentArry) {

            let attendant = appointmentArry[i]
            if (!doctorIdAlreadyList.includes(attendant['doctorId']) && attendant['doctorId'] != null) {
              doctorIdAlreadyList.push(attendant['doctorId'])
              doctorIdList.push({ doctorId: attendant['doctorId'] })
            }

          }

          if (doctorIdList && doctorIdList.length > 0) {
            getConfirmeddoctorListByPtient(doctorIdList, res)
          } else {
            return common.handleError(err, 'No doctor record having confirmed appointments with the given patient id ', res, 500)
          }

        });

      });
    } else {
      return common.handleError(err, 'wrong patiendID is being passed', res, 500)
    }

  })

  app.post('/api/fetch-doctors-by-price', [
    check('price').not().isEmpty().trim()
  ], function (req, res) {
    try {

      dlog(" inside fetch-doctors-by-price api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(), 'Validation error.', res, 999)
      }

      dlog("price =" + req.body.price)
      MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

        var db = database.db()


        if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

        dlog(" Database connected successfully at updateAppointmentPatientDB")

        let filter = { serviceFees: req.body.price }

        db.collection('settings').find(filter).toArray(function (err, settingArry) {

          if (err) return common.handleError(err, 'Error, No doctor record found with the given service fees', res, 500)
          if (!settingArry || (settingArry && settingArry.length == 0)) {
            database.close();
            return common.handleError(err, 'No doctor record found with the given service fees', res, 500)
          }

          var doctorIdList = []
          var doctorIdAlreadyList = []

          for (var i in settingArry) {

            let attendant = settingArry[i]
            if (!doctorIdAlreadyList.includes(attendant['doctorId']) && attendant['doctorId'] != null) {
              doctorIdAlreadyList.push(attendant['doctorId'])
              doctorIdList.push({ doctorId: attendant['doctorId'] })
            }

          }

          if (doctorIdList && doctorIdList.length > 0) {
            getdoctorLOcationwithFeesFORFetchDoctorByPrice(doctorIdList, req.body.price, res)
          } else {
            return common.handleError(err, 'No doctor record found with the given service fees', res, 500)
          }

        });

      });
    } catch (error) {
      //console.error(error)
      return common.handleError(error, 'Error retrieving record', res, 500)

    }

  });

  app.post('/api/fetch-doctors-by-specialty', [
    check('specialty').not().isEmpty().trim()
  ], function (req, res) {
    dlog(" inside fetch-doctors-by-price api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    dlog("specialty =" + req.body.specialty)
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()


      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at fetch-doctors-by-specialty")

      let filter = { practiceCategory: { '$regex': req.body.specialty, $options: '-i' } }

      db.collection('doctor_professional_details').find(filter).toArray(function (err, doctorsArry) {
        //  console.log("doctorsArry == "+JSON.stringify(doctorsArry))
        if (err) return common.handleError(err, 'Error, No doctor record found with the given specialty ', res, 500)
        if (!doctorsArry || (doctorsArry && doctorsArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No doctor record found with the given specialty', res, 500)
        }

        database.close();
        //  var doctorList = []
        /*
                for( var i in doctorsArry){
        
                  let doctor = doctorsArry[i]
                  
                  doctor.uploadPhotoProfessional = ''
                  doctor.uploadPhotoDemographic = ''
                  doctor.password = ''

                  if(!doctorList.includes(doctor['_id']) && doctor['_id'] !=null){
                    doctorList.push(doctor)
                  }
                  
                }

                if(doctorList && doctorList.length >0){*/
        getdoctorLOcationwithFees(doctorsArry, res)
        //}

        /*
        return res.json({
          status: true,
          message: 'Doctor array retrieval success...',
          //data: doctorIdList
          data : doctorList
          });
      */

      });

    });

  });

  app.post('/api/fetch-doctors-by-degree', [
    check('degreeType').not().isEmpty().trim()
  ], function (req, res) {
    dlog(" inside fetch-doctors-by-degree api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    dlog("degreeType =" + req.body.degreeType)
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()


      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at fetch-doctors-by-degree")

      let filter = { degreeDiploma: { '$regex': req.body.degreeType, $options: '-i' } }

      db.collection('doctor_professional_details').find(filter).toArray(function (err, doctorsArry) {
        //  console.log("doctorsArry == "+JSON.stringify(doctorsArry))
        if (err) return common.handleError(err, 'Error, No doctor record found with the given specialty ', res, 500)
        if (!doctorsArry || (doctorsArry && doctorsArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No doctor record found with the given specialty', res, 500)
        }

        database.close();
        getdoctorLOcationwithFees(doctorsArry, res)

      });

    });

  });


  app.post('/api/fetch-doctors-by-name', [
    check('name').not().isEmpty().trim()
  ], function (req, res) {
    dlog(" inside fetch-doctors-by-name api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    dlog("specialty =" + req.body.specialty)
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()


      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at fetch-doctors-by-name")

      let filter = { name: { '$regex': req.body.name, $options: '-i' } }

      db.collection('doctor_professional_details').find(filter).toArray(function (err, doctorsArry) {
        //  console.log("doctorsArry == "+JSON.stringify(doctorsArry))
        if (err) return common.handleError(err, 'Error, No doctor record found with the given specialty ', res, 500)
        if (!doctorsArry || (doctorsArry && doctorsArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No doctor record found with the given specialty', res, 500)
        }

        database.close();
        getdoctorLOcationwithFees(doctorsArry, res)


      });

    });

  });
  app.post('/api/fetch-practice-locations-by-cityarea', [
    check('cityOrArea').not().isEmpty().trim()
  ], function (req, res) {
    dlog(" inside fetch-practice-locations-by-cityarea api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }
    let cityOrArea = req.body.cityOrArea
    dlog("cityOrArea =" + req.body.cityOrArea)
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at updateAppointmentPatientDB")

      let filter = { $or: [{ city: { '$regex': cityOrArea, $options: '-i' } }, { area: { '$regex': cityOrArea, $options: '-i' } }, { address: { '$regex': cityOrArea, $options: '-i' } }] }

      db.collection('practice_locations').find(filter).toArray(function (err, practiceLocationArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching Practice Location', res, 500)
        if (!practiceLocationArry || (practiceLocationArry && practiceLocationArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No Practice Location record found with the given city Or Area or address', res, 500)
        }
        database.close();
        return res.json({
          status: true,
          message: 'Practice Location array retrieval success...',
          //data: doctorIdList
          data: practiceLocationArry
        });

      });

    });

  });

  app.post('/api/fetch-doctors-by-location', [
    check('cityOrArea').not().isEmpty().trim()
  ], function (req, res) {
    dlog(" inside fetch-practice-locations-by-cityarea api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }
    let cityOrArea = req.body.cityOrArea
    dlog("cityOrArea =" + req.body.cityOrArea)
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()
      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at updateAppointmentPatientDB")

      let filter = { $or: [{ city: { '$regex': cityOrArea, $options: '-i' } }, { area: { '$regex': cityOrArea, $options: '-i' } }, { address: { '$regex': cityOrArea, $options: '-i' } }] }

      db.collection('practice_locations').find(filter).toArray(function (err, practiceLocationArry) {

        if (err) return common.handleError(err, 'Error, Erro fetching Practice Location', res, 500)
        if (!practiceLocationArry || (practiceLocationArry && practiceLocationArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No Practice Location record found with the given city Or Area or address', res, 500)
        }
        if (practiceLocationArry) {
          //getDOctoraAndFees(practiceLocationArry,res)
          getDOctoraByLocationName(practiceLocationArry, cityOrArea, res)
          //callDoctorListFunction(practiceLocationArry,res)

        }

      });

    });

  });

  app.post('/api/fetch-doctors-by-datetime', [
    check('date').not().isEmpty().trim(),
    check('time').not().isEmpty().trim()
  ], function (req, res) {

    dlog(" inside fetch-doctors-by-datetime api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'Validation error.', res, 999)
    }

    dlog("price =" + req.body.price)
    MongoClient.connect(mongoDB.doctorDBUrl, function (err, database) {

      var db = database.db()


      if (err) return common.handleError(err, 'No DB connection could be made to  DB', res, 500)

      dlog(" Database connected successfully at updateAppointmentPatientDB")

      let filter = { "dateTime": { date: req.body.date, time: req.body.time } }

      //   db.collection('practice_locations').find(filter,function(err, locationArry) {

      db.collection('practice_locations').find(filter).toArray(function (err, locationArry) {

        if (err) return common.handleError(err, 'Error, while fetching location', res, 500)
        if (!locationArry || (locationArry && locationArry.length == 0)) {
          database.close();
          return common.handleError(err, 'No practice location found for the given date and time', res, 500)
        }

        if (locationArry) {
          //  callDoctorListFunction(locationArry,res)
          getDOctoraAndFees(practiceLocationArry, res)
        }


      });

    });

  });

}
function callDoctorListFunction(locationArry, res) {
  var doctorList = []

  let arrayLen = locationArry.length

  dlog("arrayLen =" + arrayLen)

  locationArry.forEach(function (listItem, index) {

    let doctorId = listItem.doctorID
    let jsonBody = {
      "doctorId": doctorId
    }

    //dlog("jsonBody ="+JSON.stringify(jsonBody))
    request({
      url: doctorAppDoctorFetchApiEndPoint,
      method: 'POST',
      headers: {
        'content-Type': "application/json",
        'accept': "application/json"
      },
      body: JSON.stringify(jsonBody)
    }
      , function (error, response, body) {
        if (error) {
          return common.handleError(error, 'Failed to retrieve doctors from remote doctorSignet DB, please make sure the API is accessible', res, 500)
        }
        else {
          let json = JSON.parse(body);
          if (json && json.data) {
            //  console.log("json == "+JSON.stringify(json.data))
            doctorList.push(json.data)
          }


          // console.log(JSON.stringify(doctorList))
          //dlog("index ="+index)
          if (index == arrayLen - 1) {
            return res.json({
              status: true,
              message: 'Doctor array retrieval success...',
              //data: doctorIdList
              data: doctorList
            });
          }
        }
      });


  })
}
