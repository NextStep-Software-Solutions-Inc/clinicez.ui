
 
 
 
 
 
PhilHealth’s  
Konsultasyong 
Sulit at Tama 
(Konsulta) 
Implementation 
Guide 
 
 
 
 
 
 
 
 
 
 
 
PKA v1.1  
20220815 
 
  
 
 
 
 
  

[No text extracted from this page]
 

## Amendment History
Version Date Remarks 
Version 1.0 02/16/2021 Parameters for Phase 1: Konsulta Implementation 
Version 1.1  08/15/2022  Updated valid values for the parameter pDeliveryTyp under PREGHIST 
 Added parameter ‘pOthMedDrugGrouping’ under MEDICINE 
 Enhanced validation of parameters under MEDICINE and DIAGNOSTIC 
EXAM RESULTS from number to varchar 
 Enhanced validation of ZScore as not required 
 

## TABLE OF CONTENTS

# 1.  INTRODUCTION ....................................................................................................................... 1

# 2. PREPARATIONS ........................................................................................................................ 2

# 3. PhilHealth Konsulta Application Programming Interface (API)  ................................................. 3

## Module 1: Authentication of Application  ................................ ................................ .............................  5

## Module 2: Konsulta Registration Validation  ................................ ................................ .........................  6

## Module 3: Konsulta Reporting ................................ ................................ ................................ ............ 10

# 4. ANNEXES  .............................................................................................................................. 14
Annex A: Konsulta Data Dictionary  ................................ ................................ ................................ .... 15 
Annex B: Sample Konsulta XML Report (First Tranche) ................................ ................................ ........ 40 
Annex C: Sample Konsulta XML Report (Second Tranche) ................................ ................................ .... 43 
Annex D: Guidelines for the Encryption and Decryption of XML  ................................ ..........................  49 
Annex E: Non-Disclosure Agreement ................................ ................................ ................................ .. 51 
Annex F: Software Testing and Validation ................................ ................................ ...........................  52 
 
 
  
 
 
        
 

# 1.  INTRODUCTION
 
Philippine Health Insurance Corporation (PhilHealth), Republic of the Philippines (2012) 
 
Copyright to this material belongs to PhilHealth. Apart from any fair dealing for personal, academic, 
research or non-commercial use, no part may be reproduced without written permission of PhilHealth. 
PhilHealth is under no obligation to grant this permission. Please acknowledge the Philippine Health 
Insurance Corporation when reproducing or quoting material from this source 
 
Important Disclaimer: 
All information and content in this Material is provided in good faith by PhilHealth, and is based on 
sources believed to be reliable and accurate at the time of development. The Philippine Health 
Insurance Corporation, and their respective officers, employees and agents, do not accept legal liability 
or responsibility for the Material, or any consequences arising from its use. 
 
 
The primary care benefit package or most commonly referred to as the PCB1 was implemented last 2012 
replacing the outpatient benefit package at the time as denoted in PhilHealth Circular No. 10 s -2012 
“Implementing Guidelines for Universal Health Care Primary Care Benefit I (PCB1) Package for Transition 
Period CY 2012-2013. The said circular initially covers members under the Sponsored Program, Organized 
Group and Overseas Workers Program to avail of the services through the Rural Health Units.  
 
In October 2018, the PCB1 benefit package was expanded to members under the formal economy (private 
and government employees), senior citizens and lifetime members  thru the PhilHealth Circular No. 17 s -
2018.  And with the Corporation remaining true to its mandate of providing health insurance coverage and 
ensure affordable, acceptable, available and accessible healthcare services for all citizens of the Philippines, 
the PhilHealth Konsulta Benefit Package integrates the existing Primary Care Benefit I (PCB1)  and 
expanded Primary Care Benefit 1 (ePCB) that shall be made available for all Filipinos.  
 
To ensure ease of availment at the point of care for all its beneficiaries, PhilHealth has partnered with 
existing electronic medical record (EMR) providers to automate th e submission of reporting requirements 
necessary for the processing of provider payments. Said venture has been established through the issuance 
of PhilHealth Advisory 2016 -0040 introducing the implementation of Electronic Medical Records for the 
Primary Care Benefit by January 1, 2017.  
 
Being that more data will be required from the Konsulta providers for the Konsulta implementation , 
PhilHealth will be opening direct transmission of Konsulta data which will integrate or be similar with the 
eClaims architecture. Among the list of services which will be offered to Konsulta providers and service 
providers are as follows: 
 
 Phase I: Authentication of Application 
o Get Token Method (GTM) 
 
 Phase II: Konsulta Registration Validation 
o Member/Dependent Registration Check (MDRC) 
o Extract Registration List (ERL) 
o Authorization Transaction Code Validation (ATCV) 
 
 Phase III: Konsulta Reporting 
o Validate Konsulta Report (VER) 
o Submit Konsulta Report (SER) 
 
 
        
 
 
Republic Act 8792 or the e -Commerce Act was signed into law on June 14, 2000, and mandated all 
government agencies to, among others, transact government business and perform government functions 
using electronic data messages or electronic documents. It th erefore provides for the legal recognition of 
electronic documents, data messages, electronic signatures and electronic contracts. RA 8792 provides the 
legal framework and environment for the PhilHealth Konsulta environment.  
 
The Konsulta Benefit Package shall be included in the PhilHealth Konsulta environment to provide an 
efficient and effective reporting and processing of availment for the primary care benefit. 
 
The Konsulta system shall introduce the following features, to wit: 1) a paper -free transaction through a 
fully electronic and /or online submission of Konsulta report by accredited health providers ; 2) online 
evaluation and processing of Konsulta in PhilHealth Regional and Service offices; and 3) online tracking or 
status verification of Konsulta availments. 
 
This document applies to accredited Konsulta health care providers and Service Provider (SP), which will 
serve as conduits between PhilHealth and the HCPs and HCIs with in-house software solutions, which 
will provide utilities to enable access to the PhilHealth Konsulta API or PKA. 
  
 
 
        
 

# 2. PREPARATIONS
 
 
PROCEDURES ON HOW TO CONNECT TO PHILHEALTH KONSULTA API (PKA) 
 
Step 1.  Check for internet connectivity requirements 
 
a. A good internet connection between the system of the HCP and PKA of PhilHealth is needed. HCP 
should have at least a bandwidth of 1mbps.  HCP should have an internet connection dedicated to 
PKA.   
 
Step 2.  Submit the public IP address 
a. HCP should have a public IP  
 
 A good internet connection between the system of the HCP and PKA of PhilHealth is needed. HCP 
should have at least a bandwidth of 1mbps.  HCP should have an internet connection dedicated to 
PKA.  HCP should have a public ID. 
  
 
 
 
 
 
 
 
 
 
 
 
 
 
        
 

# 3. PhilHealth Konsulta
Application Programming 
Interface (API) 
  
 
 
        
 
 
This section shows the PhilHealth Konsulta Application Programming Interface (API). The input and 
output parameters of the different methods of the web service are defined here.  The different available 
methods are loosely grouped based the following “modules” 
 

# 1. Module 1: Authentication of Application

# 2. Module 2: Konsulta Registration Validation

# 3. Module 3: Konsulta Reporting
 
ABOUT THE  SOFTWARE CERTIFICATI ON ID  
 
Starting with version 1.0 of PKA, all applications that will access the said services shall be required to be 
certified by PhilHealth.  Each certification is targeted for a specific version of PKA.  To check whether an 
application calling a service method of PKA is certified, the calling application should indicate the Software 
Certification ID issued by PhilHealth after an application has been certified.  
 
USE OF ACCESS TOKEN  
 
Access tokens are used in token-based authentication to allow an application to access PKA. The application 
receives an access token after a user successfully authenticates and authorizes access, then passes the access 
token as a credential when it calls the target service method.  Each method call will require token included 
in the header request. In the header request, use “Token” for the key and the generated access token for the 
value.  
 
ENCRYPTION AND DECRY PTION OF THE XML PAY LOAD DATA  
 
For added security measures, starting with version 1.0 of PKA, HCI applications should encrypt all input 
parameters that are to be encoded as XML text. HCI applications should also decrypt all output 
parameters that are returned in XML format. 
 
Please refer to the “Guidelines for the Encryption and Decryption of XML” included in the development 
kit. 
 
   
 
 
 
 
 
 
 
 
 
 
  
 
 
        
 
MODULE  1: AUTHENTICATION  OF APPLICATION  
 
The Authentication Module shall contain Get Token Method (GTM) as shown below: 
 
Module Module Details 
 

## Module 1-A:  Get
Token Method 
(GTM) 
 
The getToken method will allow generation of Access Token that will be used 
for consuming the service methods available in PKA.  
 
This token must be included on every method request. Use “Token” for the key 
and the generated access token for the value. 
 
WEB SERVICE METHOD 
 
getToken (pUsername, pUserPassword, pSoftwareCertificationId, 
pHospitalCode) 
 
 
PARAMETER DEFINITION 
 
Name Length 
(Size) Description Remarks 
pUserName* String(30) User Name To be provided 
by PhilHealth  
pUserPassword* String(30) User Password To be provided 
by PhilHealth 
pSoftwareCertificationId* String(30) Software 
Certification ID 
To be provided 
by PhilHealth 
pHospitalCode* String(9) Facility 
Accreditation 
Number 
 
 
 
RESPONSE DEFINITION 
 
Transaction Type Response 
Successful  Returns the Access Token to be used for consuming the 
service methods.   
Unsuccessful  The following shall be displayed based on scenario: 
 
Scenario Resulting Response / Message 
Incorrect User 
Name or User 
Password 
Invalid credentials  
Incorrect Software 
Certification ID 
Software Certification ID not 
found 
Invalid PAN No Accreditation Record Found 
Not registered user 
of the software 
HCI is not a registered user of the 
certified software 
 
 
 
 
 
        
 
MODULE  2: REGISTRATION VALIDAT ION  
 
The Registration Validation Module shall contain several web service methods as shown below: 
 

## Module 2-A:  Member/Dependent Registration Check (MDRC)

## Module 2-B: Extract Registration List (ERL)

## Module 2-C:  Authorization Transaction Code Validation (ATCV)
 
Module Module Details 
 

## Module 2-A:
Member/ 
Dependent 
Registration Check 
(MDRC) 
 
This method will check whether the member/dependent has already registered 
to the accredited health care provider for the current year. 
 
WEB SERVICE METHOD 
 
isMemberDependentRegistered (pPin, pType) 
 
 
PARAMETER DEFINITION 
 
Name Length 
(Size) Description Remarks 
pPIN* String(12) PhilHealth 
Identification Number 
– a unique 12 digit 
number assigned to a 
member or 
dependent. 
The last character in 
the PIN is a modulus 
11 check digit. 
pType* String(2)  ‘MM’-Member 
 ‘DD’-Dependent 
 
 
 
RESPONSE DEFINITION 
 
Transaction 
Type Response 
Successful  Displays the message “YES” for PIN with current 
registration for the year. 
Unsuccessful  Returns “NO’ if member/dependent PIN is invalid or 
not yet registered. 
 
 

## Module 2-B: Extract
Registration List 
(ERL) 
 
 
The ERL service may be used to determine whether a member  or dependent 
has been registered to the concerned health care provider through the resulting 
XML file.  
 
To get list of all beneficiaries that are already registered to a given provider for 
a specified period, use the pStartDate and pEndDate parameter. 
 
 
        
 
 
WEB SERVICE METHOD 
 
extractRegistrationList (pStartDate, pEndDate) 
PARAMETER DEFINITION 
 
Name Length 
(Size) Description Remarks 
pStartDate* Date Starting coverage 
date to be used for 
the extraction.  
Date Format should be :  
‘mm/dd/yyyy’ 
pEndDate* Date Ending coverage 
date to be used for 
the extraction. 
Date Format should be :  
‘mm/dd/yyyy’ 
 
 
RESPONSE DEFINITION 
 
Transaction 
Type Response 
Successful  Return details of the member and dependent in encrypted 
XML format. 
Unsuccessful  The following shall be displayed based on scenario: 
 
Scenario Resulting Response / Message 
No available 
record within 
the selected 
date range 
No record found 
Invalid PAN No Accreditation Record Found 
 
 
 

## Module 2-C:
Authorization 
Transaction Code 
Validation (ATCV) 
 
 
This service will allow validation of the Authorization Transaction Code 
(ATC) provided by the member/dependent and ensure that ATC is valid 
within the date of appointment. 
 
WEB SERVICE METHOD 
 
isATCValid (pPIN, pATC, pEffectivityDate) 
 
 
PARAMETER DEFINITION 
 
