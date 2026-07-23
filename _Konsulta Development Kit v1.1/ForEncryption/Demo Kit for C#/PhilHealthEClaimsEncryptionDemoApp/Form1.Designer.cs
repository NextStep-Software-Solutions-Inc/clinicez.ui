namespace PhilHealthEClaimsEncryptionDemoApp
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.uxLogs = new System.Windows.Forms.TextBox();
            this.tabControl1 = new System.Windows.Forms.TabControl();
            this.tabPage1 = new System.Windows.Forms.TabPage();
            this.publicKeyFileOpenDlgBtn = new System.Windows.Forms.Button();
            this.encryptedFileSaveDlgBtn = new System.Windows.Forms.Button();
            this.fileToEncryptOpenDlgBtn = new System.Windows.Forms.Button();
            this.uxPublicKeyFileName = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.uxSaveFileName = new System.Windows.Forms.TextBox();
            this.uxSave = new System.Windows.Forms.Label();
            this.uxMimeType = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.uxFileToEncrypt = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.button1 = new System.Windows.Forms.Button();
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.uxDecryptXml = new System.Windows.Forms.Button();
            this.encryptXmlBtn = new System.Windows.Forms.Button();
            this.label7 = new System.Windows.Forms.Label();
            this.uxEncryptedXml = new System.Windows.Forms.RichTextBox();
            this.uxPassphrase = new System.Windows.Forms.TextBox();
            this.label6 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.uxXml = new System.Windows.Forms.RichTextBox();
            this.encryptedFileSaveDlg = new System.Windows.Forms.SaveFileDialog();
            this.fileToEncryptOpenDlg = new System.Windows.Forms.OpenFileDialog();
            this.publicKeyFileOpenDlg = new System.Windows.Forms.OpenFileDialog();
            this.label4 = new System.Windows.Forms.Label();
            this.tabControl1.SuspendLayout();
            this.tabPage1.SuspendLayout();
            this.tabPage2.SuspendLayout();
            this.SuspendLayout();
            // 
            // uxLogs
            // 
            this.uxLogs.Location = new System.Drawing.Point(12, 331);
            this.uxLogs.Multiline = true;
            this.uxLogs.Name = "uxLogs";
            this.uxLogs.ScrollBars = System.Windows.Forms.ScrollBars.Both;
            this.uxLogs.Size = new System.Drawing.Size(879, 74);
            this.uxLogs.TabIndex = 10;
            // 
            // tabControl1
            // 
            this.tabControl1.Controls.Add(this.tabPage1);
            this.tabControl1.Controls.Add(this.tabPage2);
            this.tabControl1.Location = new System.Drawing.Point(12, 24);
            this.tabControl1.Name = "tabControl1";
            this.tabControl1.SelectedIndex = 0;
            this.tabControl1.Size = new System.Drawing.Size(883, 279);
            this.tabControl1.TabIndex = 9;
            // 
            // tabPage1
            // 
            this.tabPage1.Controls.Add(this.publicKeyFileOpenDlgBtn);
            this.tabPage1.Controls.Add(this.encryptedFileSaveDlgBtn);
            this.tabPage1.Controls.Add(this.fileToEncryptOpenDlgBtn);
            this.tabPage1.Controls.Add(this.uxPublicKeyFileName);
            this.tabPage1.Controls.Add(this.label3);
            this.tabPage1.Controls.Add(this.uxSaveFileName);
            this.tabPage1.Controls.Add(this.uxSave);
            this.tabPage1.Controls.Add(this.uxMimeType);
            this.tabPage1.Controls.Add(this.label2);
            this.tabPage1.Controls.Add(this.uxFileToEncrypt);
            this.tabPage1.Controls.Add(this.label1);
            this.tabPage1.Controls.Add(this.button1);
            this.tabPage1.Location = new System.Drawing.Point(4, 22);
            this.tabPage1.Name = "tabPage1";
            this.tabPage1.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage1.Size = new System.Drawing.Size(875, 253);
            this.tabPage1.TabIndex = 0;
            this.tabPage1.Text = "e-Claims Doc Encryption";
            this.tabPage1.UseVisualStyleBackColor = true;
            // 
            // publicKeyFileOpenDlgBtn
            // 
            this.publicKeyFileOpenDlgBtn.Location = new System.Drawing.Point(625, 156);
            this.publicKeyFileOpenDlgBtn.Name = "publicKeyFileOpenDlgBtn";
            this.publicKeyFileOpenDlgBtn.Size = new System.Drawing.Size(29, 20);
            this.publicKeyFileOpenDlgBtn.TabIndex = 18;
            this.publicKeyFileOpenDlgBtn.Text = "...";
            this.publicKeyFileOpenDlgBtn.UseVisualStyleBackColor = true;
            this.publicKeyFileOpenDlgBtn.Click += new System.EventHandler(this.publicKeyFileOpenDlgBtn_Click);
            // 
            // encryptedFileSaveDlgBtn
            // 
            this.encryptedFileSaveDlgBtn.Location = new System.Drawing.Point(625, 121);
            this.encryptedFileSaveDlgBtn.Name = "encryptedFileSaveDlgBtn";
            this.encryptedFileSaveDlgBtn.Size = new System.Drawing.Size(29, 20);
            this.encryptedFileSaveDlgBtn.TabIndex = 17;
            this.encryptedFileSaveDlgBtn.Text = "...";
            this.encryptedFileSaveDlgBtn.UseVisualStyleBackColor = true;
            this.encryptedFileSaveDlgBtn.Click += new System.EventHandler(this.encryptedFileSaveDlgBtn_Click);
            // 
            // fileToEncryptOpenDlgBtn
            // 
            this.fileToEncryptOpenDlgBtn.Location = new System.Drawing.Point(625, 42);
            this.fileToEncryptOpenDlgBtn.Name = "fileToEncryptOpenDlgBtn";
            this.fileToEncryptOpenDlgBtn.Size = new System.Drawing.Size(29, 20);
            this.fileToEncryptOpenDlgBtn.TabIndex = 16;
            this.fileToEncryptOpenDlgBtn.Text = "...";
            this.fileToEncryptOpenDlgBtn.UseVisualStyleBackColor = true;
            this.fileToEncryptOpenDlgBtn.Click += new System.EventHandler(this.button2_Click);
            // 
            // uxPublicKeyFileName
            // 
            this.uxPublicKeyFileName.Location = new System.Drawing.Point(189, 156);
            this.uxPublicKeyFileName.Name = "uxPublicKeyFileName";
            this.uxPublicKeyFileName.Size = new System.Drawing.Size(430, 20);
            this.uxPublicKeyFileName.TabIndex = 15;
            this.uxPublicKeyFileName.Text = "..\\..\\@Files\\Input\\pnpki_philhealth_eclaims_auth_cert.pem";
            this.uxPublicKeyFileName.TextChanged += new System.EventHandler(this.uxPublicKeyFileName_TextChanged);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(51, 159);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(107, 13);
            this.label3.TabIndex = 14;
            this.label3.Text = "Public Key File Name";
            // 
            // uxSaveFileName
            // 
            this.uxSaveFileName.Location = new System.Drawing.Point(189, 121);
            this.uxSaveFileName.Name = "uxSaveFileName";
            this.uxSaveFileName.Size = new System.Drawing.Size(430, 20);
            this.uxSaveFileName.TabIndex = 13;
            this.uxSaveFileName.Text = "..\\..\\@Files\\Output\\SAMPLE_BIRTH_CERTIFICATE-usingCSharp.pdf.enc";
            // 
            // uxSave
            // 
            this.uxSave.AutoSize = true;
            this.uxSave.Location = new System.Drawing.Point(51, 124);
            this.uxSave.Name = "uxSave";
            this.uxSave.Size = new System.Drawing.Size(141, 13);
            this.uxSave.TabIndex = 12;
            this.uxSave.Text = "Name for the Encrypted File ";
            // 
            // uxMimeType
            // 
            this.uxMimeType.Location = new System.Drawing.Point(189, 83);
            this.uxMimeType.Name = "uxMimeType";
            this.uxMimeType.Size = new System.Drawing.Size(430, 20);
            this.uxMimeType.TabIndex = 11;
            this.uxMimeType.Text = "application/pdf";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(51, 86);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(59, 13);
            this.label2.TabIndex = 10;
            this.label2.Text = "Mime Type";
            // 
            // uxFileToEncrypt
            // 
            this.uxFileToEncrypt.Location = new System.Drawing.Point(189, 42);
            this.uxFileToEncrypt.Name = "uxFileToEncrypt";
            this.uxFileToEncrypt.Size = new System.Drawing.Size(430, 20);
            this.uxFileToEncrypt.TabIndex = 9;
            this.uxFileToEncrypt.Text = "..\\..\\@Files\\Input\\SAMPLE_BIRTH_CERTIFICATE.pdf";
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(51, 45);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(78, 13);
            this.label1.TabIndex = 8;
            this.label1.Text = "File To Encrypt";
            this.label1.Click += new System.EventHandler(this.label1_Click);
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(189, 199);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(87, 25);
            this.button1.TabIndex = 7;
            this.button1.Text = "Encrypt";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click);
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.uxDecryptXml);
            this.tabPage2.Controls.Add(this.encryptXmlBtn);
            this.tabPage2.Controls.Add(this.label7);
            this.tabPage2.Controls.Add(this.uxEncryptedXml);
            this.tabPage2.Controls.Add(this.uxPassphrase);
            this.tabPage2.Controls.Add(this.label6);
            this.tabPage2.Controls.Add(this.label5);
            this.tabPage2.Controls.Add(this.uxXml);
            this.tabPage2.Location = new System.Drawing.Point(4, 22);
            this.tabPage2.Margin = new System.Windows.Forms.Padding(2);
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.Padding = new System.Windows.Forms.Padding(2);
            this.tabPage2.Size = new System.Drawing.Size(875, 253);
            this.tabPage2.TabIndex = 1;
            this.tabPage2.Text = "e-Claimss XML Payload Encryption";
            this.tabPage2.UseVisualStyleBackColor = true;
            this.tabPage2.Click += new System.EventHandler(this.tabPage2_Click);
            // 
            // uxDecryptXml
            // 
            this.uxDecryptXml.Location = new System.Drawing.Point(3, 162);
            this.uxDecryptXml.Name = "uxDecryptXml";
            this.uxDecryptXml.Size = new System.Drawing.Size(87, 25);
            this.uxDecryptXml.TabIndex = 17;
            this.uxDecryptXml.Text = "Decrypt";
            this.uxDecryptXml.UseVisualStyleBackColor = true;
            this.uxDecryptXml.Click += new System.EventHandler(this.uxDecryptXml_Click);
            // 
            // encryptXmlBtn
            // 
            this.encryptXmlBtn.Location = new System.Drawing.Point(3, 46);
            this.encryptXmlBtn.Name = "encryptXmlBtn";
            this.encryptXmlBtn.Size = new System.Drawing.Size(87, 25);
            this.encryptXmlBtn.TabIndex = 16;
            this.encryptXmlBtn.Text = "Encrypt";
            this.encryptXmlBtn.UseVisualStyleBackColor = true;
            this.encryptXmlBtn.Click += new System.EventHandler(this.encryptXmlBtn_Click);
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(5, 137);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(80, 13);
            this.label7.TabIndex = 15;
            this.label7.Text = "Encrypted XML";
            // 
            // uxEncryptedXml
            // 
            this.uxEncryptedXml.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.uxEncryptedXml.Font = new System.Drawing.Font("Consolas", 10F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.uxEncryptedXml.Location = new System.Drawing.Point(104, 137);
            this.uxEncryptedXml.Margin = new System.Windows.Forms.Padding(2);
            this.uxEncryptedXml.Name = "uxEncryptedXml";
            this.uxEncryptedXml.Size = new System.Drawing.Size(738, 106);
            this.uxEncryptedXml.TabIndex = 14;
            this.uxEncryptedXml.Text = "";
            // 
            // uxPassphrase
            // 
            this.uxPassphrase.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.uxPassphrase.Location = new System.Drawing.Point(104, 114);
            this.uxPassphrase.Name = "uxPassphrase";
            this.uxPassphrase.PasswordChar = '*';
            this.uxPassphrase.Size = new System.Drawing.Size(738, 20);
            this.uxPassphrase.TabIndex = 13;
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Location = new System.Drawing.Point(5, 114);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(62, 13);
            this.label6.TabIndex = 12;
            this.label6.Text = "Passphrase";
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(5, 20);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(80, 13);
            this.label5.TabIndex = 9;
            this.label5.Text = "XML to Encrypt";
            // 
            // uxXml
            // 
            this.uxXml.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.uxXml.Font = new System.Drawing.Font("Consolas", 10F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.uxXml.Location = new System.Drawing.Point(104, 20);
            this.uxXml.Margin = new System.Windows.Forms.Padding(2);
            this.uxXml.Name = "uxXml";
            this.uxXml.Size = new System.Drawing.Size(738, 89);
            this.uxXml.TabIndex = 0;
            this.uxXml.Text = "";
            // 
            // encryptedFileSaveDlg
            // 
            this.encryptedFileSaveDlg.Filter = "Encrypted PhilHealth e-Claims doc file|*.enc|All files|*.*";
            // 
            // fileToEncryptOpenDlg
            // 
            this.fileToEncryptOpenDlg.FileName = "openFileDialog1";
            this.fileToEncryptOpenDlg.Filter = "PDF files|*.pdf|All files|*.*";
            // 
            // publicKeyFileOpenDlg
            // 
            this.publicKeyFileOpenDlg.FileName = "openFileDialog2";
            this.publicKeyFileOpenDlg.Filter = "PEM files|*.pem|All files|*.*";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Font = new System.Drawing.Font("Microsoft Sans Serif", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.Location = new System.Drawing.Point(9, 310);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(50, 18);
            this.label4.TabIndex = 11;
            this.label4.Text = "Logs:";
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(929, 449);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.uxLogs);
            this.Controls.Add(this.tabControl1);
            this.Name = "Form1";
            this.Text = "Demo App for PhilHealth e-Claims Document Encryption";
            this.Load += new System.EventHandler(this.Form1_Load);
            this.tabControl1.ResumeLayout(false);
            this.tabPage1.ResumeLayout(false);
            this.tabPage1.PerformLayout();
            this.tabPage2.ResumeLayout(false);
            this.tabPage2.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox uxLogs;
        private System.Windows.Forms.TabControl tabControl1;
        private System.Windows.Forms.TabPage tabPage1;
        private System.Windows.Forms.TextBox uxSaveFileName;
        private System.Windows.Forms.Label uxSave;
        private System.Windows.Forms.TextBox uxMimeType;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox uxFileToEncrypt;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.TextBox uxPublicKeyFileName;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Button publicKeyFileOpenDlgBtn;
        private System.Windows.Forms.Button encryptedFileSaveDlgBtn;
        private System.Windows.Forms.Button fileToEncryptOpenDlgBtn;
        private System.Windows.Forms.SaveFileDialog encryptedFileSaveDlg;
        private System.Windows.Forms.OpenFileDialog fileToEncryptOpenDlg;
        private System.Windows.Forms.OpenFileDialog publicKeyFileOpenDlg;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.Button encryptXmlBtn;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.RichTextBox uxEncryptedXml;
        private System.Windows.Forms.TextBox uxPassphrase;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.RichTextBox uxXml;
        private System.Windows.Forms.Button uxDecryptXml;
    }
}

