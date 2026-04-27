<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$uxFileToEncrypt = '@Files/Input/SAMPLE_BIRTH_CERTIFICATE.pdf';
$uxMimeType = 'application/pdf';
$uxSaveFileName = '@Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingPHP.pdf.enc';
$logs = "";
$fileContents = "";
$uxPublicKeyFileName = '@Files/Input/pnpki_philhealth_eclaims_auth_cert.pem';
$uxPassword1 = "";
$uxPassword2 = "";
$uxIV = "";

if (filter_input(INPUT_POST, 'uxSubmit')) {
    $uxFileToEncrypt = filter_input(INPUT_POST, 'uxFileToEncrypt');
    $uxMimeType = filter_input(INPUT_POST, 'uxMimeType');
    $uxSaveFileName = filter_input(INPUT_POST, 'uxSaveFileName');
    $uxPublicKeyFileName = filter_input(INPUT_POST, 'uxPublicKeyFileName');
    $uxPassword1 = filter_input(INPUT_POST, 'uxPassword1');
    $uxPassword2 = filter_input(INPUT_POST, 'uxPassword2');
    $uxIV = filter_input(INPUT_POST, 'uxIV');

    $canEncrypt = false;
    if (!file_exists($uxFileToEncrypt)) {
        $logs = "Cannot find the file to be encrypted";
    } else if (!file_exists($uxPublicKeyFileName)) {
        $logs = "Cannot find the public key file";
    } else {
        $canEncrypt = true;
    }

    if ($canEncrypt) {
        include_once('PhilHealthEClaimsEncryptor.php');
        $publicKeyFileName = 'file://' . dirname(__FILE__) . '/' . $uxPublicKeyFileName;
        $encryptor = new PhilHealthEClaimsEncryptor();
        $encryptor->setPublicKeyFileName($publicKeyFileName);
        $encryptor->setLoggingEnabled(TRUE);
        $encryptor->setPassword1UsingHexStr($uxPassword1);
        $encryptor->setPassword2UsingHexStr($uxPassword2);
        $encryptor->setIVUsingHexStr($uxIV);
        $encryptor->encryptImageFile($uxFileToEncrypt, $uxMimeType, $uxSaveFileName);
        //$logs = implode("\n", $encryptor->getLogs());
        $logs = print_r($encryptor->getLogs(), true);
        $fileContents = file_get_contents($uxSaveFileName);
    }
}
?><!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=2.0">
        <title>Demo App for the Encryption of Supporting Documents of PhilHealth e-Claim</title>

        <style type="text/css" class="init"></style>
        <style>
            html, body {
                background-color: #fff;
                margin-left: 50px;
                margin-right: 50px;
            }    
            label{
                font-weight: bold;
                margin-top: 12x;
            }
            .labelbox{
                width: 250px !important;
                display: inline-block;
            }
            input[type=text]{
                width: 450px !important;
            }
            .logsbox{
                border: darkgray solid 1px;
            }
        </style>
    </head>
    <body>
        <h1>Demo App for the Encryption of Supporting Documents of PhilHealth e-Claim</h1>
        <form name="frmEncryptEClaimsImageFile" method="post">
            <div class="labelbox"><label>File To Encrypt:</label></div> 
            <input type="text" name="uxFileToEncrypt" value="<?php echo $uxFileToEncrypt ?>"><br />
            <div class="labelbox"><label>Mime Type:</label></div>  
            <input type="text" name="uxMimeType" value="<?php echo $uxMimeType ?>"><br />
            <div class="labelbox"><label>Name for the Encrypted File:</label></div>  
            <input type="text" name="uxSaveFileName" value="<?php echo $uxSaveFileName ?>"><br />
            <div class="labelbox"><label>Public Key File Name:</label></div>  
            <input type="text" name="uxPublicKeyFileName" value="<?php echo $uxPublicKeyFileName ?>"><br />
            <div class="labelbox"><label>Password1 in hex string:</label></div>  
            <input type="text" name="uxPassword1" value="<?php echo $uxPassword1 ?>"><br />
            <div class="labelbox"><label>Password2 in hex string:</label></div>  
            <input type="text" name="uxPassword2" value="<?php echo $uxPassword2 ?>"><br />
            <div class="labelbox"><label>IV in hex string:</label></div>  
            <input type="text" name="uxIV" value="<?php echo $uxIV ?>"><br />
            <input type="submit" name="uxSubmit" value="Encrypt"><br/>
        </form>
        <h1>Logs</h1>
        <div class="logsbox">
            <pre>
                <?php echo $logs ?>
            </pre>
        </div>

        <h1>Encrypted File Contents</h1>
        <textarea readonly="readonly" rows="10" style="width: 100%">
            <?php echo $fileContents ?>
        </textarea>
    </body>
</html>