Name Length 
(Size) Description Remarks 
pPIN* String(12) PhilHealth 
Identification 
Number – a 
unique 12 digit 
The last 
character in the 
PIN is a modulus 
11 check digit. 
 
 
        
 
number assigned 
to a member  or 
dependent. 
pATC* String(12) Authorization 
Transaction Code 
– a unique code 
given to a member 
that is 
incorporated 
within the selected 
date of 
appointment 
To be provided 
by the member  
pEffectivityDate* String(10) Effectivity Date of 
ATC 
Date Format 
should be :  
‘mm/dd/yyyy’ 
 
 
 
RESPONSE DEFINITION 
 
Transaction 
Type Response 
Successful  Displays the message “YES” for Authorization 
Transaction Code (ATC) that is match with the PIN and 
Date of Effectivity.  
Unsuccessful  Returns “NO” for invalid ATC. 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
        
 
MODULE  3: KONSULTA  REPORTING  
 
Module 3 of the PKA shall include the services to be used for the reporting requirements of the program. 
The following services shall be made available: 
 

## Module 3-A: Validate Konsulta Report (VKR)

## Module 3-B: Submit Konsulta Report (SKR)
 
Module Module Details 

## Module 3-A:
Validate Konsulta 
Report (VKR) 
 
This service will allow validation of the Konsulta Report without uploading the 
XML.  
 
 
WEB SERVICE METHOD 
 
validateReport (pReport, pReportTagging) 
 
 
PARAMETER DEFINITION 
 
Name Length 
(Size) Description Remarks 
pReport* String(2MB) Data requirements 
based on the 
defined Konsulta 
XML Report 
See Annex A 
pReportTagging* String(1) Tagging to identify 
XML report if : 
 1-first patient 
encounter data 
 2- first patient 
encounter data, 
consultations, 
diagnostic exam 
results and 
drug/medicines 
 
 
  
RESPONSE DEFINITION 
 
Transaction 
Type Response 
Successful  Returns successful message. This will also return the 
validated Konsulta XML with an updated value in 
pReportStatus attributes as "V" (Validated) to indicate 
that the records have passed the validation based on the 
predefined requirements. 
Unsuccessful  Returns the error message. This will also return the 
validated Konsulta XML with an updated value in the 
pReportStatus attributes as "F" (Failed), and in the 
pDeficiencyRemarks attributes for the error description. 
 
 
 
        
 
 

## Module 3-B:
Submit Konsulta 
Report (SKR) 
 
 
This service will be used to submit or transmit the reporting requirements for 
the Konsulta based on a predefined XML format.  
 
 
WEB SERVICE METHOD 
 
submitReport (pTransmittalId, pReport, pReportTagging) 
 
 
PARAMETER DEFINITION 
 
Name Length 
(Size) Description Remarks 
pTransmittalID* String(21) EMR generated 
transmittal 
reference number 
of the  report 
submitted 
R + accreditation 
no ( 9) + date of 
extraction 
(yyyymm) + 
sequence no (5) 
pReport* String(2MB) Data requirements 
based on the 
defined Konsulta 
XML Report 
See Annex A 
pReportTagging* String(1) Tagging to identify 
XML report if : 
 1-first patient 
encounter data 
 2- first patient 
encounter data, 
consultations, 
diagnostic exam 
results, and 
drug/medicines 
 
 
 
RESPONSE DEFINITION 
 
Transaction 
Type Response 
Successful  Returns the transaction number for the submitted report. 
Unsuccessful  The following shall be displayed based on scenario: 
 
Scenario Resulting Response / Message 
Non-
compliance to 
requirements 
Display unsuccessful uploading 
message and returns the validated 
XML.  
Duplicate 
Report 
Report already uploaded.  
 
 
 
 
 
 
        
 

# 4. CONFIDENTIALITY
 
Given the nature PhilHealth mandate, it is vital that we maintain the confidentiality of patient information. 
PhilHealth is committed in ensuring utmost confidentiality of health records and related information of all 
patient because the right to privacy is personal and fundamental; likewise it is the responsibility of PhilHealth 
to safeguard all confidential information. 
 
Confidential Information  
 
Confidential information includes, but is not limited to, protected health information, personal financial 
information, patient records, or information gained from committee meetings, hospital or facility visits 
during accreditation and investigation, inquiries from members, patients or o ther PhilHealth employees. 
Example include: data contained on claim forms, past and current medical and psychiatric record member  
employment data, patient insurance and billing of records, computerized patient data, visual observation of 
patients/members or any verbal information provided by or about a patient. These information may be 
contained via any communication medium, including verbal, written or electronic. 1 
 
Protection Policies and Procedures 
 
All information that can be used to identify a Patien t or a commercial entity in a commercially sensitive 
context is considered Confidential Health Information (CHI). 
 
It is required that all partners develop, institute, educate staff and periodically update standard operating 
policies and procedures that protect CHI. The policies and procedures  must be available for inspection and 
their use must be demonstrate upon request. PhilHealth will make available default policies and procedures. 
 
Necessary and authorized access . Each party is required to ensure that  only minimum necessary 
personnel have access to CHI. Additionally, each party must have appropriate means to secure CHI and its 
use within its operations including when exchanging CHI with other partners. Each party must provide a 
means to authenticate authorized users. 
 
Unauthorized access.  Every party should keep CHI from unauthorized access. PhilHealth must be 
notified, however, as soon as unauthorized access is detected. This notice must include what was disclosed, 
how it was obtained (means and methods), who gained unauthorized access if known, if the data has been 
subsequently unlawfully disclosed and the risk mitigation plan the party is now pursuing to prevent any 
further unauthorized access. Confidentiality breaches can occur from external and inte rnal sources. Each 
party must have a published sanction policy and ensure that is effectively communicated to staff periodically. 
For external breaches appropriate law enforcement officials will be involved in the investigation and 
prosecution as necessary. 
 
Storage of CHI. Each party is required to develop, maintain and implement policies and procedures for 
protecting CHI stored electronically or via paper. This is especially true for off -site storage in the case of 
paper records and back -ups, archives and  live storage of electronic records. The storage policies and 
procedures apply irrespective of the purpose of storage, for instance whether the CHI is stored on a CD for 
archiving or transmission purposes. 
 
                                                 
 
 
1 PhilHealth Office Order 0050, s.,2011 
 
 
        
 
Transmission of CHI. Each party must protect CHI during the full life  cycle of transformations, whether 
electronic or not. This includes preparation of data transmission, transmitting data, and receiving transmitted 
data. For the electronic transmission of CHI 
 
 If the public internet is used for electronic data exchange, policies and procedures should cover the 
secure transmission of data, which includes encryption of data. 
 If private secure point -to-point connections are used for electronic data exchange, policies and 
procedures should cover their provisioning and maintenance. Data encryption is recommended even 
when using secure private point-to-point connections2 
 
 
 
 
 
  
                                                 
 
 
2 www.shafafiya.org/HAAD, s2008 
 
 
        
 

# 4.  ANNEXES
 
 
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
PCB pUsername VARCHAR2 30 
BYTE 
HCI User ID --to be provided by 
PhilHealth 
Y Y       
pPassword VARCHAR2 30 
BYTE 
HCI User Password --to be provided 
by PhilHealth 
Y Y       
pHciAccreNo VARCHAR2 9 
BYTE 
Accreditation Number of Health Care 
Institution (HCI) 
Y Y       
pPMCCNo VARCHAR2 6 
BYTE 
PMCC Number of Health Care 
Institution (HCI) 
Y Y       
pEnlistTotalCnt NUMBER  Total Count of Enlistments Y Y       
pProfileTotalCnt NUMBER  Total Count of Profiles Y Y       
pSoapTotalCnt NUMBER  Total Count of Consultations Y Y       
pCertificationId VARCHAR2 21 
BYTE 
Software Certificate ID 
 
Y Y       
pHciTransmittalNumber VARCHAR2 21 
BYTE 
Health Care Institution (HCI) 
Transmittal Number – generated by 
the HCI own batching system. This 
should be unique per hospital. 
Y Y   R+ACCRE_NO + 
date of extraction 
(YYYYMM) + 5 
digit series 
number = 
R+XXXXXXXXX+YY
YY+MM+99999 
   
ENLISTMENT pHciCaseNo VARCHAR2 21 
BYTE 
Patient Transaction Reference 
Number for the Whole Patient 
Record 
 Y  Y   T+ACCRE_NO+YYY
Y+MM+4 digits 
series number = 
T+XXXXXXXXX+YY
YY+MM+99999 
   
pHciTransNo VARCHAR2 21 
BYTE 
Enlistment Reference Number Y Y PK  E+ACCRE_NO+YYY
Y+MM+5 digits 
series number = 
E+XXXXXXXXX+YY
YY+MM+99999 
   
pEffYear VARCHAR2 4 
BYTE 
Effectivity Year of Enlistment Y Y   YYYY-MM-DD    
pEnlistStat VARCHAR2 1 
BYTE 
Status of Enlistment Y Y      1 – Active; 
2 – Cancelled; 
3 – Transferred 
pEnlistDate DATE  Date of Enlistment Y Y   YYYY-MM-DD    
pPackageType VARCHAR2 1 
BYTE 
Enlistment Type 
 
Y Y     “K” – 
KONSULTA 
Package  
”P” – PCB1; 
”E” – Expanded PCB; 
“K” – KONSULTA Package  
pMemPin VARCHAR2 12 
BYTE 
Philhealth Identification Number 
(PIN) of Primary Member 
Y Y       
pMemFname VARCHAR2 30 
BYTE 
First Name of Primary Member Y Y       
pMemMname VARCHAR2 30 
BYTE 
Middle Name of Primary Member  N N       
pMemLname VARCHAR2 30 
BYTE 
Last Name of Primary Member  Y Y       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pMemExtname VARCHAR2 30 
BYTE 
Extension Name of Primary Member  N N       
pMemDob DATE  Date of Birth of Primary Number Y Y   YYYY-MM-DD    
pPatientPin VARCHAR2 12 
BYTE 
Refer to Member’s PIN if patient type 
is MM; Refer to Dependent’s PIN if 
type is DD  
Y Y       
pPatientFname VARCHAR2  30 
BYTE 
First Name of Patient  
 
Refer to Member’s First Name if 
patient type is MM; Refer to 
Dependent’s First Name if type is DD 
Y Y       
pPatientMname VARCHAR2 30 
BYTE 
Middle Name of Patient  
 
Refer to Member’s Middle Name if 
patient type is MM; Refer to 
Dependent’s Middle Name if type is 
DD 
N N       
pPatientLname VARCHAR2 30 
BYTE 
Last Name of Patient  
 
Refer to Member’s Last Name if 
patient type is MM; Refer to 
Dependent’s Last Name if type is DD 
Y Y       
pPatientExtname VARCHAR2 30 
BYTE 
Extension Name of Patient 
 
Refer to Member’s Extension Name if 
patient type is MM; Refer to 
Dependent’s Extension Name if type 
is DD 
N N       
pPatientSex VARCHAR2 1 
BYTE 
Sex of Patient Y Y      ”F” – Female; 
”M” – Male  
pPatientDob DATE  Date of Birth of Patient  Y Y   YYYY-MM-DD    
pPatientType VARCHAR2 2 
BYTE 
Patient Type Y Y      “MM” – Member; 
“DD” – Dependent 
pPatientMobileNo VARCHAR2 15 
BYTE 
Mobile No. Of Patient 
 
Y Y       
pPatientLandlineNo VARCHAR2 15 
BYTE 
Landline No. Of Patient 
 
N N       
pWithConsent VARCHAR2 1 
BYTE 
Flag for with Consent  
 
Y Y      ”Y ”– Yes; 
”N ”– No 
”X ”– Not Applicable 
pTransDate DATE  Date when the record inserted Y Y   YYYY-MM-DD    
pCreatedBy VARCHAR2 30 
BYTE 
User who created the record 
 
Y Y       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
PROFILE pHciTransNo VARCHAR2 21 
BYTE 
Profiling / Health Screening & 
Assessment Reference Number 
Y Y PK  P+ACCRE_NO+YYY
Y+MM+5 digits 
series number = 
P+XXXXXXXXX+YY
YY+MM+99999 
   
pHciCaseNo VARCHAR2 21 
BYTE 
Patient Transaction Reference 
Number  
Y Y FK ENLISTMENT 
TABLE  
    
pProfDate DATE  Profiling Date Y Y   YYYY-MM-DD    
pPatientPin VARCHAR2 12 
BYTE 
PhilHealth Identification Number of 
Patient 
Y Y       
pPatientType VARCHAR2 2 
BYTE 
Patient Type Y Y         ”MM” – Member; 
”DD” – Dependent; 
pPatientAge VARCHAR2  Age of Patient Y Y       
pMemPin VARCHAR2 12 
BYTE 
PhilHealth Identification Number of 
Primary Member 
Y Y       
pEffYear VARCHAR2 4 
BYTE 
Effectivity Year Y Y       
pATC VARCHAR2 10 
BYTE 
Authorization Transaction Code  
 
