

const {check, validationResult} = require('express-validator');
const EprescriptionOpen = require('../../models/eprescription/eprescription-open');
const PracticeLocation = require('../../models/practice-location');
const EprescriptionStatus = require('../../models/eprescription/eprescription-status');

const EprescriptionBasicDetails = require('../../models/eprescription/eprescription-basic-details');

const EprescriptionDoctorDetails = require('../../models/eprescription/eprescription-doctor-details');

const EprescriptionMedication = require('../../models/eprescription/eprescription-medication');

const EprescriptionPreviousMedicalHistory = require('../../models/eprescription/eprescription-previous-medical-history');
const EprescriptionTest = require('../../models/eprescription/eprescription-test');

const EprescriptionTherapy = require('../../models/eprescription/eprescription-therapy');
var request = require('request');
var patientFetchApiEndPoint =  "http://"+process.env.PATIENTAPPIPADDRESS+":"+process.env.PATIENTPORT+"/api/fetchPatientDetails"



var moment = require('moment');
var fs = require('fs');
const PDFDocument = require('pdfkit');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');

var dlog = require('debug')('dlog')
var FONTSIZE = 9
var LABELFONTSIZE = 10
var HEADERFONTSIZE = 12
const common = require('../../utility/common');
//const fsp = require("fs/promises");

const updateEprescriptionRecord =  (eprescriptionId,pdfURL) =>{
  EprescriptionOpen.findById(eprescriptionId, function (err, eprescriptionOpenRec) {

    if(pdfURL && pdfURL.trim() !=""){
      eprescriptionOpenRec.pdfURL = pdfURL
    }
    eprescriptionOpenRec.save(function (err) {
      dlog(" pdfURL updated to the record id " + eprescriptionId)   
    });
      
    
  })
}

