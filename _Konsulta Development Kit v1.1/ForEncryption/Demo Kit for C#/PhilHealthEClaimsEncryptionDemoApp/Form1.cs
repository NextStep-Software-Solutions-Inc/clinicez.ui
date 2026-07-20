using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using PhilHealthEClaimsDocEncryptor.Helpers;
using System.IO;

namespace PhilHealthEClaimsEncryptionDemoApp
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (!File.Exists(uxFileToEncrypt.Text)) throw new FileNotFoundException("Cannot find the file to be encrypted", uxFileToEncrypt.Text);
            if (!File.Exists(uxPublicKeyFileName.Text)) throw new FileNotFoundException("Cannot find the indicated public key file ", uxPublicKeyFileName.Text);


            var encryptor = new PhilHealthEClaimsEncryptor(uxPublicKeyFileName.Text);
            encryptor.LoggingEnabled = true;
            encryptor.EncryptImageFile(uxFileToEncrypt.Text, uxMimeType.Text, uxSaveFileName.Text);
            uxLogs.Text = encryptor.GetLogs().ToStringLines();
            MessageBox.Show("Finished!");
        }

        private void button2_Click(object sender, EventArgs e)
        {
            if (fileToEncryptOpenDlg.ShowDialog().Equals(DialogResult.OK))
            {
                uxFileToEncrypt.Text = fileToEncryptOpenDlg.FileName;
            }
        }

        private void encryptedFileSaveDlgBtn_Click(object sender, EventArgs e)
        {
            if (encryptedFileSaveDlg.ShowDialog().Equals(DialogResult.OK))
            {
                uxSaveFileName.Text = encryptedFileSaveDlg.FileName;
            }
        }

        private void publicKeyFileOpenDlgBtn_Click(object sender, EventArgs e)
        {
            if (publicKeyFileOpenDlg.ShowDialog().Equals(DialogResult.OK))
            {
                uxPublicKeyFileName.Text = publicKeyFileOpenDlg.FileName;
            }
        }

        private void button2_Click_1(object sender, EventArgs e)
        {

        }

        private void encryptXmlBtn_Click(object sender, EventArgs e)
        {
            var encryptor = new PhilHealthEClaimsEncryptor();
            encryptor.LoggingEnabled = true;
            string json = encryptor.EncryptXmlPayload(uxXml.Text, uxPassphrase.Text);
            uxEncryptedXml.Text = json;
            uxLogs.Text = encryptor.GetLogs().ToStringLines();
            MessageBox.Show("Finished!");
        }

        private void tabPage2_Click(object sender, EventArgs e)
        {

        }

        private void uxDecryptXml_Click(object sender, EventArgs e)
        {
            var encryptor = new PhilHealthEClaimsEncryptor();
            encryptor.LoggingEnabled = true;
            string xml = encryptor.DecryptPayloadDataToXml(uxEncryptedXml.Text, uxPassphrase.Text);
            uxXml.Text = xml;
            uxLogs.Text = encryptor.GetLogs().ToStringLines();
            MessageBox.Show("Finished!");
        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void uxPublicKeyFileName_TextChanged(object sender, EventArgs e)
        {

        }
    }
}
