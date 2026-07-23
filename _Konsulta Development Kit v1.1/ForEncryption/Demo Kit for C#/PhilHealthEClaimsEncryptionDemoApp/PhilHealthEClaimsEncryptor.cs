using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Script.Serialization;

namespace PhilHealthEClaimsEncryptionDemoApp
{

    public class PhilHealthEClaimsEncryptor
    {
        const bool UsesDummyInitVector = true;  //for debugging only
        const int CIPHER_KEY1_LEN = 16;
        const int CIPHER_KEY2_LEN = 16;
        const int CIPHER_KEY_LEN = CIPHER_KEY1_LEN + CIPHER_KEY2_LEN;
        const int CIPHER_IV_LEN = 16;
        public bool LoggingEnabled {get; set;}
        private PublicKey _publicKey = null;
        private string _publicKeyFileName = "";
        private List<string> _logs = new List<string>();

        public PhilHealthEClaimsEncryptor()
        {

        }
        public PhilHealthEClaimsEncryptor(string publicKeyFileName)
        {
            if (!string.IsNullOrEmpty(publicKeyFileName))
            {
                _publicKeyFileName = publicKeyFileName;
                _publicKey = ExtractPublicKey(_publicKeyFileName);
            }
        }

        public string PublicKeyFileName
        {
            get
            {
                return _publicKeyFileName;
            }
            set
            {
                _publicKeyFileName = value;
                _publicKey = ExtractPublicKey(_publicKeyFileName);
            }
        }

        public PublicKey PublicKey
        {
            get
            {
                return _publicKey;
            }
        }
        public void EncryptImageFile(string sourceFileName, string dataMimeType, string encryptedFileName)
        {
            if (!File.Exists(sourceFileName)) throw new Exception("The file " + sourceFileName + " does not exist!");

            Log("Encryption processed started.");

            Log("Reading contents of source file '" + HttpUtility.UrlEncode(sourceFileName) + "'...");
            var data = File.ReadAllBytes(sourceFileName);

            string encryptedDataJson = Encrypt(data, dataMimeType, null);

            //saves the encrypted data to file 
            Log("Saving the JSON string of the encrypted e-claim doc as '" + HttpUtility.UrlEncode(encryptedFileName) + "'...");
            File.WriteAllText(encryptedFileName, encryptedDataJson);

            Log("Deleting the original file...");
            File.Delete(sourceFileName);
        }

        /// <summary>
        /// Converts the XML string to ECWS encrypted data in JSON format
        /// </summary>
        /// <param name="xml"></param>
        /// <param name="passphrase"></param>
        /// <returns></returns>
        public string EncryptXmlPayload(string xml, string passphrase)
        {
            var data = Encoding.UTF8.GetBytes(xml);
            return Encrypt(data, "text/xml", passphrase);
        }

        private Dictionary<string, string> JsonToDictionary(string json)
        {
            return JsonConvert.DeserializeObject<Dictionary<string, string>>(json);
        }
        public string DecryptPayloadDataToXml(string encryptedDataAsJsonStr, string passphrase)
        {
            if (string.IsNullOrEmpty(encryptedDataAsJsonStr))
            {
                var up = new Exception("No data to be decrypted");
                throw up; 
            }


            var data = JsonToDictionary(encryptedDataAsJsonStr);

            var ivBase64 = data["iv"];
            var encryptedDataBase64 = data["doc"];

            var iv = System.Convert.FromBase64String(ivBase64);
            var encryptedData = System.Convert.FromBase64String(encryptedDataBase64);
            byte[] cipherKeyBytes = GetPassphraseHash(passphrase);

            var decryptedBytes = this.DecryptUsingAES(encryptedData, cipherKeyBytes, iv);

            string decryptedXml = Encoding.UTF8.GetString(decryptedBytes);

            return decryptedXml;
        }