module.exports = function (app) {

app.post('/api/eprescription-open-add', [
    
  
   check('patientId').not().isEmpty().trim().escape(), 
   check('locationId').not().isEmpty().trim().escape(),   
   check('name').not().isEmpty().trim(),
   check('sex').not().isEmpty().trim(),  
   check('profession').not().isEmpty().trim(),
   check('bloodPressure').not().isEmpty().trim(),
   check('height').not().isEmpty().trim(),   
   check('weight').not().isEmpty().trim()
  
],function (req, res) {        
      dlog(" inside eprescription-patient add api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)
      }

      dlog("name ="+req.body.name)
      var inputCollection = req.body    
      var temp = new EprescriptionOpen(inputCollection)
        
      // insert data into database
      temp.save(function (error, eprescriptionOpenRec) {
        // check error
        if (error) {
          return common.handleError(error,'DB Insert Fail...',res,500)           
        }

        // Everything OK
        return res.json({
          status: true,
          message: 'Eprescription Insert Success...',
          data: eprescriptionOpenRec
        });
      });
  
  });
  app.post('/api/eprescription-open-edit', [
    check('eprescriptionId').not().isEmpty().trim().escape()/*, 
    check('patientId').not().isEmpty().trim().escape(), 
    check('locationId').not().isEmpty().trim().escape(),   
    check('name').not().isEmpty().trim(),
    check('sex').not().isEmpty().trim(),  
    check('profession').not().isEmpty().trim(),
    check('bloodPressure').not().isEmpty().trim(),
    check('height').not().isEmpty().trim(),   
    check('weight').not().isEmpty().trim()*/
   
 ],function (req, res) {        
       dlog(" inside eprescription-patient add api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
      
    EprescriptionOpen.findById(req.body.eprescriptionId, function (err, eprescriptionOpenRec) {
      
        if (err || !eprescriptionOpenRec) return  common.handleError(err, 'No eprescription  record found with the given eprescriptionId',res,500)   
        
        if(req.body.practiceLocationID && req.body.practiceLocationID.trim() !="")
        eprescriptionOpenRec.practiceLocationID = req.body.practiceLocationID
          
        if(req.body.patientId && req.body.patientId.trim() !="")
          eprescriptionOpenRec.patientId = req.body.patientId

        if(req.body.locationId && req.body.locationId.trim() !=""){
          eprescriptionOpenRec.locationId = inputCollection.locationId
        }
        if(req.body.name && req.body.name.trim() !="")
        eprescriptionOpenRec.name = req.body.name

        if(req.body.sex && req.body.sex.trim() !=""){
        eprescriptionOpenRec.sex = inputCollection.sex
        }

        if(req.body.profession && req.body.profession.trim() !="")
          eprescriptionOpenRec.profession = req.body.profession

        if(req.body.bloodPressure && req.body.bloodPressure.trim() !=""){
          eprescriptionOpenRec.bloodPressure = inputCollection.bloodPressure
        }

        if(req.body.height && req.body.height.trim() !="")
        eprescriptionOpenRec.height = req.body.height

        if(req.body.weight && req.body.weight.trim() !=""){
        eprescriptionOpenRec.weight = inputCollection.weight
        }

        if(req.body.pdfURL && req.body.pdfURL.trim() !=""){
          eprescriptionOpenRec.weight = req.body.pdfURL
          }
    
        eprescriptionOpenRec.save(function (err) {
            if (err) return common.handleError(err, 'eprescription record could not be updated',res,500)   
           
            return res.json({
              status: true,
              message: 'eprescription edit Success...',
              data: eprescriptionOpenRec
            });
         
          });
          
        });
  
   
   });
  app.post('/api/eprescription-status-add', [
    
    check('eprescriptionId').not().isEmpty().trim().escape(), 
    check('status').not().isEmpty().trim().escape()
   
 ],function (req, res) {        
       dlog(" inside eprescription-status add api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
       var temp = new EprescriptionStatus(inputCollection)
         
       EprescriptionOpen.findById(req.body.eprescriptionId  , { lean: true }, function (err, eprescriptionOpenRec) {
        if (err || !eprescriptionOpenRec) return  common.handleError(err, 'No eprescription record found with the given  ID',res,500)   
      
       // insert data into database
       temp.save(function (error, eprescriptionStatus) {
         // check error
         if (error) {
           return common.handleError(error,'DB Insert Fail...',res,500)           
         }
 
         // Everything OK
         return res.json({
           status: true,
           message: 'Eprescription Status Insert Success...',
           data: eprescriptionStatus
         });
       });
    });
   
   });

   app.post('/api/eprescription-status-edit', [
    check('eprescriptionStatusId').not().isEmpty().trim().escape()/*, 
    check('status').not().isEmpty().trim().escape()*/
   
 ],function (req, res) {        
       dlog(" inside eprescription-status-edit api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
      
    EprescriptionStatus.findById(req.body.eprescriptionStatusId, function (err, eprescriptionStatusRec) {
      
        if (err || !eprescriptionStatusRec) return  common.handleError(err, 'No eprescription status record found with the given eprescriptionStatusId',res,500)   
        
        if(req.body.status && req.body.status.trim() !="")
          eprescriptionStatusRec.status = req.body.status
          
       
        eprescriptionStatusRec.save(function (err) {
            if (err) return common.handleError(err, 'eprescription status record could not be updated',res,500)   
           
            return res.json({
              status: true,
              message: 'eprescription status edit Success...',
              data: eprescriptionStatusRec
            });
         
          });
          
        });
  
   
   });

   app.post('/api/eprescription-basic-details-add', [
    
    check('eprescriptionId').not().isEmpty().trim().escape(), 
    check('symptoms').not().isEmpty().trim().escape(), 
    check('frequency').not().isEmpty().trim().escape(), 
    check('anySpecific').not().isEmpty().trim().escape() 
   
 ],function (req, res) {        
       dlog(" inside eprescription-basic-details add api")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
       var temp = new EprescriptionBasicDetails(inputCollection)
         
       EprescriptionOpen.findById(req.body.eprescriptionId, { lean: true }, function (err, eprescriptionOpen) {
        if (err || !eprescriptionOpen) return  common.handleError(err, 'No eprescription record found with the given  ID',res,500)   
      
       // insert data into database
       temp.save(function (error, eprescriptionBasicDetails) {
         // check error
         if (error) {
           return common.handleError(error,'DB Insert Fail...',res,500)           
         }
 
         // Everything OK
         return res.json({
           status: true,
           message: 'Eprescription basic-details Insert Success...',
           data: eprescriptionBasicDetails
         });
       });
    });
   
   });

   app.post('/api/eprescription-basic-details-edit', [
    check('eprescriptionBasicDetailsId').not().isEmpty().trim().escape()/*, 
    check('symptoms').not().isEmpty().trim().escape(), 
    check('frequency').not().isEmpty().trim().escape(), 
    check('anySpecific').not().isEmpty().trim().escape() */
   
 ],function (req, res) {        
       dlog(" inside eprescription-basic-details edit api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
      
    EprescriptionBasicDetails.findById(req.body.eprescriptionBasicDetailsId, function (err, eprescriptionBasicDetailsRec) {
      
        if (err || !eprescriptionBasicDetailsRec) return  common.handleError(err, 'No eprescription status record found with the given eprescriptionBasicDetailsId',res,500)   
        
        if(req.body.symptoms && req.body.symptoms.trim() !="")
        eprescriptionBasicDetailsRec.symptoms = req.body.symptoms
          

        if(req.body.frequency && req.body.frequency.trim() !="")
        eprescriptionBasicDetailsRec.frequency = req.body.frequency
          
        if(req.body.anySpecific && req.body.anySpecific.trim() !="")
        eprescriptionBasicDetailsRec.anySpecific = req.body.anySpecific

          
        eprescriptionBasicDetailsRec.save(function (err) {
            if (err) return common.handleError(err, 'eprescription BasicDetails record could not be updated',res,500)   
           
            return res.json({
              status: true,
              message: 'eprescription BasicDetails edit Success...',
              data: eprescriptionBasicDetailsRec
            });
         
          });
          
        });
  
   
   });


   app.post('/api/eprescription-doctor-details-add', [
    
    check('eprescriptionId').not().isEmpty().trim().escape(), 
    check('doctorId').not().isEmpty().trim().escape(), 
    check('doctorName').not().isEmpty().trim().escape()    
    
   
 ],function (req, res) {        
       dlog(" inside eprescription-doctor-details add api")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
       var temp = new EprescriptionDoctorDetails(inputCollection)
         
       EprescriptionOpen.findById(req.body.eprescriptionId, { lean: true }, function (err, eprescriptionOpen) {
        if (err || !eprescriptionOpen) return  common.handleError(err, 'No eprescription record found with the given  ID',res,500)   
      
       // insert data into database
       temp.save(function (error, eprescriptionDoctorDetails) {
         // check error
         if (error) {
           return common.handleError(error,'DB Insert Fail...',res,500)           
         }
 
         // Everything OK
         return res.json({
           status: true,
           message: 'Eprescription doctor-details Insert Success...',
           data: eprescriptionDoctorDetails
         });
       });
    });
   
   });

   app.post('/api/eprescription-doctor-details-edit', [
    check('eprescriptionDoctorDetailsId').not().isEmpty().trim().escape()/*, 
check('doctorId').not().isEmpty().trim().escape(), 
    check('doctorName').not().isEmpty().trim().escape()*/
 ],function (req, res) {        
       dlog(" inside eprescription-doctor details edit api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
      
    EprescriptionDoctorDetails.findById(req.body.eprescriptionDoctorDetailsId, function (err, eprescriptionDoctorDetailsRec) {
      
        if (err || !eprescriptionDoctorDetailsRec) return  common.handleError(err, 'No eprescription doctor-details record found with the given eprescriptionDoctorDetailsId',res,500)   
        
        if(req.body.doctorId)
          eprescriptionDoctorDetailsRec.doctorId = req.body.doctorId
          

        if(req.body.doctorName)
          eprescriptionDoctorDetailsRec.doctorName = req.body.doctorName
          
        if(req.body.digitalSigned)
          eprescriptionDoctorDetailsRec.digitalSigned = req.body.digitalSigned

          
        eprescriptionDoctorDetailsRec.save(function (err) {
            if (err) return common.handleError(err, 'eprescription doctor details record could not be updated',res,500)   
           
            return res.json({
              status: true,
              message: 'eprescription doctor details edit Success...',
              data: eprescriptionDoctorDetailsRec
            });
         
          });
          
        });
  
   
   });
//EprescriptionMedication 
app.post('/api/eprescription-medication-add', [
    
  check('eprescriptionId').not().isEmpty().trim().escape(), 
  check('medicationName').not().isEmpty().trim().escape(), 
  check('composition').not().isEmpty().trim().escape(),     
  check('medicationCategory').not().isEmpty().trim().escape(),
  check('frequency').not().isEmpty().trim().escape(),
  check('dosesFrequency').not().isEmpty().trim().escape(),
  check('beforeAfterFood').not().isEmpty().trim().escape(),
  check('anySpecial').not().isEmpty().trim().escape(),
 
],function (req, res) {        
     dlog(" inside eprescription-medication add api")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
     var inputCollection = req.body    
     var temp = new EprescriptionMedication(inputCollection)
       
     EprescriptionOpen.findById(req.body.eprescriptionId, { lean: true }, function (err, eprescriptionOpen) {
      if (err || !eprescriptionOpen) return  common.handleError(err, 'No eprescription record found with the given  ID',res,500)   
    
     // insert data into database
     temp.save(function (error, eprescriptionMedication) {
       // check error
       if (error) {
         return common.handleError(error,'DB Insert Fail...',res,500)           
       }
       // Everything OK
       return res.json({
         status: true,
         message: 'Eprescription medication Insert Success...',
         data: eprescriptionMedication
       });
     });
  });
 
 });

 app.post('/api/eprescription-medication-edit', [
    check('eprescriptionMedicationId').not().isEmpty().trim().escape()/*, 
    check('medicationName').not().isEmpty().trim().escape(), 
    check('composition').not().isEmpty().trim().escape(),     
    check('medicationCategory').not().isEmpty().trim().escape(),
    check('frequency').not().isEmpty().trim().escape(),
    check('dosesFrequency').not().isEmpty().trim().escape(),
    
    check('beforeAfterFood').not().isEmpty().trim().escape(),
    check('anySpecial').not().isEmpty().trim().escape()*/
],function (req, res) {        
     dlog(" inside eprescription medication edit api  ")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
     var inputCollection = req.body    
    
  EprescriptionMedication.findById(req.body.eprescriptionMedicationId, function (err, eprescriptionMedicationRec) {
    
      if (err || !eprescriptionMedicationRec) return  common.handleError(err, 'No eprescription medication record found with the given eprescriptionMedicationId',res,500)   
      
      if(req.body.medicationName)
        eprescriptionMedicationRec.medicationName = req.body.medicationName
        

      if(req.body.composition)
        eprescriptionMedicationRec.composition = req.body.composition
      if(req.body.medicationCategory)
        eprescriptionMedicationRec.medicationCategory = req.body.medicationCategory     
      if(req.body.frequency)
        eprescriptionMedicationRec.frequency = req.body.frequency     
        if(req.body.dosesFrequency)
        eprescriptionMedicationRec.dosesFrequency = req.body.dosesFrequency   
      if(req.body.anySpecial)
        eprescriptionMedicationRec.anySpecial = req.body.anySpecial

      if(req.body.remarks)
        eprescriptionMedicationRec.remarks = req.body.remarks
        
      eprescriptionMedicationRec.save(function (err) {
          if (err) return common.handleError(err, 'eprescription doctor details record could not be updated',res,500)   
         
          return res.json({
            status: true,
            message: 'eprescription doctor details edit Success...',
            data: eprescriptionMedicationRec
          });
       
        });
        
      });

 
 });


 app.post('/api/eprescription-previous-medical-history-add', [
    
  check('eprescriptionId').not().isEmpty().trim().escape(), 
  check('diseaseName').not().isEmpty().trim().escape(),   
  check('previousMedication').not().isEmpty().trim().escape(),
  check('lastTestResults').not().isEmpty().trim().escape()
 
],function (req, res) {        
     dlog(" inside eprescription-previous-medical-history add api")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
     var inputCollection = req.body    
     var temp = new EprescriptionPreviousMedicalHistory(inputCollection)
       
     EprescriptionOpen.findById(req.body.eprescriptionId, { lean: true }, function (err, eprescriptionOpen) {
      if (err || !eprescriptionOpen) return  common.handleError(err, 'No eprescription record found with the given  ID',res,500)   
    
     // insert data into database
     temp.save(function (error, eprescriptionPreviousMedicalHistory) {
       // check error
       if (error) {
         return common.handleError(error,'DB Insert Fail...',res,500)           
       }
       // Everything OK
       return res.json({
         status: true,
         message: 'Eprescription previous-medical-history Insert Success...',
         data: eprescriptionPreviousMedicalHistory
       });
     });
  });
 
 });

 app.post('/api/eprescription-previous-medical-history-edit', [
    check('eprescriptionPreviousMedicalHistoryId').not().isEmpty().trim().escape()/*, 
    check('diseaseName').not().isEmpty().trim().escape(), 
  check('previousMedication').not().isEmpty().trim().escape(),
  check('lastTestResults').not().isEmpty().trim().escape()*/
],function (req, res) {        
     dlog(" inside eprescription previous-medical-history edit api  ")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
     var inputCollection = req.body    
    
  EprescriptionPreviousMedicalHistory.findById(req.body.eprescriptionPreviousMedicalHistoryId, function (err, eprescriptionPreviousMedicalHistoryRec) {
    
      if (err || !eprescriptionPreviousMedicalHistoryRec) return  common.handleError(err, 'No eprescription previous-medical-history record found with the given eprescriptionPreviousMedicalHistoryId',res,500)   
      
        

      if(req.body.diseaseName)
        eprescriptionPreviousMedicalHistoryRec.diseaseName = req.body.diseaseName
      
      if(req.body.lastTestResults)
        eprescriptionPreviousMedicalHistoryRec.lastTestResults = req.body.lastTestResults     

      if(req.body.previousPreviousMedicalHistory)
        eprescriptionPreviousMedicalHistoryRec.previousPreviousMedicalHistory = req.body.previousPreviousMedicalHistory

     
        
      eprescriptionPreviousMedicalHistoryRec.save(function (err) {
          if (err) return common.handleError(err, 'eprescription doctor details record could not be updated',res,500)   
         
          return res.json({
            status: true,
            message: 'eprescription doctor details edit Success...',
            data: eprescriptionPreviousMedicalHistoryRec
          });
       
        });
        
      });

 
 });

 
 app.post('/api/eprescription-test-add', [
    
  check('eprescriptionId').not().isEmpty().trim().escape(), 
  check('testName').not().isEmpty().trim().escape(),   
  check('testCategory').not().isEmpty().trim().escape(),
  check('frequency').not().isEmpty().trim().escape(),
  check('result').not().isEmpty().trim().escape()
 
],function (req, res) {        
     dlog(" inside eprescription-test add api")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
     var inputCollection = req.body    
     var temp = new EprescriptionTest(inputCollection)
       
     EprescriptionOpen.findById(req.body.eprescriptionId, { lean: true }, function (err, eprescriptionOpen) {
      if (err || !eprescriptionOpen) return  common.handleError(err, 'No eprescription record found with the given  ID',res,500)   
    
     // insert data into database
     temp.save(function (error, eprescriptionTest) {
       // check error
       if (error) {
         return common.handleError(error,'DB Insert Fail...',res,500)           
       }
       // Everything OK
       return res.json({
         status: true,
         message: 'Eprescription test Insert Success...',
         data: eprescriptionTest
       });
     });
  });
 
 });

 app.post('/api/eprescription-test-edit', [
    check('eprescriptionTestId').not().isEmpty().trim().escape()
],function (req, res) {        
     dlog(" inside eprescription test edit api")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
   
  EprescriptionTest.findById(req.body.eprescriptionTestId, function (err, eprescriptionTestRec) {
    
      if (err || !eprescriptionTestRec) return  common.handleError(err, 'No eprescription test record found with the given eprescriptionTestId',res,500)   
      
      if(req.body.testName)
        eprescriptionTestRec.testName = req.body.testName
      
      if(req.body.testCategory)
        eprescriptionTestRec.testCategory = req.body.testCategory     

      if(req.body.frequency)
        eprescriptionTestRec.frequency = req.body.frequency

      if(req.body.result)
        eprescriptionTestRec.result = req.body.result
        if(req.body.testMethod)
        eprescriptionTestRec.testMethod = req.body.testMethod

     
        
      eprescriptionTestRec.save(function (err) {
          if (err) return common.handleError(err, 'eprescription Test record could not be updated',res,500)   
         
          return res.json({
            status: true,
            message: 'eprescription Test edit Success...',
            data: eprescriptionTestRec
          });
       
        });
        
      });

 });

 
 app.post('/api/eprescription-therapy-add', [
    
  check('eprescriptionId').not().isEmpty().trim().escape(), 
  check('therapyName').not().isEmpty().trim().escape(),   
  check('frequency').not().isEmpty().trim().escape(),
  check('subCategoryTherapy').not().isEmpty().trim().escape(),
  check('continuityFrequency').not().isEmpty().trim().escape(),
  check('specialCase').not().isEmpty().trim().escape()
 
],function (req, res) {        
     dlog(" inside eprescription-therapy add api")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
     var inputCollection = req.body    
     var temp = new EprescriptionTherapy(inputCollection)
       
     EprescriptionOpen.findById(req.body.eprescriptionId, { lean: true }, function (err, eprescriptionOpen) {
      if (err || !eprescriptionOpen) return  common.handleError(err, 'No eprescription record found with the given  ID',res,500)   
    
     // insert data into database
     temp.save(function (error, eprescriptionTherapy) {
       // check error
       if (error) {
         return common.handleError(error,'DB Insert Fail...',res,500)           
       }
       // Everything OK
       return res.json({
         status: true,
         message: 'Eprescription therapy Insert Success...',
         data: eprescriptionTherapy
       });
     });
  });
 
 });

 app.post('/api/eprescription-therapy-edit', [
    check('eprescriptionTherapyId').not().isEmpty().trim().escape()/*, 
    check('therapyName').not().isEmpty().trim().escape(),   
  check('frequency').not().isEmpty().trim().escape(),
  check('subCategoryTherapy').not().isEmpty().trim().escape(),
  check('continuity').not().isEmpty().trim().escape(),
  check('specialCase').not().isEmpty().trim().escape()
  */
],function (req, res) {        
     dlog(" inside eprescription therapy edit api")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
   
  EprescriptionTherapy.findById(req.body.eprescriptionTherapyId, function (err, eprescriptionTherapyRec) {
    
      if (err || !eprescriptionTherapyRec) return  common.handleError(err, 'No eprescription therapy record found with the given eprescriptionTherapyId',res,500)   
      
      if(req.body.therapyName)
        eprescriptionTherapyRec.therapyName = req.body.therapyName
      
      if(req.body.frequency)
        eprescriptionTherapyRec.frequency = req.body.frequency     

      if(req.body.subCategoryTherapy)
        eprescriptionTherapyRec.subCategoryTherapy = req.body.subCategoryTherapy

      if(req.body.continuityFrequency)
        eprescriptionTherapyRec.continuityFrequency = req.body.continuityFrequency

      if(req.body.specialCase)
        eprescriptionTherapyRec.specialCase = req.body.specialCase
      if(req.body.remarks)
        eprescriptionTherapyRec.remarks = req.body.remarks

        
      eprescriptionTherapyRec.save(function (err) {
          if (err) return common.handleError(err, 'eprescription Therapy record could not be updated',res,500)   
         
          return res.json({
            status: true,
            message: 'eprescription Therapy edit Success...',
            data: eprescriptionTherapyRec
          });
       
        });
        
      });

 });
 
   

app.post('/api/gen-pdf', [
  check('eprescriptionId').not().isEmpty().trim().escape() 
],function (req, res) {        

  
    dlog("req.body.eprescriptionId =="+req.body.eprescriptionId)
    getAllData(req.body.eprescriptionId,res)

 });



 app.post('/api/all-patients', [
  check('locationId').not().isEmpty().trim().escape() 
],function (req, res) {        

  dlog(" inside /all-patients API")
    dlog("locationId =="+req.body.locationId)
    MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
       
      var db = database.db()
      let filter = { locationId:req.body.locationId,active: true};
      db.collection('eprescription-opens').find(filter,{name:1,appointmentId:1,patientId:1,createDate:1}).sort({"createDate": -1}).toArray(function(err, eprescriptionArry) {
   /*     db.collection('eprescription-opens').aggregate([
          {
            $sort:{ createDate : -1 }
          },
          {
          $group: {_id: null
                    , uniqueValues: {$addToSet: "$patientId"}}
      }]    
      ,{name:1,appointmentId:1,patientId:1,createDate:1}).toArray(function(err, eprescriptionArry) {
        //db.collectionName.aggregate([{    $group: {_id: null, uniqueValues: {$addToSet: "$fieldName"}}  }])*/

        let patientIdArray = []        
        let finalEpresArray = []
        for(var i in eprescriptionArry){
          let eprescription = eprescriptionArry[i]
          
          if(patientIdArray.length == 0 && finalEpresArray.length == 0){
            patientIdArray.push(eprescription.patientId)
            finalEpresArray.push(eprescription)            
          }
          if(!patientIdArray.includes(eprescription.patientId) && patientIdArray.length >0 ){
            patientIdArray.push(eprescription.patientId)
            finalEpresArray.push(eprescription)            
          }
          
          

        }
        if (err ) return  common.handleError(err, 'Error, No ePrescription record found with the given locationId',res,500)   
        if (!eprescriptionArry || (eprescriptionArry && eprescriptionArry.length ==0) ){
          database.close();                  
          return  common.handleError(err, 'Error, No ePrescription record found with the given locationId',res,500)   
        }
        database.close();    
        return res.json({
          status: true,
          message: 'All patients array retrieval success...',
          //data: doctorIdList
          data : finalEpresArray
          });
      })
    })  

  });


  app.post('/api/patient-details', [
    check('patientId').not().isEmpty().trim().escape() 
  ],function (req, res) {        
  
    dlog(" inside /all-patients API")
      dlog("locationId =="+req.body.locationId)
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
         
        var db = database.db()
        let filter = { patientId:req.body.patientId,active: true};
        db.collection('eprescription-opens').find(filter).sort({"createDate": -1}).toArray(function(err, eprescriptionArry) {
          
          if (err ) return  common.handleError(err, 'Error, No ePrescription record found with the given locationId',res,500)   
          if (!eprescriptionArry || (eprescriptionArry && eprescriptionArry.length ==0) ){
            database.close();                  
            return  common.handleError(err, 'Error, No ePrescription record found with the given locationId',res,500)   
          }
          database.close();    
          return res.json({
            status: true,
            message: 'Patients details array retrieval success...',
            //data: doctorIdList
            data : eprescriptionArry
            });
        })
      })  
  
    });
  }
const getAllData = async (eprescriptionId,res) =>{
  

  try{

  
  let ePrescriptionObject = await getePrescriptionMain(eprescriptionId,res)          
  //    await getePrescriptionMain(eprescriptionId)  
  dlog(" ePrescriptionObject == "+JSON.stringify(ePrescriptionObject))
  
  let practiceLocation = await getePracticeLocation(ePrescriptionObject.locationId)       
  dlog(" practiceLocation == "+JSON.stringify(practiceLocation))

  let prescriptionStatus = await geteEprescriptionStatus(eprescriptionId)       
  dlog(" prescriptionStatus ******************== "+JSON.stringify(prescriptionStatus))

  dlog(" Status ENEDED******************== ")

  

  let ePrescriptionBasicOrSymtomList = await getePrescriptionBasic(eprescriptionId,ePrescriptionObject)

  dlog(" ePrescriptionBasicOrSymtomList == "+JSON.stringify(ePrescriptionBasicOrSymtomList))

  let patientInfo = await getePatientInfo(ePrescriptionObject)      
  dlog(" patientInfo == "+JSON.stringify(patientInfo))

  let ePrescriptionDoctorDetails = await getePrescriptionDoctorDetails(eprescriptionId)
  
  dlog(" ePrescriptionDoctorDetails == "+JSON.stringify(ePrescriptionDoctorDetails))

  let ePrescriptionMedicationList = await getePrescriptionMedication(eprescriptionId)
  dlog(" ePrescriptionMedicationList == "+JSON.stringify(ePrescriptionMedicationList))

  let ePrescriptionTestList = await getePrescriptionTest(eprescriptionId)
  dlog(" ePrescriptionTestList == "+JSON.stringify(ePrescriptionTestList))
  
  let ePrescriptionTherapyList = await getePrescriptionTherapy(eprescriptionId)
  dlog(" ePrescriptionTherapyList == "+JSON.stringify(ePrescriptionTherapyList))

  dlog(" inside gen-pdf")

  // Create a document
  const doc = new PDFDocument;
  
  /*doc.addPage({
    margins: {
      top: 30,
      bottom: 20,
      left: 10,
      right: 10
    }
  });*/

  let fileFirstPart
if(process.env.ENVIRONMENT =="LOCAL"){
  fileFirstPart="http://"+process.env.IPADDRESS+":"+process.env.PORT
 }else{
  fileFirstPart="http://"+process.env.IPADDRESS
 }


  let ePrescriptionFilepath = "ePrescription"+"_"+eprescriptionId + "." + "pdf"
  
 let pdfURL = fileFirstPart + "/public/pdf/" + ePrescriptionFilepath

 updateEprescriptionRecord(eprescriptionId,pdfURL)

  let SECTIONGAP = 40
  let fileName = ePrescriptionFilepath
  let pdfPath = process.env.PDF_FILEPATH
  doc.pipe(fs.createWriteStream(pdfPath+fileName));  

  let imagePath = process.env.IMAGE_PATH
  let logoFileName = 'logo_signet.png'
  

  
  doc.image(imagePath+logoFileName, {
    fit: [200, 150],
    align: 'left',
    valign: 'left'
 },10,30);
 
 let initialX = 260
 let initialY = 60
 let LINELENGTH = 580
 doc.font('Courier-Bold')
  .fontSize(LABELFONTSIZE)
  .moveTo(70, 100)
   .text('Clinic/Hospital ', initialX, initialY)
   .text(':', initialX+100, initialY);
 //  .moveDown(0.5); 
 
 doc.font('Courier')
    .fontSize(FONTSIZE)
    .moveTo(250, 200)
    .text(practiceLocation.name, initialX+120, initialY);
    
initialY = initialY+20
doc.font('Courier-Bold')
    .fontSize(LABELFONTSIZE)
    .moveTo(70, 100)
     .text('Address ', initialX, initialY)
     .text(':', initialX+100, initialY);
   
doc.font('Courier')
      .fontSize(FONTSIZE)
      .moveTo(250, 200)
      .text(practiceLocation.address, initialX+120, initialY);

initialY = initialY+20
doc.font('Courier-Bold')
    .fontSize(LABELFONTSIZE)
    .moveTo(70, 100)
     .text('Doctor Name ', initialX, initialY)
     .text(':', initialX+100, initialY);
     let doctor = {}
   if(ePrescriptionDoctorDetails && ePrescriptionDoctorDetails != undefined && ePrescriptionDoctorDetails.length >0)
     doctor  = ePrescriptionDoctorDetails[0]
      doc.font('Courier')
            .fontSize(FONTSIZE)
            .moveTo(250, 200)
            .text(doctor.doctorName, initialX+120, initialY);

      initialY = initialY+20
      doc.font('Courier-Bold')
            .fontSize(LABELFONTSIZE)
            .moveTo(70, 100)
            .text('Doctor ID ', initialX, initialY)
            .text(':', initialX+100, initialY);    

      doc.font('Courier')
              .fontSize(FONTSIZE)
              .moveTo(250, 200)
              .text(doctor.doctorId, initialX+120, initialY);
   
        /*
*BEGIN BEGIN*****************PATIENT***********PATIENT******************PATIENT**********************
*************************************************************************************************
*/
let LEFTMARGIN = 30
initialX = LEFTMARGIN
initialY = initialY+SECTIONGAP
doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Patient Information', initialX, 170)
 .fillColor("black")
 .underline(initialX, 160, 160, 27, {color: "#0000FF"})


 
 initialY = initialY+60
 doc.font('Courier-Bold') 
      .fontSize(LABELFONTSIZE)
      .moveTo(initialX, 100)
       .text('Patient ID ', initialX, initialY)
       .text(':', initialX+100, initialY);    

doc.font('Courier')
        .fontSize(FONTSIZE)
        .moveTo(250, 200)
        .text(ePrescriptionObject.patientId, initialX+120, initialY);

 var date = moment(new Date()).format("DD-MM-YYYY");
 var time = moment(new Date()).format( "hh:mm A");

 dlog("date == "+date)
dlog("time == "+time)

 initialY = initialY+20
doc.font('Courier-Bold')
  .fontSize(LABELFONTSIZE)
  .moveTo(70, 100)
   .text('Name ', initialX, initialY)
   .text(':', initialX+100, initialY);
 //  .moveDown(0.5); 
 
 let age
 if(patientInfo && patientInfo.dateOfBirth){
 age =  moment().diff(moment(patientInfo.dateOfBirth, "DD-MM-YYYY"), 'years');
 } 
doc.font('Courier')
.fontSize(FONTSIZE)
.moveTo(250, 200)
.text(patientInfo.name, initialX+120, initialY);

initialY = initialY+20
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(initialX, 100)
.text('Age ', initialX, initialY)
.text(':', initialX+100, initialY);

doc.font('Courier')
.fontSize(FONTSIZE)
.moveTo(250, 200)
.text(age, initialX+120, initialY);

initialY = initialY+20
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(initialX, 100)
.text('Sex ', initialX, initialY)
.text(':', initialX+100, initialY);

doc.font('Courier')
.fontSize(FONTSIZE)
.moveTo(250, 200)
.text(patientInfo.sex, initialX+120, initialY);

let originalInitialX = initialX
initialX = 320
let oldinitialY = initialY+20
initialY = initialY+20 - 80
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Weight ', initialX, initialY)
  .text(':', initialX+100, initialY);

doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(250, 200)
  .text(ePrescriptionObject.weight, initialX+120, initialY);
      
  initialY = initialY+20
  doc.font('Courier-Bold')
  .fontSize(LABELFONTSIZE)
  .moveTo(70, 100)
    .text('Height ', initialX, initialY)
    .text(':', initialX+100, initialY);
  
doc.font('Courier')
    .fontSize(FONTSIZE)
    .moveTo(250, 200)
    .text(ePrescriptionObject.height, initialX+120, initialY);
    
    initialY = initialY+20
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Blood Pressure ', initialX, initialY)
  .text(':', initialX+100, initialY);

doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(250, 200)
  .text(ePrescriptionObject.bloodPressure, initialX+120, initialY);

  initialY = initialY+20
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Date ', initialX, initialY)
  .text(':', initialX+100, initialY);

doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(250, 200)
  .text(date, initialX+120, initialY);
  initialY = initialY+20
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Time ', initialX, initialY)
  .text(':', initialX+100, initialY);

doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(250, 200)
  .text(time, initialX+120, initialY);    

/*
*BEGIN BEGIN*****************SYMPTOMS***********SYMPTOMS******************SYMPTOMS**********************
*************************************************************************************************
*/

initialX = originalInitialX
initialY = oldinitialY+SECTIONGAP
doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Symtoms', initialX, initialY)
//.underline(initialX, initialY, 500, 15, {color: "black"})
initialY = initialY+15

doc.lineWidth(0.5);
doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, initialY)
  .lineTo(LINELENGTH, initialY) 
  .stroke();
  initialY = initialY+10
 //initialY = initialY+20
 doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE)
 .moveTo(initialX, 100)
  .text('Symptoms ', initialX+50, initialY)  

let customSymptomRowSpecificInitialX = 250

doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Frequency ', customSymptomRowSpecificInitialX, initialY)  

  doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Any Specific ', customSymptomRowSpecificInitialX+200, initialY)  
initialY = initialY+15

doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, initialY)
  .lineTo(LINELENGTH, initialY) 
  .stroke();
  