Note: Use ‘WALKEDIN’ as value if 
pWalkedIn is ‘Y’ 
Y Y       
pIsWalkedIn VARCHAR2 1 
BYTE 
Is Patient Walked In Y Y      “Y” – Yes; 
“N” - No 
pTransDate DATE  Date when the record inserted Y Y   YYYY-MM-DD    
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
MEDHIST (Patient 
Past Medical 
History) 
pMdiseaseCode VARCHAR2 3 
BYTE 
Disease Code Y Y  lib_mdisease     
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
MHSPECIFIC 
(Patient Specific 
Disease 
Description in Past 
Medical History) 
pMdiseaseCode VARCHAR2  3 
BYTE 
Selected Disease Code in the Patient 
Medical History 
N N  lib_mdisease     
pSpecificDesc VARCHAR2 2000 
BYTE 
Value for Specific Description of 
Disease Code Selected 
N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
SURGHIST (Patient 
Surgical History) 
pSurgDesc VARCHAR2 500 
BYTE 
Description of Surgical Operation N N       
pSurgDate DATE  Date of Surgical Operation N N   YYYY-MM-DD    
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
FAMHIST (Family 
Medical History) 
pMdiseaseCode VARCHAR2 3 
BYTE 
Disease Code for Family 
Medical/Disease History 
Y N  lib_mdisease     
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
FHSPECIFIC 
(Specific Disease 
Description in 
Patient Family 
Medical History) 
pMdiseaseCode VARCHAR2 3 
BYTE 
Disease Code N N  lib_mdisease     
pSpecificDesc VARCHAR2 2000 
BYTE 
Value for Specific Description Code 
Selected  
N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
SOCHIST (Patient 
Social/ Personal 
History) 
pIsSmoker VARCHAR2 1 
BYTE 
Is Patient is Smoker Y Y      ”Y ”– Yes; 
”N ”– No; 
“X” - Quit 
pNoCigpk NUMBER  Refer to the number of Cigarette 
Pack Consumed per Year – Required 
if pIsSmoker = ‘Y’ 
 
 
N N       
pIsAdrinker VARCHAR2 1 
BYTE 
If Patient is Alcohol Drinker  Y Y      ”Y ”– Yes; 
”N ”– No 
“X” – Quit 
pNoBottles NUMBER  Refer to the number of bottles 
consumed per day – Required if 
pIsADrinker = ‘Y’ 
N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pIllDrugUser VARCHAR2 1 
BYTE 
If the patient is illicit Drug User Y Y      ”Y ”– Yes; 
”N ”– No 
pIsSexuallyActive VARCHAR2 1 
BYTE 
If the patient is Sexually Active Y Y      ”Y ”– Yes; 
”N ”– No 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
IMMUNIZATION 
(Patient 
Immunization 
Record) 
pChildImmcode VARCHAR2 3 
BYTE 
Children Immunization Code N N  lib_immchild     
pYoungwImmcode VARCHAR2 3 
BYTE 
Young Immunization Code 
 
N N  lib_immyoungw     
pPregwImmcode VARCHAR2 3 
BYTE 
Pregnant Immunization Code N N  lib_immpregw     
pElderlyImmcode VARCHAR2 3 
BYTE 
Elderly Immunization Code N N  lib_immaelderly     
pOtherImm VARCHAR2 2000 
BYTE 
Other Immunization not found in the 
list provided by the system 
N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
MENSHIST (Patient 
Menstrual History 
– For Female 
Patient Only) 
pMenarchePeriod NUMBER  Age of First Menstruation 
(Menarche) 
N N       
pLastMensPeriod DATE  Date of Last Menstrual Period  N N   YYYY-MM-DD    
pPeriodDuration NUMBER  Duration of Menstrual Period in 
Number of Days  
N N       
pMensInterval NUMBER  Interval/Cycle of Menstruation in 
Number of Days  
N N       
pPadsPerDay NUMBER  Number of Pads/Napkins Used per 
Day during Menstruation 
N N       
pOnsetSexIc NUMBER  Onset of Sexual Intercourse (Age of 
First Sexual Intercourse) 
N N       
pBirthCtrlMethod VARCHAR2 21 
BYTE 
Birth Control Method Used  N N       
pIsMenopause VARCHAR2 1 
BYTE 
Is Menopause? N N      ”Y ”– Yes; 
”N ”– No 
pMenopauseAge NUMBER  If Menopause, Age of Menopause N N       
pIsApplicable VARCHAR2 1 
BYTE 
If Patient Menstrual History 
Applicable 
Y Y      ”Y ”– Yes; 
”N ”– No 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
PREGHIST (Patient 
Pregnancy History 
– For Female 
Patient Only) 
pPregCnt NUMBER  Number of Pregnancy to Date –
Gravity 
Chief  
N N       
pDeliveryCnt NUMBER  Number of Delivery to Date –Parity N N       
pDeliveryTyp VARCHAR2 1 
BYTE 
Type of Delivery N N      “N” – Normal (NSD) 
“O” – Operative (CSD) 
“B” – Both Normal & Operative 
(NSD & CSD) 
“X” – Not Applicable 
 
pFullTermCnt NUMBER  Number of Full Term Pregnancy N N       
pPrematureCnt NUMBER  Number of Premature Pregnancy N N       
pAbortionCnt NUMBER  Number of Abortion N N       
pLivChildrenCnt NUMBER  Number of Living Children N N       
pWPregIndhyp VARCHAR2 1 
BYTE 
If Pregnancy – Induced Hypertension 
(Pre – Eclampsia)  
N N      ”Y ”– Yes; 
”N ”– No/Nonr 
pWFamPlan VARCHAR2 1 
BYTE 
If with access to Family Planning 
Counselling 
Y Y      ”Y ”– Yes; 
”N ”– No/None 
pIsApplicable VARCHAR2 1 
BYTE 
If Pregnancy History Applicable Y Y      ”Y ”– Yes; 
”N ”– No 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
PEPERT (Physical 
Examination 
Findings for BP 
Measurements, 
Heart and 
Respiratory Rate, 
Body 
Measurements 
and Vision) 
pSystolic NUMBER   Systolic Blood Pressure of Adult 
Patient –mmHG 
Y Y       
pDiastolic NUMBER  Diastolic Blood Pressure of Adult 
Patient 
Y 
 
Y 
 
      
pHr NUMBER  Heart Rate of Patient per Minute Y 
 
Y 
 
      
pRr NUMBER  Respiratory Rate of Patient per 
Minute 
Y 
 
Y 
 
      
pTemp NUMBER  Temperature in Celsius Y 
 
Y 
 
      
pHeight NUMBER  Height of Patient in cm Y 
 
Y 
 
      
pWeight NUMBER  Weight of Patient in kg Y 
 
Y 
 
      
pBMI NUMBER  Body Mass Index 
Computation:  
weight (kg)/ height(m)*height(m) 
Y 
 
Y 
 
      
pZScore VARCHAR2 10 
BYTE 
Value is no longer required, 
parameters can be left empty. This 
will be computed thru back-end and 
the required fields to compute are 
N 
 
N 
 
      
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
height\length, weight, age and sex of 
the patient, 60 months old and 
below. 
pLeftVision VARCHAR2 12 
BYTE 
Left Eye Visual Acuity (Vision) of 
Patient  
N 
 
N 
 
      
pRightVision VARCHAR2 12 
BYTE 
Right Eye Visual Acuity (Vision) of 
Patient  
N N       
pLength NUMBER   Length of Patient in cm - for Pediatric 
Patient only age 0-24 Months 
 
Note: Required for Pediatric Patient 
only age 0-24 Months 
N N       
pHeadCirc NUMBER  Head Circumference of Patient in cm 
- for Pediatric Patient only age 0-24 
Months 
N N       
pSkinfoldThickness NUMBER  Skinfold Thickness of Patient in cm - 
for Pediatric Patient only age 0-24 
Months 
N 
 
N 
 
      
pWaist NUMBER  Waist of Patient in cm - for Pediatric 
Patient only age 0-24 Months 
N N       
pHip NUMBER  Hip of Patient in cm - for Pediatric 
Patient only age 0-24 Months 
N N       
pLimbs NUMBER  Limbs of Patient in cm - for Pediatric 
Patient only age 0-24 Months 
N N       
pMidUpperArmCirc NUMBER  Middle and Upper Arm 
Circumference   
 
Note: Required for Pediatric Patient 
only age 0-24 Months 
N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
BLOODTYPE 
(Patient Blood type 
Details) 
pBloodType VARCHAR2  3 
BYTE 
Patient Blood Type  N N      A+;  
B+;  
AB+;  
O+;  
A-;  
B-;  
AB-;  
O-; 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
PEGENSURVEY 
(Physical 
Examination 
General Survey) 
pGenSurveyId VARCHAR2 1 
BYTE 
General Survey N N      1 – Awake and Alert; 
2 – Altered Sensorium 
pGenSurveyRem VARCHAR2 2000 
BYTE 
Remarks for GenSurvey, if 
pGenSurveyId ==2 
N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
PEMISC (Physical 
Examination 
Findings for Skin, 
HEENT, Chest, 
Heart, Abdomen, 
Neuro, Rectal and 
Genitourinary) 
pSkinId VARCHAR2 3 
BYTE 
Skin / Extremities Description ID N N  lib_skin_extremitie
s 
    
pHeentId VARCHAR2 3 
BYTE 
HEENT (Head, Eyes, Ears, Nose, 
Throat) Description ID 
 
N N  lib_heent     
pChestId VARCHAR2 3 
BYTE 
Chest Description ID 
 
N N  lib_chest     
pHeartId VARCHAR2 3 
BYTE 
Heart Description ID 
  
N N  lib_heart     
pAbdomenId VARCHAR2 3 
BYTE 
Abdomen Description ID 
 
N N  lib_abdomen     
pNeuroId VARCHAR2 3 
BYTE 
Neurological Description ID 
 
N N  lib_neuro     
pRectalId VARCHAR2 3 
BYTE 
Digital Rectal Description ID N N  lib_digital_rectal     
pGuId VARCHAR2 3 
BYTE 
Genitourinary Description ID 
 