        private byte[] GetPassphraseHash(string passphrase)
        {
            byte[] cipherKeyBytes = new byte[CIPHER_KEY_LEN];
            for (int i = 0; i < CIPHER_KEY_LEN; i++)
                cipherKeyBytes[i] = 0;
            byte[] passphraseBytes = Encoding.UTF8.GetBytes(passphrase);
            byte[] passphraseHashBytes = GetSHA256HashAsBytes(passphraseBytes);
            System.Buffer.BlockCopy(passphraseHashBytes,  0, cipherKeyBytes, 0, Math.Min(passphraseHashBytes.Length, CIPHER_KEY_LEN));
            return cipherKeyBytes;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="data">The data to be encrypted.  This can be the contents of the PDF file or the XML payload</param>
        /// <param name="dataMimeType">mime type of the </param>
        /// <param name="passphrase">For encrypting XML payload.  This should be null if the data to be encrypted is the PDF file of the supporting doc of an eclaim</param>
        /// <returns></returns>
        private string Encrypt(byte[] data, string dataMimeType, string passphrase)
        {
            string encryptedDataJson = "";
            var cont = new Dictionary<string, string>();

            Log("Generating random bytes for password for AES encryption...");
            //sets up a password with random bytes
            byte[] cipherKeyBytes = new byte[CIPHER_KEY_LEN];
            byte[] cipherKey1Bytes = new byte[0];
            byte[] cipherKey2Bytes = new byte[0];

            if (string.IsNullOrEmpty(passphrase))
            {
                cipherKey1Bytes = GetRandomBytes(CIPHER_KEY1_LEN);
                cipherKey2Bytes = GetRandomBytes(CIPHER_KEY2_LEN);
                cipherKeyBytes = cipherKey1Bytes.Concat(cipherKey2Bytes).ToArray();
            }
            else
            {
                cipherKeyBytes = GetPassphraseHash(passphrase);
            }


            //sets up random bytes for the initialization vector to be used for AES encryption
            Log("Generating 16 random bytes for initialization vector for AES encryption...");
            byte[] iv;
            if (UsesDummyInitVector)
            {
                iv = new byte[DummyInitVector.Length];
                System.Buffer.BlockCopy(DummyInitVector, 0, iv, 0, DummyInitVector.Length);
            }
            else
                iv = GetRandomBytes(CIPHER_IV_LEN);

            Log("Encrypting file content using 'AES-256-CBC'...");
            var encryptedData = EncryptUsingAES(data, cipherKeyBytes, iv);

            if (encryptedData.Length > 0)
            {
                Log("Getting the public key from the public key file '" + _publicKeyFileName + "'...");

                byte[] password1Encrypted = new byte[0];
                byte[] password2Encrypted = new byte[0];
                byte[] ivEncrypted = new byte[0];

                if (string.IsNullOrEmpty(passphrase))
                {
                    Log("Encryping the first part of password...");
                    EncryptUsingPublicKey(cipherKey1Bytes, out password1Encrypted);

                    Log("Encryping the second part of the password...");
                    EncryptUsingPublicKey(cipherKey2Bytes, out password2Encrypted);

                    Log("Encryping the initialization vector...");
                    EncryptUsingPublicKey(iv, out ivEncrypted);
                }else
                {
                    ivEncrypted = iv;
                }


                Log("Encoding the password and the initiaalization vector to base 64...");
                var password1EncryptedBase64 = System.Convert.ToBase64String(password1Encrypted);
                var password2EncryptedBase64 = System.Convert.ToBase64String(password2Encrypted);
                var ivEncryptedBaseBase64 = System.Convert.ToBase64String(ivEncrypted);

                Log("Computing the hash of the file using SHA256...");
                var sha256Hash = GetSHA256HashAsString(data);

                Log("Encoding the encrypted file content to base 64");
                var encryptedDataBase64 = System.Convert.ToBase64String(encryptedData);

                //builds the prescribed json data
                Log("Building the JSON string of the encrypted...");

                
                cont["docMimeType"] = dataMimeType;
                cont["hash"] = sha256Hash;
                cont["key1"] = password1EncryptedBase64;
                cont["key2"] = password2EncryptedBase64;
                cont["iv"] = ivEncryptedBaseBase64;
                cont["doc"] = encryptedDataBase64;

            }
            encryptedDataJson = ToJSON(cont);

            Log("Encryption processed finished.");
            return encryptedDataJson;
        }
        private void Log(string message)
        {
            if (LoggingEnabled)
            {
                _logs.Add(message);
            }
        }
        private byte[] GetRandomBytes(int count)
        {
            Random random = new Random();
            byte[] data = new byte[count];
            random.NextBytes(data);
            return data;
        }
        private string ToJSON(object data)
        {
            var serializer = new JavaScriptSerializer();
            serializer.MaxJsonLength = int.MaxValue;
            return serializer.Serialize(data);
        }
        private static string RepeatString(string str, int count)
        {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < count; i++)
            {
                sb.Append(str);
            }
            return sb.ToString();
        }
        private byte[] EncryptUsingAES(byte[] data, byte[] cipherKey, byte[] cipherIV)
        {
            byte[] encryptedBytes = null;
            using (AesManaged aes = new AesManaged())
            {
                aes.Padding = PaddingMode.Zeros;
                aes.KeySize = 256;
                aes.BlockSize = 128;
                aes.Mode = CipherMode.CBC;
                aes.IV = cipherIV;
                aes.Key = cipherKey;

                ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    {
                        cs.Write(data, 0, data.Length);
                    }
                    encryptedBytes = ms.ToArray();
                }
            }
            return encryptedBytes;
        }