for(var i in ePrescriptionBasicOrSymtomList){
    initialY = initialY+15
    let basicSymptop = ePrescriptionBasicOrSymtomList[i]
    doc.fillColor("black").
    font('Courier')
    .fontSize(FONTSIZE)
    .moveTo(70, 100)
    .text(basicSymptop.symptoms, initialX+50, initialY)  
  
 // let customSymptomRowSpecificInitialX = 380
  
  doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(70, 100)
    .text(basicSymptop.frequency, customSymptomRowSpecificInitialX, initialY)  

    doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(70, 100)
    .text(basicSymptop.frequency, customSymptomRowSpecificInitialX+200, initialY)  
}
/*
*BEGIN BEGIN*****************TEST****************TEST********************************************
*************************************************************************************************
*/
initialY = initialY+SECTIONGAP
doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Test', initialX, initialY)
//.underline(initialX, initialY, 500, 15, {color: "black"})
initialY = initialY+15

doc.lineWidth(0.5);
doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, initialY)
  .lineTo(LINELENGTH, initialY) 
  .stroke();
  initialY = initialY+10
 //initialY = initialY+20
 doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE)
 .moveTo(initialX, 100)
  .text('Test Name ', initialX+50, initialY)  

customSymptomRowSpecificInitialX = 250

doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Method ', customSymptomRowSpecificInitialX, initialY)  

  doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)
.moveTo(70, 100)
  .text('Result ', customSymptomRowSpecificInitialX+200, initialY)  
initialY = initialY+15

doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, initialY)
  .lineTo(LINELENGTH, initialY) 
  .stroke();
  


for(var i in ePrescriptionTestList){
    initialY = initialY+15
    let test = ePrescriptionTestList[i]
    doc.fillColor("black").
    font('Courier')
    .fontSize(FONTSIZE)
    .moveTo(70, 100)
    .text(test.testName, initialX+50, initialY)  
  
 // let customSymptomRowSpecificInitialX = 380
  
  doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(70, 100)
    .text(test.testMethod, customSymptomRowSpecificInitialX, initialY)  

    doc.font('Courier')
  .fontSize(FONTSIZE)
  .moveTo(70, 100)
    .text(test.result, customSymptomRowSpecificInitialX+200, initialY)  
}



/*
*BEGIN BEGIN*****************Medication****************Medication********************************************
*************************************************************************************************
*/
let gapBetweenColumn = 110
customSymptomRowSpecificInitialX = LEFTMARGIN+10
initialY = initialY+SECTIONGAP
doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Medication', initialX, initialY)
//.underline(initialX, initialY, 500, 15, {color: "black"})
initialY = initialY+15