N N   lib_genitourinary     
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
PESPECIFIC 
(Remarks  in 
Patient Physical 
Examination 
Findings for Skin, 
HEENT, Chest, 
Heart, Abdomen, 
Neuro, Rectal and 
Genitourinary) 
pSkinRem VARCHAR2 2000 
BYTE 
Additional Findings in Skin N N       
pHeentRem VARCHAR2 2000 
BYTE 
Additional Findings in HEENT  N N       
pChestRem VARCHAR2 2000 
BYTE 
Additional Findings in Chest/Lungs N N       
pHeartRem VARCHAR2 2000 
BYTE 
Additional Findings in Heart N N       
pAbdomenRem VARCHAR2 2000 
BYTE 
Additional Findings in Abdomen N N       
pNeuroRem VARCHAR2 2000 
BYTE 
Additional Findings in Neurological N N       
pRectalRem VARCHAR2 2000 
BYTE 
Additional Findings in Digital Rectal N N       
pGuRem VARCHAR2 2000 
BYTE 
Additional Findings in Genitourinary N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
NCDQANS (Patient 
Answer to NCD 
Questionnaires – 
For Patient Aged 
25 Years Old) 
pQid1_Yn VARCHAR2 1 
BYTE 
Answer for QID1 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid2_Yn VARCHAR2 1 
BYTE 
Answer for QID2 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid3_Yn VARCHAR2 1 
BYTE 
Answer for QID3 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid4_Yn VARCHAR2 1 
BYTE 
Answer for QID4 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid5_Ynx VARCHAR2 1 
BYTE 
Answer for QID21 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No  
“X” – Don’t Know 
pQid6_Yn VARCHAR2 1 
BYTE 
Answer for QID6 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid7_Yn VARCHAR2 1 
BYTE 
Answer for QID7 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid8_Yn VARCHAR2 1 
BYTE 
Answer for QID8 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid9_Yn VARCHAR2 1 
BYTE 
Answer for QID9 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid10_Yn VARCHAR2 1 
BYTE 
Answer for QID10 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid11_Yn VARCHAR2 1 
BYTE 
Answer for QID11 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid12_Yn VARCHAR2 1 
BYTE 
Answer for QID12 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid13_Yn VARCHAR2 1 
BYTE 
Answer for QID13 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid14_Yn VARCHAR2  1 
BYTE 
Answer for QID14 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid15_Yn VARCHAR2 1 
BYTE 
Answer for QID15 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid16_Yn VARCHAR2 1 
BYTE 
Answer for QID16 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid17_Abcde VARCHAR2 1 
BYTE 
Answer for QID17: Risk Level 
Percentage 
N N  lib_ncdq    A - <10% ; 
B: 10% to 20%; 
C: 20% to 30%; 
D : 30% to 40%; 
E: =>40% 
pQid18_Yn VARCHAR2 1 
BYTE 
Answer for QID18: (With / Without 
Medication for Diabetes) 
N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid19_Yn VARCHAR2 1 
BYTE 
Answer for QID19 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pQid19_Fbsmg VARCHAR2 50 
BYTE 
Answer for QID19: FBS/RBS in mg/dL N N  lib_ncdq     
pQid19_Fbsmmol VARCHAR2 50 
BYTE 
Answer for QID19: FBS/RBS in 
mmol/L 
N N  lib_ncdq     
pQid19_Fbsdate DATE  Answer for QIDI19: Date when is the 
FBS/RBS value was taken 
N N  lib_ncdq YYYY-MM-DD    
pQid20_Yn VARCHAR2 1 
BYTE 
Answer for QID20 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid20_Choleval VARCHAR2 3 
BYTE 
Answer for QID20: Total Cholesterol 
value in mg/dL 
N N  lib_ncdq     
pQid20_Choledate DATE  Answer for QID20: Date when is the 
FBS/RBS Value was taken 
N N  lib_ncdq YYYY-MM-DD    
pQid21_Yn VARCHAR2 1 
BYTE 
Answer for QID21 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid21_Ketonval VARCHAR2 3 
BYTE 
Answer for QID21: Urine Ketones 
Value 
N N  lib_ncdq     
pQid21_Ketondate DATE  Answer for QID21: Date when is the 
Urine Ketones Value was taken 
N N  lib_ncdq YYYY-MM-DD    
pQid22_Yn VARCHAR2 1 
BYTE 
Answer for QID22 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid22_Proteinval VARCHAR2 3 
BYTE 
Answer for QID22: Urine Protein 
Value in mg/dL 
N N  lib_ncdq      
pQid22_Proteindate DATE  Answer for QID22: Date when the 
Urine Protein Value was taken 
N N  lib_ncdq YYYY-MM-DD    
pQid23_Yn VARCHAR2 1 
BYTE 
Answer for QID23  N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pQid24_Yn VARCHAR2 1 
BYTE 
Answer for QID24 N N  lib_ncdq    ”Y ”– Yes; 
”N ”– No 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
SOAP 
(Consultation) 
pHciTransNo VARCHAR2 21 
BYTE 
SOAP / Consultation Reference 
Number  
N Y PK  S+ACCRE_NO+YYY
Y+MM+5 digits 
series number = 
S+XXXXXXXXX+YY
YY+MM+99999 
   
pHciCaseNo VARCHAR2 21 
BYTE 
Patient Transaction Reference 
Number  
N Y FK ENLISTMENT 
TABLE 
    
pSoapDate DATE  SOAP Date N Y   YYYY-MM-DD    
pPatientPin VARCHAR2 12 
BYTE 
Philhealth Identification Number of 
Patient 
N Y       
pPatientType VARCHAR2 2 
BYTE 
Patient Type N Y      ”MM” – Member; 
”DD” – Dependent 
pMemPin VARCHAR2 12 
BYTE 
Philhealth Identification Card of 
Primary Member 
N Y       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pEffYear VARCHAR2 4 
BYTE 
Effectivity Year N Y       
pATC VARCHAR2 10 
BYTE 
Authorization Transaction Code  
 
Note: Use ‘WALKEDIN’ as value if 
pWalkedIn is ‘Y’ 
N Y       
pIsWalkedIn VARCHAR2 1 
BYTE 
Is Patient Walked In N Y      “Y” – Yes; 
“N” - No 
pCoPay VARCHAR2 15 
BYTE 
Patient Co-Payment Amount  N Y       
pTransDate DATE  Date when the record inserted N Y   YYYY-MM-DD    
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
SUBJECTIVE 
(Record of Patient 
Chief Complaint 
and History of 
Illness) 
pIllnessHistory VARCHAR2 2000 
BYTE 
History of Patient Illnesses N Y       
pSignsSymptoms VARCHAR2 2000 
BYTE 
Pertinent Signs and Symptoms on 
Admission ID 
N Y  lib_signssymptoms For multiple 
entries: use semi-
colon “;” as 
delimiter 
   
pOtherComplaint VARCHAR2 2000 
BYTE 
Other Complaint 
 
Note: Required if ‘X’ is included in 
pSignsSymptoms  
N N       
pPainSite VARCHAR2 500 
BYTE 
 
Site of Pain if Pain Element in 
Pertinent Signs and Symptoms on 
Admission is checked 
 
Note: Required if ‘38’ is included in 
pSignsSymptoms   
N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
PEPERT (Physical 
Examination 
Findings for BP 
Measurements, 
Heart and 
Respiratory Rate, 
Body 
pSystolic NUMBER   Systolic Blood Pressure of Adult 
Patient –mmHG 
N 
 
Y       
pDiastolic NUMBER  Diastolic Blood Pressure of Adult 
Patient 
N 
 
Y 
 
      
pHr NUMBER  Heart Rate of Patient per Minute N Y 
 
      
pRr NUMBER  Respiratory Rate of Patient per 
Minute 
N Y 
 
      
pTemp NUMBER  Temperature in Celsius N Y 
 
      
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
Measurements 
and Vision) 
pHeight NUMBER  Height of Patient in cm N 
 
Y 
 
      
pWeight NUMBER  Weight of Patient in kg N Y 
 
      
pBMI NUMBER  Body Mass Index 
Computation:  
weight (kg)/ height(m)*height(m) 
N 
 
Y 
 
      
pZScore VARCHAR2 10 
BYTE 
Value is no longer required, 
parameters can be left empty. This 
will be computed thru back-end and 
the required fields to compute are 
height\length, weight, age and sex of 
the patient, 60 months old and 
below. 
N 
 
N 
 
      
pLeftVision VARCHAR2 12 
BYTE 
Left Eye Visual Acuity (Vision) of 
Patient  
N 
 
N 
 
      
pRightVision VARCHAR2 12 
BYTE 
Right Eye Visual Acuity (Vision) of 
Patient  
N N       
pLength NUMBER   Length or Height of Patient in cm - 
for Pediatric Patient only age 0-24 
Months 
 
Note: Required for Pediatric Patient 
only age 0-24 Months 
 
N N       
pHeadCirc NUMBER  Head Circumference of Patient in cm 
- for Pediatric Patient only age 0-24 
Months 
N N       
pSkinfoldThickness NUMBER  Skinfold Thickness of Patient in cm - 
for Pediatric Patient only age 0-24 
Months 
N 
 
N 
 
      
pWaist NUMBER  Waist of Patient in cm - for Pediatric 
Patient only age 0-24 Months 
 
N N       
pHip NUMBER  Hip of Patient in cm - for Pediatric 
Patient only age 0-24 Months 
 
 
N N       
pLimbs NUMBER  Limbs of Patient in cm - for Pediatric 
Patient only age 0-24 Months 
 
 
N N       
pMidUpperArmCirc NUMBER  Middle and Upper Arm 
Circumference  
 
Note: Required for Pediatric Patient 
only age 0-24 Months 
N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
PEMISC (Physical 
Examination 
Findings for Skin, 
HEENT, Chest, 
Heart, Abdomen, 
Neuro, Rectal and 
Genitourinary) 
pSkinId VARCHAR2 3 
BYTE 
Skin / Extremities Description ID N Y  lib_skin_extremitie
s 
    
pHeentId VARCHAR2 3 
BYTE 
HEENT (Head, Eyes, Ears, Nose, 
Throat) Description ID 
N Y  lib_heent     
pChestId VARCHAR2 3 
BYTE 
Chest Description ID 
 
N Y  lib_chest     
pHeartId VARCHAR2 3 
BYTE 
Heart Description ID 
  
N Y  lib_heart     
pAbdomenId VARCHAR2 3 
BYTE 
Abdomen Description ID 
 
N Y  lib_abdomen     
pNeuroId VARCHAR2 3 
BYTE 
Neurological Description ID 
 
N Y  lib_neuro     
pRectalId VARCHAR2 3 
BYTE 
Digital Rectal Description ID N Y  lib_digital_rectal     
pGuId VARCHAR2 3 
BYTE 
Genitourinary Description ID 
 
N Y   lib_genitourinary     
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
PESPECIFIC 
(Remarks  in 
Patient Physical 
Examination 
Findings for Skin, 
HEENT, Chest, 
Heart, Abdomen, 
Neuro, Rectal and 
Genitourinary) 
pSkinRem VARCHAR2 2000 
BYTE 
Additional Findings in Skin N N       
pHeentRem VARCHAR2 2000 
BYTE 
Additional Findings in HEENT  N N       
pChestRem VARCHAR2 2000 
BYTE 
Additional Findings in Chest/Lungs N N       
pHeartRem VARCHAR2 2000 
BYTE 
Additional Findings in Heart N N       
pAbdomenRem VARCHAR2 2000 
BYTE 
Additional Findings in Abdomen N N       
pNeuroRem VARCHAR2 2000 
BYTE 
Additional Findings in Extremities N N       
pRectalRem VARCHAR2 2000 
BYTE 
Location of Palpable Mass –If 
Palpable Mass is Selected in HEENT 
N N       
pGuRem VARCHAR2 2000 
BYTE 
Description of Deformity and 
Laterality –If Present / Absent is 
selected under Extremities  
N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
ICD (List of ICD-10 
Codes For Patient 
Diagnosis) 
pIcdCode VARCHAR2 10 
BYTE 
ICD 10 Codes for Patient Diagnosis 
 
N Y  lib_icd     
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
DIAGNOSTIC 
(Prescribed 
Laboratory  to the 
Patient) 
pDiagnosticId VARCHAR2 3 
BYTE 
Code for Diagnostic 
 
N Y  lib_diagnostic   “0” – Not 
Applicable 
 
pOthRemarks VARCHAR2 500 
BYTE 
Other Diagnostic Exam not included 
in Essential Services 
N N       
pIsPhysicianRecommend
ation 
VARCHAR2 1 
BYTE 
Is diagnostic exam recommended by 
Physician? 
N Y      “Y” – Yes 
“N” – No  
“X” – None/ Not Applicable 
pPatientRemarks VARCHAR2 2 
BYTE 
Patient Remarks per diagnostic exam N Y      “RQ” – Request 
“RF” - Refuse 
“XX” – None / Not Applicable 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
MANAGEMENT 
(Patient 
Plan/Management 
Record) 
pManagementId VARCHAR2  1 
BYTE 
Code for Plan / Management done in 
the Patient 
N Y  lib_management   “0” – Not 
Applicable 
 
pOthRemarks  500 
BYTE 
Other Remarks N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
ADVICE (Doctor’s 
Advice to Patient) 
pRemarks VARCHAR2 2000 
BYTE 
Remarks or additional instruction on 
Drug/Medicine for Patient 
N Y     If no 
prescribed 
medicine 
then default 
value “NOT 
APPLICABLE ” 
 
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
MEDICINE (List of 
Prescribed Drugs 
to the Patient) 
pHciCaseNo VARCHAR2 21 
BYTE 
Patient Transaction Reference 
Number  
N Y FK Enlistment Table      
pHciTransNo VARCHAR2 21 
BYTE 
SOAP Reference Number N Y FK SOAP Table  
 
 
    
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pCategory VARCHAR2 50 
BYTE 
Drug/ Medicine Category N N  lib_medicine     
pDrugCode VARCHAR2 30 
BYTE 
Complete Drug Code 
 
Note: Use 
‘NOMED00000000000000000000000
00’ if no medicine record 
N N  lib_medicine     
pGenericCode VARCHAR2 5 
BYTE 
Generic Code of Medicine 
 
Note: Use ‘NOMED’ if no medicine 
record 
N N  lib_medicine_gene
ric 
    
pSaltCode VARCHAR2 5 
BYTE 
Salt Code of Medicine 
 
Note: Use ‘00000’ if no medicine 
record 
N N  lib_medicine_salt     
pStrengthCode VARCHAR2 5 
BYTE 
Strength / Dosage Code of Medicine 
 
Note: Use ‘00000’ if no medicine 
record 
N N  lib_medicine_stren
gth 
    
pFormCode VARCHAR2 5 
BYTE 
Form Code of Medicine 
 
Note: Use ‘00000’ if no medicine 
record 
N N  lib_medicine_form     
pUnitCode VARCHAR2 5 
BYTE 
Unit Code of Medicine 
 
Note: Use ‘00000’ if no medicine 
record 
N N  lib_medicine_unit     
pPackageCode VARCHAR2 5 
BYTE 
Package Code of Medicine 
 
Note : Use ‘00000’ if no medicine 
record 
N N  lib_medicine_pack
age 
    
