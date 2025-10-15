import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import * as nodemailer from 'nodemailer';
const prisma = new PrismaClient();

const seeds = [
  {
    "Timestamp": "6/26/2023 13:43:04",
    "Student_ID_No.": "2023300103",
    "Campus": "Cagayan de Oro Campus",
    "Year_Level": "1st Year",
    "Department/Program": "CSTE- B.S. in Sciences Education (BSSciED)",
    "Email_Address_Student": "racquelenerio@gmail.com",
    "First_Name_Student": "Fedis Gayle",
    "Middle_Name_Student": "Maliza",
    "Last_Name_Student": "Enerio",
    "Suffix_Student": "",
    "Date_of_Birth": "3/31/2005",
    "Sex": "Female",
    "Male_Artifact": "09351654462",
    "Personal_Contact_Number": "Filipino",
    "Nationality": "Single",
    "Civil_Status": "Regular",
    "Interval": "Roman Catholic",
    "Religion": "3 days",
    "Duration": "6/21/2023",
    "Day_1_of_last_menstruation": "",
    "Problems_e.g._Breasts,_Masses_or_Lumps": "9000",
    "Zip_Code": "Misamis Oriental",
    "Province": "Cagayan de Oro City",
    "City/Municipality": "Nazareth",
    "Barangay": "#49 15-24 Street",
    "Specific_Address": "Aunt",
    "Relationship_Guardian": "Carmen Demi",
    "First_Name_Guardian": "S",
    "Middle_Name_Guardian": "Enerio",
    "Last_Name_Guardian": "09171467802",
    "Contact_Number_Guardian": "#49 15-24 Street Brgy. Nazareth",
    "Address_Guardian": "racquelenerio@gmail.com",
    "Email_Address_Guardian": "Chickenpox",
    "Family_Medical_History": "",
    "Personal_Medical_History": "",
    "Alcohol_Consumption": "",
    "Physical/Special_Conditions": "",
    "Recent/Past_Hospitalizations/Surgical_Operations": "",
    "Regular_Medications": "",
    "Tobacco_Products_Use": "",
    "Recent_Immunizations/Vaccinations": "https://drive.google.com/open?id=1P0goDX3avDqBfhkua3fOdd7K6Ch2GUnp",
    "Food_and_Drug_Allergies": "https://drive.google.com/open?id=1sC8zsNu5IswJo9onS3j24a6LWrOQoSFl",
    "Type_of_Disability": "https://drive.google.com/open?id=1nUgLkZoc9UMyau6e2cIivyRVSBi4XcLZ",
    "Cause_of_Disability": "Father",
    "Chest_X-ray_URL": "Gerald",
    "Medical_Certificate_URL": "",
    "Vaccination_Card_URL": "Enerio",
    "Relationship_Emergency": "9756407349",
    "First_Name_Emergency": "#49 15-24 Street Brgy. Nazareth",
    "Middle_Name_Emergency": "",
    "Last_Name_Emergency": "Fully Vaccinated",
    "Contact_Number_Emergency": "6/26/2023 13:55:33",
    "Address_Emergency": "2023300268",
    "Email_Address_Emergency_1": "Cagayan de Oro Campus",
    "Email_Address_Emergency_2": "1st Year",
    "Hematology": "CEA- B.S. in Architecture (BSARCH)",
    "Urinalysis": "delapena.hannahbella9194@gmail.com",
    "Stool_Exam": "Hannah Bella",
    "PTB_Records": "Sivela",
    "Vaccination_Status_Final": "Dela Peña"
  },
  {
    "Timestamp": "6/26/2023 13:55:33",
    "Student_ID_No.": "2023300268",
    "Campus": "Cagayan de Oro Campus",
    "Year_Level": "1st Year",
    "Department/Program": "CEA- B.S. in Architecture (BSARCH)",
    "Email_Address_Student": "delapena.hannahbella9194@gmail.com",
    "First_Name_Student": "Hannah Bella",
    "Middle_Name_Student": "Sivela",
    "Last_Name_Student": "Dela Peña",
    "Suffix_Student": "",
    "Date_of_Birth": "9/19/2004",
    "Sex": "Female",
    "Male_Artifact": "09271402439",
    "Personal_Contact_Number": "Filipino",
    "Nationality": "Single",
    "Civil_Status": "Regular",
    "Interval": "Pentecostal",
    "Religion": "7 days",
    "Duration": "5/25/2023",
    "Day_1_of_last_menstruation": "",
    "Problems_e.g._Breasts,_Masses_or_Lumps": "9000",
    "Zip_Code": "Misamis Oriental",
    "Province": "Cagayan de Oro City",
    "City/Municipality": "Iponan",
    "Barangay": "block 17 Lt. 22 West Field Homes",
    "Specific_Address": "Mother",
    "Relationship_Guardian": "Nerrizza",
    "First_Name_Guardian": "S.",
    "Middle_Name_Guardian": "Dela peña",
    "Last_Name_Guardian": "09176777233",
    "Contact_Number_Guardian": "Iponan, CDOC",
    "Address_Guardian": "delapena.hannahbella9194@gmail.com",
    "Email_Address_Guardian": "Covid 19 vaccine",
    "Family_Medical_History": "",
    "Personal_Medical_History": "",
    "Alcohol_Consumption": "",
    "Physical/Special_Conditions": "",
    "Recent/Past_Hospitalizations/Surgical_Operations": "",
    "Regular_Medications": "",
    "Tobacco_Products_Use": "https://drive.google.com/open?id=1vEaoDK4Av4mDbwoIX4UK4KiYa1rXYWwB",
    "Recent_Immunizations/Vaccinations": "https://drive.google.com/open?id=1Swsko-JZMEZuJ8AnBmxX6LBI0KynIxbq",
    "Food_and_Drug_Allergies": "https://drive.google.com/open?id=1V3g4V7eFCy49YjSMWC3ypVou4jNIT9wz",
    "Type_of_Disability": "Fully Vaccinated",
    "Cause_of_Disability": "6/26/2023 13:55:52",
    "Chest_X-ray_URL": "2023300205",
    "Medical_Certificate_URL": "Cagayan de Oro Campus",
    "Vaccination_Card_URL": "1st Year",
    "Relationship_Emergency": "CEA- B.S. in Architecture (BSARCH)",
    "First_Name_Emergency": "chio.chara03@gmail.com",
    "Middle_Name_Emergency": "Chara",
    "Last_Name_Emergency": "Lim",
    "Contact_Number_Emergency": "Chio",
    "Address_Emergency": "10/29/2005",
    "Email_Address_Emergency_1": "Female",
    "Email_Address_Emergency_2": "09565366085",
    "Hematology": "Filipino",
    "Urinalysis": "Single",
    "Stool_Exam": "Regular",
    "PTB_Records": "Born Again Christian",
    "Vaccination_Status_Final": "6"
  }
];