doc.lineWidth(0.5);
doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, initialY)
  .lineTo(LINELENGTH, initialY) 
  .stroke();
  initialY = initialY+10
 //initialY = initialY+20
 doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE) 
  .text('Medication', customSymptomRowSpecificInitialX, initialY)  
  
  doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE) 
  .text('Name ', customSymptomRowSpecificInitialX, initialY+10)       

  customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)

  .text('Frequency ', customSymptomRowSpecificInitialX, initialY)  
  
  customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
  doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)

  .text('Duration', customSymptomRowSpecificInitialX, initialY)  

  customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
doc.font('Courier-Bold')
  .fontSize(LABELFONTSIZE)  
    .text('Before/After', customSymptomRowSpecificInitialX, initialY)  
    doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE) 
  .text('Food', customSymptomRowSpecificInitialX, initialY+10)       
    
customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
    doc.font('Courier-Bold')
    .fontSize(LABELFONTSIZE)    
      .text('Anything', customSymptomRowSpecificInitialX, initialY)  
      doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE) 
  .text('Special', customSymptomRowSpecificInitialX, initialY+10)       
  
initialY = initialY+20


doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, initialY)
  .lineTo(LINELENGTH, initialY) 
  .stroke();
  


for(var i in ePrescriptionMedicationList){    
    let medication = ePrescriptionMedicationList[i]
    gapBetweenColumn = 110
    customSymptomRowSpecificInitialX = LEFTMARGIN+10
    initialY = initialY+15
    
      
     //initialY = initialY+20
     doc.fillColor("black").
     font('Courier')
     .fontSize(LABELFONTSIZE) 
      .text(medication.medicationName, customSymptomRowSpecificInitialX, initialY)  
      
      customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
    doc.font('Courier')
    .fontSize(LABELFONTSIZE)
    
      .text(medication.dosesFrequency, customSymptomRowSpecificInitialX, initialY)  
      
      customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
      doc.font('Courier')
    .fontSize(LABELFONTSIZE)
    
      .text(medication.frequency, customSymptomRowSpecificInitialX, initialY)  
    
      customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
    doc.font('Courier')
      .fontSize(LABELFONTSIZE)  
        .text(medication.beforeAfterFood, customSymptomRowSpecificInitialX, initialY)  
        
    customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
        doc.font('Courier')
        .fontSize(LABELFONTSIZE)    
          .text(medication.anySpecial, customSymptomRowSpecificInitialX, initialY)  
      
}
doc.addPage()
/*
doc.addPage({
  margins: {
    top: 30,
    bottom: 20,
    left: 10,
    right: 10
  }
})
*/
/*
*BEGIN BEGIN*****************Therapy****************Therapy********************************************
*************************************************************************************************
*/
 gapBetweenColumn = 110
