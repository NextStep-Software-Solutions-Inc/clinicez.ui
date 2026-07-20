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
    public class PhilHealthEClaimsDocEncryptor
    {
        const int PASSWORD1_LEN = 16;
        const int PASSWORD2_LEN = 16;
        const int IV_LEN = 16;
        public bool LoggingEnabled {get; set;}
        private PublicKey _publicKey;
        private string _publicKeyFileName;
        private List<string> _logs = new List<string>(); 

        public PhilHealthEClaimsDocEncryptor(string publicKeyFileName)
        {
            _publicKeyFileName = publicKeyFileName;
            _publicKey = ExtractPublicKey(_publicKeyFileName);
        }

        public void EncryptImageFile(string imageFileName, string sourceFileMimeType, string encryptedFileName)
        {
            if (!File.Exists(imageFileName)) throw new Exception("The file "+imageFileName+" does not exist!");

            Log("Encryption processed started.");
            var encryptedDocContent = "";

            Log("Reading contents of source file '" + HttpUtility.UrlEncode(imageFileName) + "'...");
            var data = File.ReadAllBytes(imageFileName);

            Log("Generating random bytes for password for AES encryption...");
            //sets up a password with random bytes
            var password1 = GetRandomBytes(PASSWORD1_LEN);
            var password2 = GetRandomBytes(PASSWORD2_LEN);

            var password = password1.Concat(password2).ToArray();

            //sets up random bytes for the initialization vector to be used for AES encryption
            Log("Generating 16 random bytes for initialization vector for AES encryption...");
            var iv = GetRandomBytes(IV_LEN);

            var options = 0;
            Log("Encrypting file content using 'AES-256-CBC'...");
            var encryptedData = EncryptUsingAES(data, password, options, iv);

            if (encryptedData.Length > 0)
            {
                Log("Getting the public key from the public key file '" + _publicKeyFileName + "'...");

                byte[] password1Encrypted = new byte[0];
                byte[] password2Encrypted = new byte[0];
                byte[] ivEncrypted = new byte[0];

                Log("Encryping the first part of password...");
                EncryptUsingPublicKey(password1, out password1Encrypted);

                Log("Encryping the second part of the password...");
                EncryptUsingPublicKey(password2, out password2Encrypted);

                Log("Encryping the initialization vector...");
                EncryptUsingPublicKey(iv, out ivEncrypted);

                Log("Encoding the password and the initiaalization vector to base 64...");
                var password1EncryptedBase64 = System.Convert.ToBase64String(password1Encrypted);
                var password2EncryptedBase64 = System.Convert.ToBase64String(password2Encrypted);
                var ivEncryptedBaseBase64 = System.Convert.ToBase64String(ivEncrypted);

                Log("Computing the hash of the file using SHA256...");
                var sha256Hash = ComputeHashUsingSHA256(data);

                Log("Encoding the encrypted file content to base 64");
                var encryptedDataBase64 = System.Convert.ToBase64String(encryptedData);

                //builds the prescribed json data
                Log("Building the JSON string of the encrypted e-claims doc...");

                var cont = new Dictionary<string, string>();
                cont["docMimeType"] = sourceFileMimeType;
                cont["hash"] = sha256Hash;
                cont["key1"] = password1EncryptedBase64;
                cont["key2"] = password2EncryptedBase64;
                cont["iv"] = ivEncryptedBaseBase64;
                cont["doc"] = encryptedDataBase64;

                encryptedDocContent = ToJSON(cont);

                //saves the encrypted data to file 
                Log("Saving the JSON string of the encrypted e-claim doc as '" + HttpUtility.UrlEncode(encryptedFileName) + "'...");
                File.WriteAllText(encryptedFileName, encryptedDocContent);

                Log("Deleting the original file...");
                File.Delete(imageFileName);
            }
            Log("Encryption processed finished.");
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
            return new JavaScriptSerializer().Serialize(data);
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
        private byte[] EncryptUsingAES(byte[] data, byte[] password, int options, byte[] iv)
        {
            byte[] encryptedBytes = null;
            using (AesManaged aes = new AesManaged())
            {
                aes.Padding = PaddingMode.Zeros;
                aes.KeySize = 256;
                aes.BlockSize = 128;
                aes.Mode = CipherMode.CBC;
                aes.IV = iv;
                aes.Key = password;

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
        private string ComputeHashUsingSHA256(byte[] data)
        {
            SHA256 crypt = SHA256Managed.Create();
            Log("Data to compute hash for:");
            Log(ToHexString(data));
            var hash = crypt.ComputeHash(data);
            var hex = new StringBuilder();
            foreach (byte byt in hash)
            {
                hex.Append(byt.ToString("x2"));
            }
            return hex.ToString();
        }

        private string ToHexString(byte[] data)
        {
            return BitConverter.ToString(data).Replace("-", string.Empty);
        }

        public List<string> GetLogs()
        {
            return _logs.ToList();
        }


    }
}