pOtherMedicine VARCHAR2 500 
BYTE 
Complete Drug Description, if 
Medicine is not listed on the library 
N N       
pOthMedDrugGrouping VARCHAR2 50 
BYTE 
Drug Grouping for other medicine 
not listed in the library 
 
Note: Required if pOtherMedicine is 
with value and pIsApplicable is “Y” 
N N      “NCD”; 
“ANTIBIOTIC”; 
“OTHERS” 
pRoute VARCHAR2 500 
BYTE 
Medicine Route N N       
pQuantity NUMBER  Number of Medicines Prescribed N N     0  
pActualUnitPrice NUMBER  Drug Actual Price Look N N     0.00  
pTotalAmtPrice NUMBER  Total Amount Price of Medicine 
Issued (Quantity * Unit Price) 
N N     0.00  
pInstructionQuantity VARCHAR2 50 Number of Medicines per Instruction N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pInstructionStrength VARCHAR2 50 Stock Dosage of Medicine per 
Instruction 
N N       
pInstructionFrequency VARCHAR2 50 Frequency of Medicine per 
Instruction 
N N       
pPrescribingPhysician VARCHAR 200 
BYTE 
Prescribing Physician/Doctor N N       
pIsDispensed VARCHAR 1 
BYTE 
If medicine dispensed N Y       
pDateDispensed DATE   Date the medicine dispensed N N   YYYY-MM-DD    
pDispensingPersonnel VARCHAR 200 
BYTE 
Dispensing Personnel N N       
pIsApplicable VARCHAR 1 
BYTE 
If applicable  N Y     If no 
prescribed 
medicine 
then default 
value “N” 
”Y ”– Yes; 
”N ”– No 
pDateAdded DATE   Date the record was added N N   YYYY-MM-DD    
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Status Report N N       
DIAGNOSTICEXAM
RESULT    
pHciCaseNo VARCHAR2 21 
BYTE 
Patient Transaction Reference 
Number 
N Y FK Enlistment Table     
pHciTransNo VARCHAR2 21 
BYTE 
Profile/SOAP Reference Number N Y FK SOAP Table     
pPatientPin VARCHAR2 12 
BYTE 
Refer to Member’s Pin if patient type 
is MM; Refer to Dependent’s Pin if 
type is DD  
N Y       
pPatientType VARCHAR2 2 
BYTE 
Patient Type N Y      ”MM” – Member; 
”DD” – Dependent; 
pMemPin VARCHAR2 12 
BYTE 
Philhealth Identification Number 
(PIN) of Primary Member 
N Y       
pEffYear VARCHAR2 4 
BYTE 
Effectivity Year of Enlistment N Y       
CBC (Complete 
Blood Count) 
pReferralFacility VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate DATE  Date of Laboratory for CBC N N   YYYY-MM-DD    
pHematocrit VARCHAR2 50 
BYTE 
Value for Hematocrit  N N       
pHemoglobinG VARCHAR2 50 
BYTE 
Value for Hemoglobin in g/dL  N N       
pHemoglobinMmol VARCHAR2 50 
BYTE 
Value for  Hemoglobin in mmol/L N N       
pMhcPg VARCHAR2 50 
BYTE 
Value for MHC in pg/cell N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pMhcFmol VARCHAR2 50 
BYTE 
Value for MHC in fmol/cell N N       
pMchcGhb VARCHAR2 50 
BYTE 
Value for MCHC in fmol/cell N N       
pMchcMmol VARCHAR2 50 
BYTE 
Value for MCHC in  mmol/Hb/L N N       
pMcvUm VARCHAR2 50 
BYTE 
Value for MCV in um^3  N N       
pMcvFl VARCHAR2 50 
BYTE 
Value for MCV In fL N N       
pWbc1000 VARCHAR2 50 
BYTE 
Value for WBC in X 1000 
cells/mm^3uL 
N N       
pWbc10 VARCHAR2 50 
BYTE 
Value for WBC in X 10^9 cells/L N N       
pMyelocyte VARCHAR2 50 
BYTE 
Percentage Value of Myelocyte in 
Leukocyte Differential 
N N       
pNeutrophilsBnd VARCHAR2 50 
BYTE 
Percentage Value of Neutrophil 
Bands in Leukocyte Differential 
N N       
pNeutrophilsSeg VARCHAR2 50 
BYTE 
Percentage Value of Neutrophil 
Segmenters in Leukocyte Differential 
N N       
pLymphocytes VARCHAR2 50 
BYTE 
Percentage Value of Lymphocytes in 
Leukocyte Differential 
N N       
pMonocytes VARCHAR2 50 
BYTE 
Percentage Value of Monocytes in 
Leukocyte Differential 
N N       
pEosinophils VARCHAR2 50 
BYTE 
Percentage Value of Eosinophils in 
Leukocyte Differential 
N N       
pBasophils VARCHAR2 50 
BYTE 
Percentage Value of Basophils in 
Leukocyte Differential 
N N       
pPlatelet VARCHAR2 50 
BYTE 
Percentage Value of Platelet in 
Leukocyte Differential  
N N       
pDateAdded DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
URINALYSIS pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for Urinalysis N N   YYYY-MM-DD    
pGravity  
VARCHAR2 50 
BYTE 
Specific Gravity of Urine N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pAppearance  
VARCHAR2 50 
BYTE 
Appearance of Urine N N       
pColor  
VARCHAR2 50 
BYTE 
Color of Urine N N       
pGlucose  
VARCHAR2 50 
BYTE 
Count of Glucose in Urine N N       
pProteins  
VARCHAR2 50 
BYTE 
Count of Proteins in Urine N N       
pKetones  
VARCHAR2 50 
BYTE 
Count of Ketones in Urine N N       
pPh  
VARCHAR2 50 
BYTE 
Count of PH in Urine  N N       
pRbCells  
VARCHAR2 50 
BYTE 
Count of Red Blood Cells in Urine 
(/hpf) 
N N       
pWbCells  
VARCHAR2 50 
BYTE 
Count of White Blood Cells in Urine 
(/hpf) 
N N       
pBacteria  
VARCHAR2 50 
BYTE 
Count of Bacteria in Urine (/hpf) N N       
pCrystals  
VARCHAR2 50 
BYTE 
Count of Crystals in Urine (/hpf) N N       
pBladderCell  
VARCHAR2 50 
BYTE 
Count of Bladder Cells in Urine (/hpf) N N       
pSquamousCell  
VARCHAR2 50 
BYTE 
Count of Squamous Cells in Urine 
(/hpf)  
N N       
pTubularCell  
VARCHAR2 50 
BYTE 
Count of Tubular Cells in Urine (/hpf) N N       
pBroadCasts  
VARCHAR2 50 
BYTE 
Count of Broad Cast in Urine (/hpf) N N       
pEpithelialCast  
VARCHAR2 50 
BYTE 
Count of Epithelial Cell Casts in Urine 
(/hpf) 
N N       
pGranularCast  
VARCHAR2 50 
BYTE 
Count of Granular Casts in Urine 
(/hpf) 
N N       
pHyalineCast  
VARCHAR2 50 
BYTE 
Count of Hyaline Casts in Urine (/hpf) N N       
pRbcCast  
VARCHAR2 50 
BYTE 
Count of RBC Casts in Urine (/hpf) N N       
pWaxyCast  
VARCHAR2 50 
BYTE 
Count of Waxy Casts in Urine (/hpf) N N       
pWcCast  
VARCHAR2 50 
BYTE 
Count of WC Casts in Urine (/hpf) N N       
pAlbumin  
VARCHAR2 50 
BYTE 
Count of Albumin in Urine (/mg/dl) N N       
pPusCells  
VARCHAR2 50 
BYTE 
Count of PUS Cell N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
CHESTXRAY pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate DATE  Date of Laboratory for Chest X-Ray N N   YYYY-MM-DD    
pFindings  
VARCHAR2 3 
BYTE 
Chest X-ray Findings ID N N  lib_chestxray_findi
ngs 
    
pRemarksFindings  
VARCHAR2 2000 
BYTE 
Supplemental remarks on chest x-ray 
if with findings id == 99 
N N       
pObservation  
VARCHAR2 100 
BYTE 
Observations based on chest x–ray 
result ID 
N N  lib_chestxray_obse
rvation 
For multiple 
entry: Use semi-
colon “;” as 
delimiter  
   
pRemarksObservation  
VARCHAR2 2000 
BYTE 
Supplemental remarks for x-ray if 
with  observation id = 99 
N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
SPUTUM (Sputum 
Microscopy) pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  
DATE  Date of Laboratory for Sputum 
Microscopy 
N N   YYYY-MM-DD    
pDataCollection 
VARCHAR 1 
BYTE 
Sequence number of Sputum 
Microscopy Completed  
 
N N     X – Not 
Applicable 
1 – First Collection; 
2 – Second Collection; 
3 – Third Collection 
X – Not Applicable 
pFindings  
NUMBER  Findings/Result of Sputum 
Microscopy 
N N      1 – Essentially Normal; 
2 – With Findings  
pRemarks  
VARCHAR2 2000  
BYTE 
 N N       
pNoPlusses  
VARCHAR2 5 
BYTE 
Number of Plusses(+) N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
LIPIDPROFILE pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for Lipid Profile N N   YYYY-MM-DD    
pLdl  
VARCHAR2 50 
BYTE 
Value for LDL (mg/dL) N N       
pHdl  
VARCHAR2 50 
BYTE 
Value for HDL (mg/dL) N N       
pTotal  
VARCHAR2 50 
BYTE 
Total Value of Cholesterol (mg/dL) N N       
pCholesterol  
VARCHAR2 50 
BYTE 
Total Value of Cholesterol (mg/dL) N N       
pTriglycerides  
VARCHAR2 50 
BYTE 
Total Value of  Triglycerides (mg/dL) N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
FBS (Fasting Blood 
Sugar) pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate DATE  Date of Laboratory for FBS N N   YYYY-MM-DD    
pGlucoseMg  
VARCHAR2 50 
BYTE 
Value for Glucose in md/Dl  N N       
pGlucoseMmol  
VARCHAR2 50 
BYTE 
Value for Glucose in mmol/L N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
RBS (Random 
Blood Sugar) pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate DATE  Date of Laboratory for RBS N N   YYYY-MM-DD    
pGlucoseMg  
VARCHAR2 50 
BYTE 
Value for Glucose in md/Dl  N N       
pGlucoseMmol  
VARCHAR2 50 
BYTE 
Value for Glucose in mmol/L N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
ECG 
(Electrocardiogram
) 
pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  
DATE  Date of Laboratory for ECG N N   YYYY-MM-DD    
pFindings  
NUMBER  Findings/Result of ECG Laboratory N N      1 – Essentially Normal; 
2 – With Findings 
pRemarks  
VARCHAR2 1000 
BYTE 
Remarks if with Findings ( Findings = 
2) 
N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
FECALYSIS pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for Fecalysis N N   YYYY-MM-DD    
pColor  
NUMBER  Refer to the Color of Stool  N N      1 – Brown; 
2 – Black; 
3 – Red; 
4 – White/Grey; 
5 – Yellow; 
6 – Green; 
pConsistency  
NUMBER  Refer to the Consistency of Stool N N      1 – Soft; 
2 – Well-Formed; 
3 – Semi-Formed; 
4 – Watery; 
5 – Mucoid; 
6 – Hard  
pRbc  
VARCHAR2 50 
BYTE 
Value for RBC (/hpf) N N       
pWbc  
VARCHAR2 50 
BYTE 
Value for WBC(/hpf) N N       
pOva  
VARCHAR2 50 
BYTE 
Value for RBC (=/-) N N       
pParasite  
VARCHAR2 50 
BYTE 
Value for Parasite (=/-) N N       
pBlood  
NUMBER  Presence of Blood in Stool N N      “P“ – Present; 
“A“ – Absent  
pPusCells  
VARCHAR2 50 
BYTE 
Value for PUS Cells N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
PAPSMEAR pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory form Papsmear N N   YYYY-MM-DD    
pFindings  
VARCHAR2 500 
BYTE 
Findings/ Result in Papsmear N N       
pImpression  
VARCHAR2 500 
BYTE 
Impression in Papsmear N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
OGTT (Oral 
Glucose Tolerance 
Test) 
pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for OGTT N N   YYYY-MM-DD    
pExamFastingMg  
VARCHAR2 50 
BYTE 
Result in Fasting Examination (mg/dL) N N       
pExamFastingMmol 
VARCHAR2 50 
BYTE 
Result in Fasting Examination 
(mmol/L) 
N N       
pExamOgttOneHrMg  
VARCHAR2 50 
BYTE 
Result in OGTT 1 Hour Examination 
(mg/dL) 
N N       
pExamOgttOneHrMmol 
VARCHAR2 50 
BYTE 
Result in OGTT 1 Hour Examination 
(mmol/L) 
N N       
pExamOgttTwoHrMg  
VARCHAR2 50 
BYTE 
Result in OGTT 2 Hours Examination 
(mg/dL) 
N N       
pExamOgttTwoHrMmol  
VARCHAR2 50 
BYTE 
Result in OGTT 2 Hours Examination 
(mmol/L) 
N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
FOBT (Fecal Occult 
Blood Test) pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for FOBT N N   YYYY-MM-DD    
pFindings 
VARCHAR2 1 
BYTE 
Findings/ Result in FOBT N N      “P” – Positive 
“N” – Negative 
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
CREATININE pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for Creatinine N N   YYYY-MM-DD    
pFindings 
VARCHAR2 100 
BYTE 
Findings/ Result in Creatinine (mg/dL) N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
PPDTest pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for PPD Test N N   YYYY-MM-DD    
pFindings 
VARCHAR2 1 
BYTE 
Findings/ Result in PPD Test N N      “P” – Positive 
“N” – Negative 
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
HbA1c pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  DATE  Date of Laboratory for HbA1c N N   YYYY-MM-DD    
pFindings 
VARCHAR2 1000 
BYTE 
Findings/ Result in HbA1c 
(mmol/mol) 
N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
OTHERDIAGEXAM   pReferralFacility  
VARCHAR2 1000 
BYTE 
Name of Referral Facility, if referred N N       
pLabDate  
DATE  Date of Laboratory for Other 
Diagnostic Exam 
N N   YYYY-MM-DD    
pOthDiagExam 
VARCHAR2 1000 
BYTE 
Description of Other Diagnostic Exam 
not included in Essential Services 
N N       
pFindings 
VARCHAR2 1000
BYTE 
Findings/ Result in Other Diagnostic 
Exam 
N N       
pDateAdded  DATE  Date the Record was Added  N N   YYYY-MM-DD    
pStatus VARCHAR2 1 
BYTE 
Status of Laboratory/Imaging Results N N      “D” – Done 
“N” – Not yet done 
“X” – Deferred 
“W” – Waived  
pDiagnosticLabFee NUMBER  Diagnostic Lab Fee N N       
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
Y Y     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
DOCUMENT pHciCaseNo VARCHAR2 21 
BYTE 
Patient Transaction Reference 
Number 
N N FK Enlistment Table     
pHciTransNo VARCHAR2 21 
BYTE 
Profiling / SOAP Reference Number N N FK SOAP Table      
pPatientPin VARCHAR2 12 
BYTE 
Refer to Member’s PIN if patient type 
is MM; Refer to Dependent’s PIN if 
type is DD  
N N       
pPatientType VARCHAR2 2 
BYTE 
Patient Type N N      ”MM” – Member; 
”DD” – Dependent; 
pMemPin VARCHAR2 12 
BYTE 
Philhealth Identification Number 
(PIN) of Primary Member 
N N       
pDocumentType VARCHAR2 10 
BYTE 
Document attachment type N N      “EKAS” – electronic KonSulTa 
Slip 
“EPRESS” – electronic 
Prescription Slip” 
“OTH” - Others 
pDocumentUrl CLOB  URL of document attachment where 
can be downloaded 
N N       
 
 
 ISMD – ITMD 14 08/17/2022 