customSymptomRowSpecificInitialX = LEFTMARGIN+10
initialY = SECTIONGAP
doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Therapy', initialX, initialY)
//.underline(initialX, initialY, 500, 15, {color: "black"})
initialY = initialY+15

doc.lineWidth(0.5);
doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, initialY)
  .lineTo(LINELENGTH, initialY) 
  .stroke();
  initialY = initialY+10
 //initialY = initialY+20
 doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE) 
  .text('Therapy', customSymptomRowSpecificInitialX, initialY)  
  
  doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE) 
  .text('Name ', customSymptomRowSpecificInitialX, initialY+10)       

  customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)

  .text('Frequency ', customSymptomRowSpecificInitialX, initialY)  
  
  customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
  doc.font('Courier-Bold')
.fontSize(LABELFONTSIZE)

  .text('Sub category', customSymptomRowSpecificInitialX, initialY)  

  customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
doc.font('Courier-Bold')
  .fontSize(LABELFONTSIZE)  
    .text('Continuity', customSymptomRowSpecificInitialX, initialY)  
    doc.fillColor("black").
 font('Courier-Bold')
 .fontSize(LABELFONTSIZE) 
  .text('frequency', customSymptomRowSpecificInitialX, initialY+10)       
    
customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
    doc.font('Courier-Bold')
    .fontSize(LABELFONTSIZE)    
      .text('Remarks', customSymptomRowSpecificInitialX, initialY)  
      doc.fillColor("black").
  
