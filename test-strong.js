const { soap } = require('strong-soap');


async function run() {
  try {
    const wsdlUrl = 'https://staging.philhealth.gov.ph/KONSULTA/SOAP?wsdl';
    
    soap.createClient(wsdlUrl, {}, (err, client) => {
      if (err) throw err;
      client.setEndpoint('https://staging.philhealth.gov.ph/KONSULTA/SOAP');
      
      client.getToken({
        pUsername: 'myuser',
        pUserPassword: 'mypassword',
        pSoftwareCertificationId: 'KON-DUMMYCERTS-Z15445',
        pHospitalCode: 'P10038831'
      }, (err, result) => {
        if (err) console.error("Error:", err);
        else console.log("Result:", result);
      });
    });
  } catch(e) {
    console.error(e);
  }
}
run();
