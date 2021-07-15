
const {check, validationResult} = require('express-validator');
const Previousprescriptionupload = require('../../models/previous-prescription/previous-prescription-upload');
const PreviousprescriptionStatus = require('../../models/previous-prescription/previous-prescription-status');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');

  const main =  async (demographicFileName,inputCollection,whichfiles) => {
      try {
          if(demographicFileName && (whichfiles=="both" || whichfiles == "demographic")){
            dlog("demographicFileName :="+demographicFileName)

            fs.writeFile(demographicFileName, inputCollection.uploadPhotoPreviousPrescription,'base64', function(err) {
              if (err) 
                return common.handleError(err,'demographicFile could not be created ...',res,200)
                dlog("demographicFile created successfully with Node.js v10 fs/promises!");
        
             });
          }
      
    } catch (error){

       // console.error(error);
       return common.handleError(err,'FIle saving error...',res,500)       
    }
  }



const doFileProcessing =  (inputCollection,whichfiles)=>{
  if(process.env.ENVIRONMENT =="LOCAL"){
    inputCollection.fileFirstPart="http://"+process.env.IPADDRESS+":"+process.env.PORT
   }else{
    inputCollection.fileFirstPart="http://"+process.env.IPADDRESS
   }

   var staticImageDir = process.env.IMAGE_PATH

   const photoRandomString = Str.random(8)  
   dlog("photoRandomString ="+photoRandomString)


   let demographicFileNameSuf = "Previous_Prescription_"+photoRandomString
   let demographicFileName = staticImageDir + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT

   inputCollection.uploadPhotoPreviousPrescriptionURL = inputCollection.fileFirstPart + "/public/images/" + demographicFileNameSuf+ "." + process.env.IMAGEFILEEXT


   if(inputCollection.uploadPhotoPreviousPrescription){
     inputCollection.uploadPhotoPreviousPrescription = inputCollection.uploadPhotoPreviousPrescription.replace(/^data:image\/(jpeg|png|gif|jpeg|JPG|jpg);base64,/, "");
   }   


   createFiles(staticImageDir,demographicFileName,inputCollection,whichfiles)
   return inputCollection
}


const createFiles =  (staticImageDir,demographicFileName,inputCollection,whichfiles) => {




  fs.stat(staticImageDir, function(err) {
    if (!err) {
        dlog('Directory exists, where the images will go');
         main(demographicFileName,inputCollection,whichfiles)
        
    }
    else if (err.code === 'ENOENT') {
        dlog('Directory does not exist where the images should be saved');
        return common.handleError(err,'DB Insert Fail...',res,500)          
    }
  });
}


module.exports = function (app) {


/*
    *****************************************
    1. Patient Upload-Previous-Prescription
    *****************************************
*/

  app.post('/api/upload-previous-prescription', [ 
   check('patientId').not().isEmpty().trim(),

   check('uploadPhotoPreviousPrescription').not().isEmpty().trim()

],function (req, res) {        
      dlog(" inside upload-Previous-Prescription api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }

//dlog("body ="+JSON.stringify(req.body))

      //dlog("PatientId ="+req.body.patientId)

      var inputCollection = req.body

      inputCollection =  doFileProcessing(inputCollection,"both")
      var temp = new Previousprescriptionupload(inputCollection)
        
      // insert data into database
      temp.save(function (error, previousprescriptionupload) {
        // check error
        if (error) {
          return common.handleError(error,'DB Insert Fail...',res,500)           
        }

        if(previousprescriptionupload){
          previousprescriptionupload.uploadPhotoPreviousPrescription = ''
          previousprescriptionupload.uploadPhotoPreviousPrescriptionURL = inputCollection.uploadPhotoPreviousPrescriptionURL
        }



    //insert previous-prescription-statuses inserted id
      var insertedId = new PreviousprescriptionStatus({previousprescriptionId:previousprescriptionupload._id,status:'false'})
      // insert data into database
      insertedId.save(function (error, previousprescriptionOpenRec) {
        // check error
        if (error) {
          return common.handleError(error,'DB Insert Fail...',res,500)           
        }

//previousprescriptionupload.statusId = previousprescriptionOpenRec._id
        // Everything OK
        return res.json({
          status: true,
          message: 'Previous prescription Upload Success...',
          data1: previousprescriptionupload,
          data2: previousprescriptionOpenRec

        });

        // Everything OK
        // return res.json({
        //   status: true,
        //   message: 'Previous prescription status Insert Success...',
        //   data: previousprescriptionOpenRec
        // });
      });
        
      });
  
  });



/*
    *****************************************
    1. Patient Previous-Prescription-status-edit
    *****************************************
*/



   app.post('/api/previous-prescription-status-edit', [
    check('previousprescriptionstatusId').not().isEmpty().trim().escape(),
    check('status').not().isEmpty().trim().escape()
   
 ],function (req, res) {        
       dlog(" inside previous-prescription-status-edit api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       //dlog("name ="+req.body.previousprescriptionStatusId)
       var inputCollection = req.body    
      
    PreviousprescriptionStatus.findById(req.body.previousprescriptionstatusId, function (err, previousprescriptionStatusRec) {


     //dlog(previousprescriptionStatusRec.status)
         if (err || !previousprescriptionStatusRec) return  common.handleError(err, 'No Previous prescription status record found with the given previousprescriptionStatusId',res,500)   
        
        if(req.body.status)
        previousprescriptionStatusRec.status = req.body.status
          
       
        previousprescriptionStatusRec.save(function (err) {
            if (err) return common.handleError(err, 'Previous prescription status record could not be updated',res,500)   
           
            return res.json({
              status: true,
              message: 'previousprescription status edit Success...',
              data: previousprescriptionStatusRec
            });
         
          });
          
        });
  
   
   });

}