        private byte[] DecryptUsingAES(byte[] data, byte[] cipherKey, byte[] cipherIv)
        {
            byte[] decryptedBytes = null;
            using (AesManaged aes = new AesManaged())
            {
                aes.Padding = PaddingMode.Zeros;
                aes.KeySize = 256;
                aes.BlockSize = 128;
                aes.Mode = CipherMode.CBC;
                aes.IV = cipherIv;
                aes.Key = cipherKey;

                ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Write))
                    {
                        cs.Write(data, 0, data.Length);
                    }
                    decryptedBytes = ms.ToArray();
                }
            }
            return decryptedBytes;
        }

        private PublicKey ExtractPublicKey(string publicKeyFileName)
        {
            X509Certificate2 myCertificate;
            try
            {
                myCertificate = new X509Certificate2(publicKeyFileName);
            }
            catch(Exception e)
            {
                throw new CryptographicException("Unable to open key file.", e);
            }
            return myCertificate.PublicKey;
        }

        private void EncryptUsingPublicKey(byte[] data, out byte[] encryptedData)
        {
            if (_publicKey == null) throw new Exception("Public key not found. Please set the PublicKeyFileName property.");

            encryptedData = null;

            RSACryptoServiceProvider rsaObj = (RSACryptoServiceProvider)_publicKey.Key;
            try
            {
                encryptedData = rsaObj.Encrypt(data, false);
            }
            catch(Exception e)
            {
                throw new CryptographicException("Unable to decrypt data.", e);
            }
        }
        private byte[]  GetSHA256HashAsBytes(byte[] data)
        {
            SHA256 crypt = SHA256Managed.Create();
            Log("Data to compute hash for:");
            Log(ToHexString(data));
            return crypt.ComputeHash(data);
        }

        private string ToHex(byte[] bytes)
        {
            var hex = new StringBuilder();
            foreach (byte byt in bytes)
            {
                hex.Append(byt.ToString("x2"));
            }
            return hex.ToString().ToLower();
        }

        private string GetSHA256HashAsString(byte[] data)
        {
            return ToHex(GetSHA256HashAsBytes(data));
        }

        private string ToHexString(byte[] data)
        {
            return BitConverter.ToString(data).Replace("-", string.Empty);
        }

        public List<string> GetLogs()
        {
            return _logs.ToList();
        }

        byte[] _dummyInitVector = null;
        private byte[] DummyInitVector
        {
            get
            {
                if (_dummyInitVector == null)
                {
                    _dummyInitVector  = Encoding.UTF8.GetBytes("0123456789ABCDEF");
                }
                return _dummyInitVector;
            }
        }
    }
}