initialY = initialY+40


doc.fillColor("black")
  .fontSize(FONTSIZE)
  .moveTo(initialX, SECTIONGAP+45)
  .lineTo(LINELENGTH, SECTIONGAP+45) 
  .stroke();
  
  initialY = initialY+15

for(var i in ePrescriptionTherapyList){    
    let therapy = ePrescriptionTherapyList[i]
    gapBetweenColumn = 110
    customSymptomRowSpecificInitialX = LEFTMARGIN+10
    initialY = initialY+15
    
      
     //initialY = initialY+20
     doc.fillColor("black").
     font('Courier')
     .fontSize(LABELFONTSIZE) 
      .text(therapy.therapyName, customSymptomRowSpecificInitialX, initialY)  
      
      customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
    doc.font('Courier')
    .fontSize(LABELFONTSIZE)
    
      .text(therapy.frequency, customSymptomRowSpecificInitialX, initialY)  
      
      customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
      doc.font('Courier')
    .fontSize(LABELFONTSIZE)
    
      .text(therapy.subCategoryTherapy, customSymptomRowSpecificInitialX, initialY)  
    
      customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn 
    doc.font('Courier')
      .fontSize(LABELFONTSIZE)  
        .text(therapy.continuityFrequency, customSymptomRowSpecificInitialX, initialY)  
        
    customSymptomRowSpecificInitialX = customSymptomRowSpecificInitialX +gapBetweenColumn
        doc.font('Courier')
        .fontSize(LABELFONTSIZE)    
          .text(therapy.remarks, customSymptomRowSpecificInitialX, initialY)  
      
}

initialY = initialY+90
initialX = LEFTMARGIN



doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Signature', initialX, initialY)
 
 initialY = initialY+20 
doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Date and time', initialX, initialY)
 .text(':', initialX+200, initialY);    
 doc.font('Courier')
 .fontSize(FONTSIZE)
 .moveTo(250, 200)
 .text(date+", "+time, initialX+210, initialY);

 initialY = initialY+20 
 doc.font('Courier-Bold')
 .fillColor("blue")
 .fontSize(HEADERFONTSIZE)
 .text('Status of the Prescription', initialX, initialY)
 .text(':', initialX+200, initialY);    
 doc.font('Courier')
 .fontSize(FONTSIZE)
 .moveTo(250, 200)
 .text(prescriptionStatus.status, initialX+210, initialY);

/*
 initialY = initialY+20 
 doc.font('Courier-Bold') 
      .fontSize(LABELFONTSIZE)
      .moveTo(initialX, 100)
       .text('Date and time', initialX, initialY)
       .text(':', initialX+100, initialY);    
*/
doc.flushPages();
doc.save()

doc.end();

 

return res.json({
        status: true,
        message: 'eprescription  gen-pdf Success...',
       data:{
        pdfURL : pdfURL
       }
  });     
      
}catch(erro){
    
    return res.json({
      status: false,
      message: 'PDF generation fails',
    data:erro
    });  

}

}

const getePrescriptionMain = async (eprescriptionId,res) =>{
 return  new Promise((resolve) => {     
    EprescriptionOpen.findById(eprescriptionId, function (err, eprescriptionOpenRec) {
      
    if (err || !eprescriptionOpenRec) {
      return  common.handleError(err, 'No eprescription  record found with the given eprescriptionId',res,500)   
      //resolve("err in fetching EprescriptionOpen ")
    }    
   // dlog(" ePrescriptionObject from getePrescriptionMain &&&& == "+JSON.stringify(eprescriptionOpenRec))
    resolve(eprescriptionOpenRec)      
    });
  });
}

