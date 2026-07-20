using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PhilHealthEClaimsDocEncryptor.Helpers
{
    public static class Utils
    {
        public static string Repeat(this string text, int count)
        {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < count; i++)
            {
                sb.Append(text);
            }
            return sb.ToString();
        }

        public static byte[] GenerateRandomBytes(int count)
        {
            Random random = new Random(DateTime.Now.Millisecond);
            byte[] data = new byte[count];
            random.NextBytes(data);
            return data; 
        }

        public static byte[] CreateByteArray(byte value, int count)
        {
            var arr = new byte[count];
            for (int i = 0; i < arr.Length; i++)
            {
                arr[i] = value;
            }
            return arr;
        }

        public static byte[] MergeByteArray(byte[] array1, byte[] array2)
        {
            int newSize = array1.Length + array2.Length;
            var ms = new MemoryStream(new byte[newSize], 0, newSize, true, true);
            ms.Write(array1, 0, array1.Length);
            ms.Write(array2, 0, array2.Length);
            return ms.GetBuffer();
        }

        public static string DumpText(byte[] data)
        {
            StringBuilder sb = new StringBuilder();
            string s = Encoding.UTF8.GetString(data);

            foreach(var ch in s){
                if(char.IsLetterOrDigit(ch)){
                    sb.Append(ch);
                }else if(ch.Equals('$')){
                    sb.Append("$$");
                }else{
                    sb.Append(string.Format("${0:x2}",(int)ch));
                }
            }
            return sb.ToString();
        }

        public static string ByteArrayToHexStr(byte[] data)
        {
            return BitConverter.ToString(data).Replace("-", string.Empty);
        }
        public static string ToStringLines(this List<string> list)
        {
            StringBuilder sb = new StringBuilder();
            foreach (var item in list)
            {
                sb.AppendLine(item);
            }
            return sb.ToString();
        }
    }
}