S
I
Z
E 
DESCRIPTION 
(Yes/No) 
REFERENCE FORMAT STANDARD DEFAULT VALID VALUES 
1 2 
 
 
pTransDate DATE  Date when the record inserted N N   YYYY-MM-DD    
pReportStatus VARCHAR2 1 
BYTE 
Report Status of Generated XML 
Report 
 
N N     ”U” – 
Unvalidated 
 
”V” – Validated 
”U” – Unvalidated 
”F” – Failed  
pDeficiencyRemarks  
VARCHAR2 2000 
BYTE 
Remarks of the Report Status N N       
 
Note:   
● All parameters highlighted with:  
● Updated parameters for Konsulta Report Data Dictionary Revision 14 
● Valid values are required for XML submission of the Konsulta first tranche. 
● Highlighted parameters under the DIAGNOSTICEXAMRESULT must be required if pMdiseaseCode under FAMHIST is ‘Diabetes Mellitus’ 
● For the DTD Validation, all pReportStatus parameters in the Konsulta first tranche XML must have the default value.  
● DOCUMENT parameters are not yet required and only included for future reference. 
 
        

# ANNEX B: SAMPLE KONSULTA XML REPORT (FIRST  TRANCHE)
 
<PCB pUsername="" pPassword="" pHciAccreNo="H90000001" pPMCCNo="P00001" pEnlistTotalCnt="1" 
pProfileTotalCnt="1" pSoapTotalCnt="1" pCertificationId="KON-DUMMYSCERTP00001" 
pHciTransmittalNumber="RH9000000120220800001"> 
  <ENLISTMENTS> 
    <ENLISTMENT pHciCaseNo="TH9000000120220800001" pHciTransNo="PH9000000120220800001" 
pEffYear="2022" pEnlistStat="1" pEnlistDate="2022-08-26" pPackageType="K" 
pMemPin="030263078507" pMemFname="MEMFIRSTNAME" pMemMname="MIDDLENAME" pMemLname="LASTNAME" 
pMemExtname="" pMemDob="1970-01-01" pPatientPin="242500004774" pPatientFname="DEPFIRSTNAME" 
pPatientMname="MIDDLENAME" pPatientLname="LASTNAME" pPatientExtname="" pPatientSex="M" 
pPatientDob="2021-08-01" pPatientType="DD" pPatientMobileNo="09090000000" 
pPatientLandlineNo="" pWithConsent="Y" pTransDate="2022-08-26" pCreatedBy="TEST01" 
pReportStatus="U" pDeficiencyRemarks=""/> 
  </ENLISTMENTS> 
  <PROFILING> 
    <PROFILE pHciTransNo="PH9000000120220800001" pHciCaseNo="TH9000000120220800001" 
pProfDate="2022-08-26" pPatientPin="242500004774" pPatientType="DD" pPatientAge="1 YR(S), 0 
MO(S), 25 DAY(S)" pMemPin="030263078507" pEffYear="2022" pATC="JruBaQ2Y" pIsWalkedIn="N" 
pTransDate="2022-08-27" pReportStatus="U" pDeficiencyRemarks=""> 
      <MEDHISTS> 
        <MEDHIST pMdiseaseCode="001" pReportStatus="U" pDeficiencyRemarks=""/> 
        <MEDHIST pMdiseaseCode="002" pReportStatus="U" pDeficiencyRemarks=""/> 
      </MEDHISTS> 
      <MHSPECIFICS> 
        <MHSPECIFIC pMdiseaseCode="001" pSpecificDesc="SAMPLE ALLERGY" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </MHSPECIFICS> 
      <SURGHISTS> 
        <SURGHIST pSurgDesc="SAMPLE OPERATION" pSurgDate="2022-06-01" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </SURGHISTS> 
      <FAMHISTS> 
        <FAMHIST pMdiseaseCode="002" pReportStatus="U" pDeficiencyRemarks=""/> 
        <FAMHIST pMdiseaseCode="006" pReportStatus="U" pDeficiencyRemarks=""/> 
      </FAMHISTS> 
      <FHSPECIFICS> 
        <FHSPECIFIC pMdiseaseCode="" pSpecificDesc="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </FHSPECIFICS> 
      <SOCHIST pIsSmoker="N" pNoCigpk="" pIsAdrinker="N" pNoBottles="" pIllDrugUser="N" 
pIsSexuallyActive="N" pReportStatus="U" pDeficiencyRemarks=""/> 
      <IMMUNIZATIONS> 
        <IMMUNIZATION pChildImmcode="C01" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="C02" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="C04" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="C08" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="C09" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="C13" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="999" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="" pPregwImmcode="999" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="999" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
      </IMMUNIZATIONS> 
  
 
        
      <MENSHIST pMenarchePeriod="0" pLastMensPeriod="" pPeriodDuration="0" 
pMensInterval="0" pPadsPerDay="0" pOnsetSexIc="0" pBirthCtrlMethod="" pIsMenopause="" 
pMenopauseAge="" pIsApplicable="N" pReportStatus="U" pDeficiencyRemarks=""/> 
      <PREGHIST pPregCnt="0" pDeliveryCnt="0" pDeliveryTyp="X" pFullTermCnt="0" 
pPrematureCnt="0" pAbortionCnt="0" pLivChildrenCnt="0" pWPregIndhyp="N" pWFamPlan="N" 
pIsApplicable="N" pReportStatus="U" pDeficiencyRemarks=""/> 
      <PEPERT pSystolic="95" pDiastolic="58" pHr="110" pRr="30" pTemp="36.10" pHeight="0" 
pWeight="8.9" pBMI="0" pZScore="&gt; +3SD" pLeftVision="20" pRightVision="20" pLength="63" 
pHeadCirc="46" pSkinfoldThickness="46" pWaist="48" pHip="50" pLimbs="40" 
pMidUpperArmCirc="" pReportStatus="U" pDeficiencyRemarks=""/> 
      <BLOODTYPE pBloodType="B+" pReportStatus="U" pDeficiencyRemarks=""/> 
      <PEGENSURVEY pGenSurveyId="1" pGenSurveyRem="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      <PEMISCS> 
        <PEMISC pSkinId="" pHeentId="11" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="8" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="5" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="7" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="99" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="3" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="1" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="6" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
      </PEMISCS> 
      <PESPECIFIC pSkinRem="" pHeentRem="" pChestRem="" pHeartRem="" pAbdomenRem="" 
pNeuroRem="" pRectalRem="" pGuRem="SAMPLE REMARKS" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      <NCDQANS pQid1_Yn="" pQid2_Yn="" pQid3_Yn="" pQid4_Yn="" pQid5_Ynx="" pQid6_Yn="" 
pQid7_Yn="" pQid8_Yn="" pQid9_Yn="" pQid10_Yn="" pQid11_Yn="" pQid12_Yn="" pQid13_Yn="" 
pQid14_Yn="" pQid15_Yn="" pQid16_Yn="" pQid17_Abcde="" pQid18_Yn="" pQid19_Yn="" 
pQid19_Fbsmg="" pQid19_Fbsmmol="" pQid19_Fbsdate="" pQid20_Yn="" pQid20_Choleval="" 
pQid20_Choledate="" pQid21_Yn="" pQid21_Ketonval="" pQid21_Ketondate="" pQid22_Yn="" 
pQid22_Proteinval="" pQid22_Proteindate="" pQid23_Yn="" pQid24_Yn="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
    </PROFILE> 
  </PROFILING> 
  <SOAPS> 
    <SOAP pHciCaseNo="" pHciTransNo="" pSoapDate="" pPatientPin="" pPatientType="" 
pMemPin="" pEffYear="" pATC="" pIsWalkedIn="" pCoPay="" pTransDate="" pReportStatus="U" 
pDeficiencyRemarks=""> 
      <SUBJECTIVE pIllnessHistory="" pSignsSymptoms="" pOtherComplaint="" pPainSite="" 
pReportStatus="U" pDeficiencyRemarks=""/> 
      <PEPERT pSystolic="" pDiastolic="" pHr="" pRr="" pTemp="" pHeight="" pWeight="" 
pBMI="" pZScore="" pLeftVision="" pRightVision="" pLength="" pHeadCirc="" 
pSkinfoldThickness="" pWaist="" pHip="" pLimbs="" pMidUpperArmCirc="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      <PEMISCS> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
      </PEMISCS> 
      <PESPECIFIC pSkinRem="" pHeentRem="" pChestRem="" pHeartRem="" pAbdomenRem="" 
pNeuroRem="" pRectalRem="" pGuRem="" pReportStatus="U" pDeficiencyRemarks=""/> 
      <ICDS> 
        <ICD pIcdCode="" pReportStatus="U" pDeficiencyRemarks=""/> 
      </ICDS> 
      <DIAGNOSTICS> 
        <DIAGNOSTIC pDiagnosticId="" pOthRemarks="" pIsPhysicianRecommendation="" 
pPatientRemarks="" pReportStatus="U" pDeficiencyRemarks=""/> 
      </DIAGNOSTICS> 
      <MANAGEMENTS> 
 
        
        <MANAGEMENT pManagementId="" pOthRemarks="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </MANAGEMENTS> 
      <ADVICE pRemarks="" pReportStatus="U" pDeficiencyRemarks=""/> 
    </SOAP> 
  </SOAPS> 
  <DIAGNOSTICEXAMRESULTS> 
    <DIAGNOSTICEXAMRESULT pHciCaseNo="TH9000000120220800001" 
