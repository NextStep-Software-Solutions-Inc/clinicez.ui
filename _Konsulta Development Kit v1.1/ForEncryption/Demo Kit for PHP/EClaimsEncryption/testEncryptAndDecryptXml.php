<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once 'PhilHealthEClaimsEncryptor.php';

$decrypt = filter_input(INPUT_POST, 'decrypt') ;
$encrypt = filter_input(INPUT_POST, 'encrypt') ;

$isFromPost = isset($decrypt) || isset($encrypt);

$model = array();
$model['cipherIv'] = filter_input(INPUT_POST, 'cipherIv');
$model['logs'] = array();
$model['encryptedDataAsJson'] =  filter_input(INPUT_POST, 'encryptedDataAsJson') ;
$model['dataAsXml'] = filter_input(INPUT_POST, 'dataAsXml');

if($isFromPost){
    $model['cipherPassphrase'] = filter_input(INPUT_POST, 'cipherPassphrase') ;
}else{
    $model['cipherPassphrase'] = '123456';
}

if($isFromPost){
    try{
        if($decrypt){
            $decryptor = new PhilHealthEClaimsEncryptor();
            $decryptor->setLoggingEnabled(true);
            $model['dataAsXml'] = $decryptor->decryptPayloadDataToXml($model['encryptedDataAsJson'], $model['cipherPassphrase']);

            //$model['xml'] = htmlentities($model['xml']);

            array($model['logs'], $decryptor->getLogs());
        }else if($encrypt){
            $encryptor = new PhilHealthEClaimsEncryptor();
            $encryptor->setLoggingEnabled(true);
            $model['encryptedDataAsJson'] = $encryptor->encryptXmlPayloadData($model['dataAsXml'], $model['cipherPassphrase']);
            //$model['xml'] = htmlentities($model['xml']);
            array_push($model['logs'], $encryptor->getLogs());
        }
    }catch(Exception $e){
        $model['logs'][] = $e->getMessage();
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
    <title>Test Encryption/Decryption of ECWS XML Payload</title>

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
    </style>
</head>
<body>
    <h1>Test Encryption/Decryption of PECWS XML Payload Data</h1>
    <form method="post">
        <label>Cipher IV</label>
        <br/>
        <input type="text" name="cipherIv" value="<?= $model['cipherIv'] ?>" /> 
        <br/>

        <label>Cipher Passphrase</label>
        <br/>
        <input type="text" name="cipherPassphrase" value="<?= $model['cipherPassphrase'] ?>" /> 
        <br/>

        <label>Encrypted ECWS XML Payload (JSON format)</label>
        <br/>
        <textarea rows="10" cols="100" name="encryptedDataAsJson">
            <?= htmlentities($model['encryptedDataAsJson']); ?>
        </textarea>
        <br />
        <button type="submit" name="decrypt" value="decrypt">Decrypt</button>
        <br/>

        <label>Decrypted/Plain XML</label>
        <br/>
        <textarea rows="10" cols="100" name="dataAsXml">
            <?= htmlentities($model['dataAsXml']); ?>
        </textarea>
        <br/>
        <button type="submit" name="encrypt" value="encrypt">Encrypt</button>
        <br/>

    </form>    

    <label>Logs</label>
    <div class="logsbox">
        <pre>
            <?php  echo implode('<br />', $model['logs']);  //echo implode('<br />', $model['logs']);    ?>
        </pre>
    </div>
</body>
</html>