async function main() {

  try {
    const client = await clerkClient()

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await prisma.$transaction(async (prisma) => {

      for (const seed of seeds) {

        const username = seed.Email_Address_Student.split('@')[0];
        const password = createStrongPassword();
        const clerkUser = await client.users.createUser({
          firstName: seed.First_Name_Student,
          lastName: seed.Last_Name_Student,
          emailAddress: [seed.Email_Address_Student],
          username,
          password,

          privateMetadata: {
            requiresPasswordChange: true,
          },
        })

        if (!clerkUser) throw new Error('Failed to create clerk user');

        const userId = await prisma.user.create({
          data: {
            email: seed.Email_Address_Student,
            firstName: seed.First_Name_Student,
            lastName: seed.Last_Name_Student,
            userId: clerkUser.id,
            religion: seed.Religion,
            UserAddresses: {
              create: {
                address: seed.Specific_Address,
                city: seed["City/Municipality"],
                country: "Philippines",
                zipCode: seed.Zip_Code,
                isPrimary: true,
                state: seed.Province,
              }
            },
          }, select: {
            id: true
          }
        })

        if (!userId) throw new Error('Failed to create user in database');

        await prisma.organizationMember.create({
          data: {
            userId: userId.id,
            organizationId: 1,
            role: 1
          }
        })

        // More seeding here if needed


        // Send email to the user to login
        await sendWelcomeEmail(transporter, seed.Email_Address_Student, seed.First_Name_Student, seed.Last_Name_Student, password);
      }
    }, {
      timeout: 300000, // 5 minutes
      isolationLevel: 'Serializable',
      maxWait: 10000, // 10 seconds
    })
  }
  catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });


const createStrongPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const sendWelcomeEmail = async (transporter: nodemailer.Transporter, email: string, firstName: string, lastName: string, password: string) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Welcome to Clinic EZ - Your Account is Ready',
    html: `
      <h1>Welcome to Clinic EZ!</h1>
      <p>Dear ${firstName} ${lastName},</p>
      <p>Your account has been successfully created. Here are your temporary login credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please visit <a href="${process.env.APP_URL || 'https://your-app-url.com'}">Clinic EZ</a> to log in and change your password.</p>
      <p>If you have any questions, feel free to contact support.</p>
      <p>Best regards,<br>The Clinic EZ Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