const getePrescriptionBasic = async (eprescriptionId,ePrescriptionObject) =>{
   return  new Promise((resolve) => {     

      dlog(" ePrescriptionObject from getePrescriptionBasic ^^^^^ == "+JSON.stringify(ePrescriptionObject))
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
      
      var db = database.db()
      let filter = { eprescriptionId:eprescriptionId,active: true};
      db.collection('eprescription-basic-details').find(filter).toArray(function(err, eprescriptionBasicDetailsArry) {
        
          if (err ) {       
          database.close();   
          //resolve("err in fetching getePrescriptionBasic ")                  
          eprescriptionBasicDetailsArry = []  
          resolve(eprescriptionBasicDetailsArry) 
          }
          if (!eprescriptionBasicDetailsArry || (eprescriptionBasicDetailsArry && eprescriptionBasicDetailsArry.length ==0)){
            database.close();              
            eprescriptionBasicDetailsArry = []  
            resolve(eprescriptionBasicDetailsArry)               
          }

          database.close();              
       // dlog(" eprescriptionBasicDetailsArry == "+JSON.stringify(eprescriptionBasicDetailsArry))
          resolve(eprescriptionBasicDetailsArry)      
     })
    })        
    
  });
  }
  const getePatientInfo = async (ePrescriptionObject) =>{
    return  new Promise((resolve) => {   
      
    //  dlog(" ePrescriptionObject from inside getePatientInfo == "+JSON.stringify(ePrescriptionObject))

       let patientId = ePrescriptionObject.patientId      
       let jsonBody = {
        "patientId":patientId
       }

       dlog(" patientId ^^^^^ == " + patientId)
       request({
        url: patientFetchApiEndPoint,
        method: 'POST',      
        headers: {
          'content-Type' :"application/json",    
          'accept':"application/json"
        },
        body: JSON.stringify(jsonBody)}
      , function(error, response, body) {
        if (error) { 

          dlog("error == "+JSON.stringify(error))
          //return  common.handleError(error, 'Failed to retrieve doctors from remote doctorSignet DB, please make sure the API is accessible',res,500) 
          resolve("no patientinfo found with id"+patientId)

        }                        
        else {       
          let json = {}
          try{               
            let json = JSON.parse(body);
           // dlog("patientInfo == "+JSON.stringify(json.data))
            if(json && json.data){              
              resolve(json.data)              
            }
          }catch(error){
            dlog(error)
          //  resolve(json)              

          }
          resolve(json)        
        }
      });
     
   });
   }
  
  const getePrescriptionDoctorDetails = async (eprescriptionId) =>{
   return new Promise(resolve => {     
        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()
        let filter = { eprescriptionId:eprescriptionId,active: true};
        db.collection('eprescription-doctor-details').find(filter).toArray(function(err, eprescriptionDoctorDetailsArry) {
          
            if (err ) {       
            database.close();   
            eprescriptionDoctorDetailsArry = []  
            resolve(eprescriptionDoctorDetailsArry) 
            }
            if (!eprescriptionDoctorDetailsArry || (eprescriptionDoctorDetailsArry && eprescriptionDoctorDetailsArry.length ==0)){
              database.close();              
              eprescriptionDoctorDetailsArry = []  
              resolve(eprescriptionDoctorDetailsArry) 
            }
  
            database.close();              
            resolve(eprescriptionDoctorDetailsArry)      
        })
      })        
      
    });
}


const getePrescriptionMedication = async (eprescriptionId) =>{
  return new Promise(resolve => {     
       MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
       
       var db = database.db()
       let filter = { eprescriptionId:eprescriptionId,active: true};
       db.collection('eprescription-medications').find(filter).toArray(function(err, eprescriptionMedicationDetailsArry) {
         
           if (err ) {       
           database.close();   
           eprescriptionMedicationDetailsArry = []  
           resolve(eprescriptionMedicationDetailsArry) 
           }
           if (!eprescriptionMedicationDetailsArry || (eprescriptionMedicationDetailsArry && eprescriptionMedicationDetailsArry.length ==0)){
             database.close();              
             eprescriptionMedicationDetailsArry = []  
           resolve(eprescriptionMedicationDetailsArry) 
           }
 
           database.close();              
           resolve(eprescriptionMedicationDetailsArry)      
       })
     })        
     
   });
}


const getePrescriptionTest = async (eprescriptionId) =>{
  return new Promise(resolve => {     
       MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
       
       var db = database.db()
       let filter = { eprescriptionId:eprescriptionId,active: true};
       db.collection('eprescription-tests').find(filter).toArray(function(err, eprescriptionTestDetailsArry) {
         
        
           if (err ) {       
           database.close();   
           eprescriptionTestDetailsArry = []
           resolve(eprescriptionTestDetailsArry)                  
           }
           if (!eprescriptionTestDetailsArry || (eprescriptionTestDetailsArry && eprescriptionTestDetailsArry.length ==0)){
             database.close();              
             eprescriptionTestDetailsArry = []
             resolve(eprescriptionTestDetailsArry)                  
           }
 
           database.close();              
           resolve(eprescriptionTestDetailsArry)      
       })
     })        
     
   });
}
const getePrescriptionTherapy = async (eprescriptionId) =>{
  return new Promise(resolve => {     
       MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
       
       var db = database.db()
       let filter = { eprescriptionId:eprescriptionId,active: true};
       db.collection('eprescription-therapies').find(filter).toArray(function(err, eprescriptionTherapyDetailsArry) {
         
           if (err ) {       
           database.close();   
           eprescriptionTherapyDetailsArry = []  
           resolve(eprescriptionTherapyDetailsArry)                  
           }
           if (!eprescriptionTherapyDetailsArry || (eprescriptionTherapyDetailsArry && eprescriptionTherapyDetailsArry.length ==0)){
             database.close();   
             eprescriptionTherapyDetailsArry = []           
             resolve(eprescriptionTherapyDetailsArry)                  
           }
 
           database.close();              
           resolve(eprescriptionTherapyDetailsArry)      
       })
     })        
     
   });
   
}
const getePracticeLocation = async (practiceLocationId) =>{
  return new Promise((resolve) => {     

    PracticeLocation.findById(practiceLocationId, function (err, practiceLocation) {
      if (err || !practiceLocation) {
        resolve("err in fetching practiceLocation ")
      }    
      //dlog(" ePrescriptionObject from getePrescriptionMain &&&& == "+JSON.stringify(eprescriptionOpenRec))
      resolve(practiceLocation)      
      });      
  });

}

const geteEprescriptionStatus = async (eprescriptionId) =>{
  return new Promise((resolve) => {     

    let filter = { eprescriptionId:eprescriptionId,active: true};
    EprescriptionStatus.findOne(filter, function (err, prescriptionStatus) {
      if (err || !prescriptionStatus) {
        resolve("err in fetching EprescriptionStatus ")
      }    
      //dlog(" ePrescriptionObject from getePrescriptionMain &&&& == "+JSON.stringify(eprescriptionOpenRec))
      resolve(prescriptionStatus)      
      });      
  });

}