pHciTransNo="PH9000000120220800001" pPatientPin="242500004774" pPatientType="DD" 
pMemPin="030263078507" pEffYear="2022"> 
      <FBSS> 
        <FBS pReferralFacility="SAMPLE REFERRAL FACILITY" pLabDate="2022-08-26" 
pGlucoseMg="45" pGlucoseMmol="7.8" pDateAdded="2022-08-27" pStatus="D" 
pDiagnosticLabFee="0.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </FBSS> 
      <RBSS> 
        <RBS pReferralFacility="" pLabDate="2022-08-26" pGlucoseMg="45" pGlucoseMmol="7.8" 
pDateAdded="2022-08-27" pStatus="D" pDiagnosticLabFee="0.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </RBSS> 
    </DIAGNOSTICEXAMRESULT> 
  </DIAGNOSTICEXAMRESULTS> 
  <MEDICINES> 
    <MEDICINE pHciCaseNo="" pHciTransNo="" pCategory="" pDrugCode="" pGenericCode="" 
pSaltCode="" pStrengthCode="" pFormCode="" pUnitCode="" pPackageCode="" pOtherMedicine="" 
pRoute="" pQuantity="" pActualUnitPrice="" pTotalAmtPrice="" pInstructionQuantity="" 
pInstructionStrength="" pInstructionFrequency="" pPrescribingPhysician="" pIsDispensed="" 
pDateDispensed="" pDispensingPersonnel="" pIsApplicable="" pDateAdded="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
  </MEDICINES> 
</PCB> 
        
 
  
 
        

# ANNEX C: SAMPLE KONSULTA XML REPORT (SECOND TRANCHE)
 
<PCB pUsername="" pPassword="" pHciAccreNo="H90000001" pPMCCNo="P00001" pEnlistTotalCnt="1" 
pProfileTotalCnt="1" pSoapTotalCnt="1" pCertificationId="KON-DUMMYSCERTP00001" 
pHciTransmittalNumber="RH9000000120220800002"> 
  <ENLISTMENTS> 
    <ENLISTMENT pHciCaseNo="TH9000000120220800002" pHciTransNo="EH9000000120220800002" 
pEffYear="2022" pEnlistStat="1" pEnlistDate="2022-08-26" pPackageType="K" 
pMemPin="030263078507" pMemFname="MEMFIRSTNAME" pMemMname="MIDDLENAME" pMemLname="LASTNAME" 
pMemExtname="" pMemDob="1995-02-14" pPatientPin="030263078507" pPatientFname="MEMFIRSTNAME" 
pPatientMname="MIDDLENAME" pPatientLname="LASTNAME" pPatientExtname="" pPatientSex="F" 
pPatientDob="1995-02-14" pPatientType="MM" pPatientMobileNo="09000000000" 
pPatientLandlineNo="" pWithConsent="Y" pTransDate="2022-08-31" pCreatedBy="TEST01" 
pReportStatus="U" pDeficiencyRemarks=""/> 
  </ENLISTMENTS> 
  <PROFILING> 
    <PROFILE pHciTransNo="PH9000000120220800002" pHciCaseNo="TH9000000120220800002" 
pProfDate="2022-08-26" pPatientPin="030263078507" pPatientType="MM" pPatientAge="27 YR(S), 
6 MO(S), 12 DAY(S)" pMemPin="030263078507" pEffYear="2022" pATC="WALKEDIN" pIsWalkedIn="Y" 
pTransDate="2022-08-31" pReportStatus="U" pDeficiencyRemarks=""> 
      <MEDHISTS> 
        <MEDHIST pMdiseaseCode="011" pReportStatus="U" pDeficiencyRemarks=""/> 
      </MEDHISTS> 
      <MHSPECIFICS> 
        <MHSPECIFIC pMdiseaseCode="011" pSpecificDesc="140 / 90 MMHG" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </MHSPECIFICS> 
      <SURGHISTS> 
        <SURGHIST pSurgDesc="SAMPLE SURGERY" pSurgDate="2010-08-01" pReportStatus="U" 
pDeficiencyRemarks=""/> 
        <SURGHIST pSurgDesc="SAMPLE SURGERY" pSurgDate="2012-10-01" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </SURGHISTS> 
      <FAMHISTS> 
        <FAMHIST pMdiseaseCode="006" pReportStatus="U" pDeficiencyRemarks=""/> 
        <FAMHIST pMdiseaseCode="011" pReportStatus="U" pDeficiencyRemarks=""/> 
      </FAMHISTS> 
      <FHSPECIFICS> 
        <FHSPECIFIC pMdiseaseCode="011" pSpecificDesc="140/90 MMHG" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </FHSPECIFICS> 
      <SOCHIST pIsSmoker="Y" pNoCigpk="10" pIsAdrinker="Y" pNoBottles="2" pIllDrugUser="Y" 
pIsSexuallyActive="Y" pReportStatus="U" pDeficiencyRemarks=""/> 
      <IMMUNIZATIONS> 
        <IMMUNIZATION pChildImmcode="999" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="Y01" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="Y02" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="" pPregwImmcode="999" 
pElderlyImmcode="" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="999" pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <IMMUNIZATION pChildImmcode="" pYoungwImmcode="" pPregwImmcode="" 
pElderlyImmcode="" pOtherImm="COVID VACCINE" pReportStatus="U" pDeficiencyRemarks=""/> 
      </IMMUNIZATIONS> 
      <MENSHIST pMenarchePeriod="13" pLastMensPeriod="2022-08-02" pPeriodDuration="5" 
pMensInterval="28" pPadsPerDay="5" pOnsetSexIc="19" pBirthCtrlMethod="none" 
pIsMenopause="N" pMenopauseAge="" pIsApplicable="Y" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      <PREGHIST pPregCnt="1" pDeliveryCnt="1" pDeliveryTyp="N" pFullTermCnt="1" 
pPrematureCnt="0" pAbortionCnt="0" pLivChildrenCnt="1" pWPregIndhyp="N" pWFamPlan="Y" 
pIsApplicable="Y" pReportStatus="U" pDeficiencyRemarks=""/> 
 
        
      <PEPERT pSystolic="140" pDiastolic="90" pHr="60" pRr="18" pTemp="36.20" pHeight="153" 
pWeight="49" pBMI="20.93" pZScore="" pLeftVision="125" pRightVision="150" pLength="" 
pHeadCirc="" pSkinfoldThickness="" pWaist="" pHip="" pLimbs="" pMidUpperArmCirc="" 
pReportStatus="U" pDeficiencyRemarks=""/> 
      <BLOODTYPE pBloodType="B+" pReportStatus="U" pDeficiencyRemarks=""/> 
      <PEGENSURVEY pGenSurveyId="1" pGenSurveyRem="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      <PEMISCS> 
        <PEMISC pSkinId="" pHeentId="11" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="6" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="6" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="3" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="7" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="8" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="4" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="9" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="99" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="3" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="99" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="7" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="10" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="99" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="6" 
pRectalId="" pGuId="" pReportStatus="U" pDeficiencyRemarks=""/> 
      </PEMISCS> 
      <PESPECIFIC pSkinRem="SAMPLE REMARKS" pHeentRem="" pChestRem="" pHeartRem="" 
pAbdomenRem="" pNeuroRem="" pRectalRem="SAMPLE REMARKS" pGuRem="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      <NCDQANS pQid1_Yn="Y" pQid2_Yn="Y" pQid3_Yn="Y" pQid4_Yn="Y" pQid5_Ynx="Y" 
pQid6_Yn="Y" pQid7_Yn="Y" pQid8_Yn="Y" pQid9_Yn="Y" pQid10_Yn="Y" pQid11_Yn="Y" 
pQid12_Yn="Y" pQid13_Yn="Y" pQid14_Yn="" pQid15_Yn="Y" pQid16_Yn="Y" pQid17_Abcde="D" 
pQid18_Yn="Y" pQid19_Yn="Y" pQid19_Fbsmg="126" pQid19_Fbsmmol="7" pQid19_Fbsdate="2022-08-
26" pQid20_Yn="Y" pQid20_Choleval="240" pQid20_Choledate="2022-08-26" pQid21_Yn="Y" 
pQid21_Ketonval="30" pQid21_Ketondate="2022-08-26 00:00:00" pQid22_Yn="Y" 
pQid22_Proteinval="150" pQid22_Proteindate="" pQid23_Yn="Y" pQid24_Yn="N" pReportStatus="U" 
pDeficiencyRemarks=""/> 
    </PROFILE> 
  </PROFILING> 
  <SOAPS> 
    <SOAP pHciCaseNo="TH9000000120220800002" pHciTransNo="SH9000000120220800002" 
pSoapDate="2022-08-27" pPatientPin="030263078507" pPatientType="MM" pMemPin="030263078507" 
pEffYear="2022" pATC="WALKEDIN" pIsWalkedIn="Y" pCoPay="0" pTransDate="2022-08-31" 
pReportStatus="U" pDeficiencyRemarks=""> 
      <SUBJECTIVE pIllnessHistory="SAMPLE HISTORY OF ILLNESS" pSignsSymptoms="37;38;X" 
pOtherComplaint="SAMPLE CHIEF COMPLAINT" pPainSite="HEAD" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      <PEPERT pSystolic="140" pDiastolic="90" pHr="60" pRr="18" pTemp="36.20" pHeight="153" 
pWeight="49" pBMI="20.93" pZScore="" pLeftVision="125" pRightVision="150" pLength="" 
pHeadCirc="" pSkinfoldThickness="" pWaist="" pHip="" pLimbs="" pMidUpperArmCirc="" 
pReportStatus="U" pDeficiencyRemarks=""/> 
      <PEMISCS> 
        <PEMISC pSkinId="" pHeentId="11" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
 
        
        <PEMISC pSkinId="" pHeentId="" pChestId="6" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="6" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="3" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="7" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="8" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="4" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="9" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="99" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="8" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="9" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="3" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="99" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="7" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="10" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="99" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
        <PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="6" 
pGuId="" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/> 
      </PEMISCS> 
      <PESPECIFIC pSkinRem="" pHeentRem="" pChestRem="" pHeartRem="" pAbdomenRem="" 
pNeuroRem="" pRectalRem="" pGuRem="" pReportStatus="U" pDeficiencyRemarks=""/> 
      <ICDS> 
        <ICD pIcdCode="E14.9" pReportStatus="U" pDeficiencyRemarks=""/> 
        <ICD pIcdCode="I10.9" pReportStatus="U" pDeficiencyRemarks=""/> 
      </ICDS> 
      <DIAGNOSTICS> 
        <DIAGNOSTIC pDiagnosticId="19" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="1" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="4" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="8" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="9" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="7" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="15" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="3" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="18" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="6" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="14" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="13" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="17" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
 
        
        <DIAGNOSTIC pDiagnosticId="5" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="2" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
        <DIAGNOSTIC pDiagnosticId="99" pOthRemarks="" pIsPhysicianRecommendation="Y" 
pPatientRemarks="RQ" pReportStatus="U" pDeficiencyRemarks=""/> 
      </DIAGNOSTICS> 
      <MANAGEMENTS> 
        <MANAGEMENT pManagementId="1" pOthRemarks="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
        <MANAGEMENT pManagementId="3" pOthRemarks="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
        <MANAGEMENT pManagementId="4" pOthRemarks="" pReportStatus="U" 
pDeficiencyRemarks=""/> 
        <MANAGEMENT pManagementId="X" pOthRemarks="SAMPLE MANAGEMENT" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </MANAGEMENTS> 
      <ADVICE pRemarks="SAMPLE REMARKS" pReportStatus="U" pDeficiencyRemarks=""/> 
    </SOAP> 
  </SOAPS> 
  <DIAGNOSTICEXAMRESULTS> 
    <DIAGNOSTICEXAMRESULT pHciCaseNo="TH9000000120220800002" 
pHciTransNo="PH9000000120220800002" pPatientPin="030263078507" pPatientType="MM" 
pMemPin="030263078507" pEffYear="2022"> 
      <FBSS> 
        <FBS pReferralFacility="SAMPLE PARTNER FACILITY" pLabDate="2022-08-26" 
pGlucoseMg="126" pGlucoseMmol="7" pDateAdded="2022-08-31" pStatus="D" 
pDiagnosticLabFee="80.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </FBSS> 
      <RBSS> 
        <RBS pReferralFacility="" pLabDate="2022-08-26" pGlucoseMg="126" pGlucoseMmol="7" 
pDateAdded="2022-08-31" pStatus="D" pDiagnosticLabFee="80.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </RBSS> 
    </DIAGNOSTICEXAMRESULT> 
    <DIAGNOSTICEXAMRESULT pHciCaseNo="TH9000000120220800002" 
