<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of PhilHealthEClaimsDocEncryptor
 *
 * @author manny
 */
class PhilHealthEClaimsEncryptor
{
    const CIPHER_KEY1_LEN = 16;
    const CIPHER_KEY2_LEN = 16;
    const CIPHER_KEY_LEN = 32;
    const CIPHER_IV_LEN = 16;
    private $_loggingEnabled = false;
    private $_publicKey;
    private $_publicKeyFileName;
    private $_logs = array(); 
    
    public function getLoggingEnabled(){
        return $this->_loggingEnabled;
    }
    public function setLoggingEnabled($value){
        $this->_loggingEnabled = $value;
    }
    
    function PhilHealthEClaimsDocEncryptor()
    {
    }
    
    public function setPublicKeyFileName($publicKeyFileName)
    {
        $this->_publicKeyFileName = $publicKeyFileName;
        $this->_publicKey = $this->extractPublicKey($this->_publicKeyFileName);
    }
    

    public function encryptImageFile($sourceFileName, $sourceFileMimeType, $encryptedFileName)
    {
        if (!file_exists($sourceFileName)) throw new Exception("The file ".$sourceFileName." does not exist!");

        $this->log("Encryption processed started.");
        $encryptedDocContent = "";

        $this->log("Reading contents of source file '" . urlencode($sourceFileName) . "'...");
        $data = file_get_contents($sourceFileName);
        
        $encryptedDataJson = $this->encrypt($data, $sourceFileMimeType, null);
        $this->logErrors();

        if (strlen($encryptedDataJson) > 0)
        {
            //saves the encrypted data to file 
            $this->log("Saving the JSON string of the encrypted e-claim doc as '" . urlencode($encryptedFileName) + "'...");
            file_put_contents($encryptedFileName, $encryptedDataJson);

            $this->log("Deleting the original file...");
            unlink($sourceFileName);
        }
        $this->log("Encryption processed finished.");
    }
    
    public function encryptXmlPayloadData($xml, $passphrase)
    {
        return $this->encrypt($xml, "text/xml", $passphrase);
    }    

    public function decryptPayloadDataToXml($encryptedDataAsJsonStr, $passphrase)
    {
        $this->log("decryptXmlPayload:: passphrase: $passphrase " );
        if (empty($encryptedDataAsJsonStr))
        {
            $up = new Exception("No data to be decrypted");
            throw $up; 
        }


        $data = json_decode($encryptedDataAsJsonStr);

        $ivBase64 = $data->{"iv"};
        $encryptedDataBase64 = $data->{"doc"};

        $cipherIV = base64_decode($ivBase64, true);
        $encryptedData = base64_decode($encryptedDataBase64, true);
        
        $this->log("decryptXmlPayload:: encryptedData (hexits): ". $this->toHexString($encryptedData));
        
        $cipherKey = $this->getPassphraseHash($passphrase);
        
        $this->log("decryptXmlPayload:: cipherKeyBytes (base64) : ". base64_encode($cipherKey));
        
       

        $this->log("decryptXmlPayload:: cipherIV (base64): ". $ivBase64 );
        $this->log("decryptXmlPayload:: cipherIV len: ".strlen($cipherIV) .";  cipherIV: $cipherIV " );

        $decryptedXml = $this->decryptUsingAES($encryptedData, $cipherKey, $cipherIV);
        //truncates decrypted data up to the position of the null ('\0') character
        $nullCharPos = strpos($decryptedXml, "\0");
        if($nullCharPos >= 0){
            $decryptedXml = substr($decryptedXml,0, $nullCharPos); //msm2018-02-16:  Changed $nullCharPos-1 to $nullCharPos;
        }
        
        $this->log($this->toHexString($decryptedXml));
        $this->log("decryptXmlPayload: size of decrypted data: ". strlen($decryptedXml));
        return $decryptedXml;
    }    
    
    public function encrypt($data, $dataMimeType, $passphrase)
    {
        $encryptedDataJson = "";

        $this->log("Encryption processed started.");

        $cipherKey1Bytes = array();
        $cipherKey2Bytes = array();
        $cipherKeyBytes = array();
        

        $password1Encrypted = "";
        $password2Encrypted = "";

        
        if(empty($passphrase)){
            //sets up a password with random bytes
            $cipherKey1Bytes = $this->getPassword1();
            $cipherKey2Bytes = $this->getPassword2();
            $cipherKeyBytes = $cipherKey1Bytes . $cipherKey2Bytes;
        }else{
            $cipherKeyBytes = $this->getPassphraseHash($passphrase);
        }

        //sets up random bytes for the initialization vector to be used for AES encryption
        $iv = $this->getIV();
        
        $encryptedData = $this->encryptUsingAES($data, $cipherKeyBytes, $iv);
        $this->logErrors();

        if (strlen($encryptedData) > 0)
        {
            $ivEncrypted = array();

            if(empty($passphrase)){
                $this->log("Encryping the first half of password...");
                $this->encryptUsingPublicKey($cipherKey1Bytes, $password1Encrypted);
                $this->logErrors();


                $this->log("Encryping the second half of the password...");
                $this->encryptUsingPublicKey($cipherKey2Bytes, $password2Encrypted);
                $this->logErrors();
                
                $this->log("Encryping the initialization vector...");
                $this->encryptUsingPublicKey($iv, $ivEncrypted);
                $this->logErrors();
            }else{
                $ivEncrypted = $iv;
            }

            $this->log("Encoding the password and the initiaalization vector to base 64...");
            $password1EncryptedBase64 = base64_encode($password1Encrypted);
            $password2EncryptedBase64 = base64_encode($password2Encrypted);
            $ivEncryptedBaseBase64 = base64_encode($ivEncrypted);

            $this->log("Computing the hash of the file using SHA256...");
            $sha256Hash = $this->getSHA256HashAsString($data);

            $this->log("Encoding the encrypted file content to base 64");
            $encryptedDataBase64 = base64_encode($encryptedData);

            //builds the prescribed json data
            $this->log("Building the JSON string of the encrypted e-claims doc...");

            $cont = array();
            $cont["docMimeType"] = $dataMimeType;
            $cont["hash"] = $sha256Hash;
            $cont["key1"] = $password1EncryptedBase64;
            $cont["key2"] = $password2EncryptedBase64;
            $cont["iv"] = $ivEncryptedBaseBase64;
            $cont["doc"] = $encryptedDataBase64;

            $encryptedDataJson = $this->toJSON($cont);
            
        }
        $this->log("Encryption processed finished.");
        return $encryptedDataJson;
    }
    