pHciTransNo="SH9000000120220800002" pPatientPin="030263078507" pPatientType="MM" 
pMemPin="030263078507" pEffYear="2022"> 
      <CBCS> 
        <CBC pReferralFacility="" pLabDate="2022-08-27" pHematocrit="35" 
pHemoglobinG="11.9" pHemoglobinMmol="-" pMhcPg="32.5" pMhcFmol="-" pMchcGhb="32.5" 
pMchcMmol="-" pMcvUm="82.5" pMcvFl="-" pWbc1000="3.9" pWbc10="-" pMyelocyte="0" 
pNeutrophilsBnd="0-5" pNeutrophilsSeg="40-60" pLymphocytes="20-40" pMonocytes="4-8" 
pEosinophils="1-3" pBasophils="0-1" pPlatelet="200,000-500,000" pDateAdded="2022-08-31" 
pStatus="D" pDiagnosticLabFee="120.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </CBCS> 
      <URINALYSISS> 
        <URINALYSIS pReferralFacility="" pLabDate="2022-08-27" pGravity="1.015" 
pAppearance="clear" pColor="yellow" pGlucose="0" pProteins="0" pKetones="0" pPh="6" 
pRbCells="3" pWbCells="3" pBacteria="6" pCrystals="0" pBladderCell="0" pSquamousCell="0" 
pTubularCell="0" pBroadCasts="0" pEpithelialCast="0" pGranularCast="0" pHyalineCast="0" 
pRbcCast="0" pWaxyCast="0" pWcCast="0" pAlbumin="20" pPusCells="0" pDateAdded="2022-08-31 
17:53:29" pStatus="D" pDiagnosticLabFee="70.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </URINALYSISS> 
      <CHESTXRAYS> 
        <CHESTXRAY pReferralFacility="SAMPLE FACILITY" pLabDate="2022-08-27" pFindings="99" 
pRemarksFindings="SAMPLE REMARKS" pObservation="3;99" pRemarksObservation="" 
pDateAdded="2022-08-31" pStatus="D" pDiagnosticLabFee="100.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </CHESTXRAYS> 
      <SPUTUMS> 
        <SPUTUM pReferralFacility="" pLabDate="2022-08-27" pDataCollection="1" 
pFindings="2" pRemarks="SAMPLE FINDINGS" pNoPlusses="0" pDateAdded="2022-08-31" pStatus="D" 
pDiagnosticLabFee="120.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </SPUTUMS> 
      <LIPIDPROFILES> 
 
        
        <LIPIDPROFILE pReferralFacility="" pLabDate="2022-08-27" pLdl="80" pHdl="65" 
pTotal="" pCholesterol="160" pTriglycerides="145" pDateAdded="2022-08-31" pStatus="D" 
pDiagnosticLabFee="120.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </LIPIDPROFILES> 
      <FBSS> 
        <FBS pReferralFacility="" pLabDate="2022-08-27" pGlucoseMg="126" pGlucoseMmol="7" 
pDateAdded="2022-08-31" pStatus="D" pDiagnosticLabFee="80.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </FBSS> 
      <RBSS> 
        <RBS pReferralFacility="" pLabDate="2022-08-27" pGlucoseMg="126" pGlucoseMmol="7" 
pDateAdded="2022-08-31" pStatus="D" pDiagnosticLabFee="80.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </RBSS> 
      <ECGS> 
        <ECG pReferralFacility="" pLabDate="2022-08-27" pFindings="2" pRemarks="SAMPLE 
FINDINGS" pDateAdded="2022-08-31" pStatus="D" pDiagnosticLabFee="250.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </ECGS> 
      <FECALYSISS> 
        <FECALYSIS pReferralFacility="" pLabDate="2022-08-27" pColor="1" pConsistency="3" 
pRbc="0-1" pWbc="4-5" pOva="NOPS" pParasite="NOPS" pBlood="P" pPusCells="0-2" 
pDateAdded="2022-08-31" pStatus="D" pDiagnosticLabFee="60.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </FECALYSISS> 
      <PAPSMEARS> 
        <PAPSMEAR pReferralFacility="" pLabDate="2022-08-27" pFindings="SAMPLE FINDINGS" 
pImpression="SAMPLE IMPRESSION" pDateAdded="2022-08-31" pStatus="D" 
pDiagnosticLabFee="95.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </PAPSMEARS> 
      <OGTTS> 
        <OGTT pReferralFacility="" pLabDate="2022-08-27" pExamFastingMg="95" 
pExamFastingMmol="5.3" pExamOgttOneHrMg="180" pExamOgttOneHrMmol="10" 
pExamOgttTwoHrMg="140" pExamOgttTwoHrMmol="7.8" pDateAdded="2022-08-31" pStatus="D" 
pDiagnosticLabFee="120.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </OGTTS> 
      <FOBTS> 
        <FOBT pReferralFacility="" pLabDate="2022-08-27" pFindings="N" pDateAdded="2022-08-
31 17:53:30" pStatus="D" pDiagnosticLabFee="100.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </FOBTS> 
      <CREATININES> 
        <CREATININE pReferralFacility="" pLabDate="2022-08-27" pFindings="1.1" 
pDateAdded="2022-08-31" pStatus="D" pDiagnosticLabFee="120.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </CREATININES> 
      <PPDTests> 
        <PPDTest pReferralFacility="" pLabDate="2022-08-27" pFindings="N" pDateAdded="2022-
08-31" pStatus="D" pDiagnosticLabFee="100.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </PPDTests> 
      <HbA1cs> 
        <HbA1c pReferralFacility="SAMPLE FACILITY" pLabDate="2022-08-27" pFindings="42.1" 
pDateAdded="2022-08-31 17:53:30" pStatus="D" pDiagnosticLabFee="120.00" pReportStatus="U" 
pDeficiencyRemarks=""/> 
      </HbA1cs> 
      <OTHERDIAGEXAMS> 
        <OTHERDIAGEXAM pReferralFacility="SAMPLE FACILITY" pLabDate="2022-08-27" 
pOthDiagExam="other diagnostic" pFindings="" pDateAdded="2022-08-31" pStatus="D" 
pDiagnosticLabFee="60.00" pReportStatus="U" pDeficiencyRemarks=""/> 
      </OTHERDIAGEXAMS> 
    </DIAGNOSTICEXAMRESULT> 
  </DIAGNOSTICEXAMRESULTS> 
  <MEDICINES> 
    <MEDICINE pHciCaseNo="TH9000000120220800002" pHciTransNo="SH9000000120220800002" 
pCategory="-" pDrugCode="FELOD0000000069TAB490000000000" pGenericCode="FELOD" 
pSaltCode="00000" pStrengthCode="00069" pFormCode="TAB49" pUnitCode="00000" 
pPackageCode="00000" pOtherMedicine="" pOthMedDrugGrouping="" pRoute="" 
 
        
pQuantity="10.00" pActualUnitPrice="50.00" pTotalAmtPrice="500.00" pInstructionQuantity="1" 
pInstructionStrength="10 MG" pInstructionFrequency="" pPrescribingPhysician="SAMPLE 
PHYSICIAN" pIsDispensed="Y" pDateDispensed="2022-08-27" pDispensingPersonnel="SAMPLE 
DISPENSING PERSONNEL" pIsApplicable="Y" pDateAdded="2022-08-31" pReportStatus="U" 
pDeficiencyRemarks=""/> 
    <MEDICINE pHciCaseNo="TH9000000120220800002" pHciTransNo="SH9000000120220800002" 
pCategory="-" pDrugCode="" pGenericCode="" pSaltCode="" pStrengthCode="" pFormCode="" 
pUnitCode="" pPackageCode="" pOtherMedicine="SAMPLE ANTIBIOTICS" pOthMedDrugGrouping="NCD" 
pRoute="" pQuantity="10.00" pActualUnitPrice="20.00" pTotalAmtPrice="200.00" 
pInstructionQuantity="2" pInstructionStrength="N/A" pInstructionFrequency="" 
pPrescribingPhysician="SAMPLE PHYSICIAN" pIsDispensed="Y" pDateDispensed="2022-08-27" 
pDispensingPersonnel="SAMPLE DISPENSING PERSONNEL" pIsApplicable="Y" pDateAdded="2022-08-
31" pReportStatus="U" pDeficiencyRemarks=""/> 
  </MEDICINES> 
</PCB> 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
        

# ANNEX D: GUIDELINES FOR THE ENCRYPTION A ND DECRYPTION OF XML
GUIDELINES AND PROCE DURES  
 
 The application of HCI should encrypt input parameters that are supposed to be passed as XML. HCI 
applications should also decrypt all the output parameters that are supposed to be returned by PKA as 
XML. 
 The input and output parameters that are to be passed as XML text will be referred in this section as 
XML payload data. 
ENCRYPTION OF THE XM L PAYLOAD DATA   
 

# 1. The procedures for the encryption of the XML payload data will be similar to the procedures in the
encryption of the image files of the supporting documents of electronically submitted claims.  The 
difference is that encryption of the XML payload data will not use public-key encryption. 

# 2. The XML payload data will be encrypted using “AES-256-CBC” algorithm.

# 3. PhilHealth will issue the passphrase/password/cipher key to be used by each HCI. The password
should be hashed using SHA-256 algorithm.  The first 32 bytes of the hashed value should be passed 
as the password for the AES encryption.  If the resulting hashed value is less than 32-bytes, the value 
should be padded with ‘0x00’ or null character.   

# 4. An array of random 128 bytes should be used as the initialization vector.

# 5. Before encrypting the data, compute for the hash of file using SHA-256 hash method.  (This hash will
be compared to the hash that will be computed later after the file has been extracted on from 
decrypted file on PhilHealth side.  If the hash values match, it assures that the file has been encrypted 

# 6. The expected output of these encryption procedures is to be encoded in JSON.  The figure below
shows the expected key-value pairs that are to be included in the JSON text.   
a. The “docMimeType” key, should have fixed value of “<text/xml>”.   
b. The value for the “hash” item is the computed hash of the raw unencrypted XML text using 
the SHA-256 hash algorithm. 
c. The value for “key1” should be an empty string. 
d. The value for “key2” should also be set to empty string. 
e. The value for “iv” key should be the base-64 encoded value of the initialization vector 
mentioned in Step#6.   
f. The value for the “doc” key should the base-64 encoded value of the result of the AES-256 
encryption of the XML payload data. 
{ 
"docMimeType": "<text/xml>", 
"hash": "<SHA-256 hash of the XML text (before encryption)>", 
"key1" : "", 
"key2" : "", 
"iv" : "<Encoded in Base64 format, the public key encrypted initialization vector>", 
"doc" : "<Encoded in Base64 format, AES-256-CBC encrypted image file data> 
} 
Figure 1: Format/Layout of encrypted data  
 

# 7. SPs/HCIs may use their preferred programming language or tools in doing the encryption and
decryption. The development kit includes sample codes in C# and PHP.  For the sample source codes 
 
        
in PHP, the encryptXmlPayloadData method of the PhilHealthEClaimsEncryptor 
class contains an implementation of the encryption procedures outlined above. 
 
DECRYPTION OF THE XM L PAYLOAD DATA  
 
The decryption process is just the reverse of the encryption process outlined in previous section.For the 
service methods that are supposed to return an XML, PKA will encrypt the supposed XML data and 
return a text encoded in JSON whose key-value pairs as described in the previous section. 

# 1. After receiving the JSON text, the HCI application should parse it.

# 2. Get the value of the “iv” key.  That is the base-64 encoded value of the initialization vector used in
the AES-256 encryption of the XML payload data.  Decode the value of the initialization vector 
from base-64 encoding to its corresponding raw array of bytes. 

# 3. Get the password, passphrase or cipher key of the HCI.

# 4. Get the SHA-256 hash value of that value.  . If the length in bytes of the resulting hashed value is
less than 32, pad the value with ‘\0’’ or null character. 

# 5. Get the value of the “doc” key.  That value is the base-64 encoding of the encrypted data. Decode
the data from base-64 encoding to the raw array of bytes of the encrypted data,   With values of 
the passphrase, initialization vector and actual encrypted data, decrypt the data using AES-256-
CBC. 

# 6. You may get the hash value of the decrypted data and compare it with the value of the “hash” key.

# 7. After the decryption, the application of HCI may now process and parse the target XML data.
SPs/HCIs may use their preferred programming language or tools in doing the encryption and decryption. 
The development kit includes sample codes in C# and PHP.  For the sample source codes in PHP, the 
decryptPayloadDataToXmlmethod of the PhilHealthEClaimsEncryptor class contains an 
implementation of the decryption procedures outlined above. 
 
 
 
 
 
 
 
 
 
 
 
 
 
        

# ANNEX E: NON-DISCLOSURE AGREEMENT
 
 

 
        

# ANNEX F: SOFTWARE SOLUTION VALIDATION TEST FORM
 
 

 
        
 