    function getPassphraseHash($passphrase)
    {
        $cipherKey = array();
        $passphraseHash = $this->getSHA256HashAsRawBinaryData($passphrase); 
        $passphraseHashLen = strlen($passphraseHash);
        if($passphraseHashLen >= self::CIPHER_KEY_LEN){
            $cipherKey = substr($passphraseHash, 0, self::CIPHER_KEY_LEN);
        }else{
            $padLen = self::CIPHER_KEY_LEN - $passphraseHashLen;
            $padding = str_repeat("\0", $padLen);
            $cipherKey = $passphraseHashLen . $padding; 
        }
        return $cipherKey;
    }
        
    private function log($message)
    {
        if ($this->_loggingEnabled)
        {
            $this->_logs[] = $message;
        }
    }
    private function getRandomBytes($count)
    {
        return openssl_random_pseudo_bytes($count);
    }
    private function toJSON($data)
    {
        return json_encode($data);
    }
    private function repeatString($str, $count)
    {
        return str_repeat($str, $count);
    }
    private function encryptUsingAES($data, $cipherKey, $cipherIV)
    {
        $blockSizeInBits = 256;
        $method = "AES-{$blockSizeInBits}-CBC";
        $data = $this->pad($data, $blockSizeInBits/8);
        $options = OPENSSL_ZERO_PADDING + OPENSSL_RAW_DATA;
        //$options = OPENSSL_ZERO_PADDING;
        return openssl_encrypt($data, $method, $cipherKey, $options, $cipherIV);
    }
    private function decryptUsingAES($data, $cipherKey, $cipherIV)
    {
        $blockSizeInBits = 256;
        $method = "AES-{$blockSizeInBits}-CBC";
        $data = $this->pad($data, $blockSizeInBits/8);
        $options = OPENSSL_ZERO_PADDING + OPENSSL_RAW_DATA;
        //$options = OPENSSL_ZERO_PADDING;
        $this->log("decryptUsingAES:: cipherIV len: ".strlen($cipherIV) ."; cipherIV: $cipherIV");
        $this->log("decryptUsingAES:: cipherKey len: ".strlen($cipherKey) ."; cipherKey (Base64): " . base64_encode($cipherKey));

        $decryptedData = openssl_decrypt($data, $method, $cipherKey, $options, $cipherIV);
        $this->log('decryptUsingAES: size of decrypted data: '. strlen($decryptedData));
        return $decryptedData;
    }
    private function extractPublicKey($publicKeyFileName)
    {
        return openssl_get_publickey($publicKeyFileName);
    }
    private function encryptUsingPublicKey($data, &$encryptedData)
    {
        return openssl_public_encrypt($data, $encryptedData, $this->_publicKey);
    }
    private function getSHA256HashAsString($data)
    {
        return hash("sha256", $data);
    }

    private function getSHA256HashAsRawBinaryData($data)
    {
        $rawBinaryData = hash("sha256", $data, true);
        return $rawBinaryData;
    }

    private function toHexString($data)
    {
        return bin2hex($data);
    }

    public function getLogs()
    {
        return $this->_logs;
    }
  
    public function logErrors(){
        if($this->getLoggingEnabled()){
            while (($e = openssl_error_string()) !== false) {
                $this->log($e);
            }
        }
    }    
    private $_password1 = "";
    private $_password2 = "";
    private $_iv = "";

    public function setPassword1UsingHexStr($value)
    {
        $this->_password1 = hex2bin($value);
    }
    public function setPassword2UsingHexStr($value)
    {
        $this->_password2 = hex2bin($value);
    }
    public function setIVUsingHexStr($value)
    {
        $this->_iv = hex2bin($value);
    }
    public function getPassword1() {
        if(empty($this->_password1)){
            $this->log("Generating random bytes for password1 for AES encryption...");
            $this->_password1 = $this->getRandomBytes(self::CIPHER_KEY1_LEN); 
        }
        return $this->_password1;
    }
    public function getPassword2() {
        if(empty($this->_password2)){
            $this->log("Generating random bytes for password1 for AES encryption...");
            $this->_password2 = $this->getRandomBytes(self::CIPHER_KEY1_LEN); 
        }
        return $this->_password2;
    }
    public function getIV() {
        if(empty($this->_iv)){
            $this->log("Generating 16 random bytes for initialization vector for AES encryption...");
            $this->_iv = $this->getRandomBytes(self::CIPHER_IV_LEN); 
        }
        return $this->_iv;
    }
    public function resetPasswordAndIV(){
        $this->_password1 = "";
        $this->_password2 = "";
        $this->_iv = "";
    }
    
    public function pad($string, $blockSizeInBits = 32) {
        $pad = $blockSizeInBits - (strlen($string) % $blockSizeInBits);
        return $string . str_repeat(chr(0), $pad - 1) . chr($pad);
    }     
}
?>