export type AppointmentStatus = "all" | "pending" | "received" | "accepted" | "rejected" | "routed" | "reschedule";

export type Appointment = {
  id: string;
  status: AppointmentStatus;
  patientId: string;
  subject: string;
  complaint: string;
  createdAt: string;
  bookingDateTime: string;
  read: boolean;
  labels: string[];
};

export const appointmentList:Appointment[] = [
  {
    id: "auth0|668c3bcfb6e20bb732dc87a8",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "pending",
    subject: "Meeting Tomorrow",
    complaint: "Hi, let's have a follow-up tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success.\n\nPlease come prepared with any questions or insights you may have. Looking forward to our follow-up!\n\nBest regards, William",
    createdAt: "2023-10-22T09:00:00",
    bookingDateTime: "2024-05-08T12:00:00",
    read: true,
    labels: ["follow-up", "consultation", "emergency"],
  },
  {
    id: "110e8400-e29b-11d4-a716-446655440000",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "received",
    subject: "Re: Project Update",
    complaint: "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard consultation everyone has put in.\n\nI have a few minor suggestions that I'll include in the attached document.\n\nLet's discuss these during our next follow-up. Keep up the excellent consultation!\n\nBest regards, Alice",
    createdAt: "2023-10-22T10:30:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: true,
    labels: ["consultation", "emergency"],
  },
  {
    id: "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "pending",
    subject: "Weekend Plans",
    complaint: "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun.\n\nIf you're interested, let me know, and we can plan the details. It'll be a great way to unwind and enjoy nature.\n\nLooking forward to your response!\n\nBest, Bob",
    createdAt: "2023-04-10T11:45:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: true,
    labels: ["medical certificate"],
  },
  {
    id: "61c35085-72d7-42b4-8d62-738f700d4b92",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "accepted",
    subject: "Re: Question about Budget",
    complaint: "I have a question about the laboratory for the upcoming project. It seems like there's a discrepancy in the allocation of resources.\n\nI've reviewed the laboratory report and identified a few areas where we might be able to optimize our spending without compromising the project's quality.\n\nI've attached a detailed analysis for your reference. Let's discuss this further in our next follow-up.\n\nThanks, Emily",
    createdAt: "2023-03-25T13:15:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["consultation", "laboratory"],
  },
  {
    id: "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "received",
    subject: "Important Announcement",
    complaint: "I have an emergency announcement to make during our team follow-up. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuable feedback from our beta testers, and I believe it's time to make some adjustments to better meet our customers' needs.\n\nThis change is crucial to our success, and I look forward to discussing it with the team. Please be prepared to share your insights during the follow-up.\n\nRegards, Michael",
    createdAt: "2023-03-10T15:00:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["follow-up", "consultation", "emergency"],
  },
  {
    id: "1f0f2c02-e299-40de-9b1d-86ef9e42126b",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "rejected",
    subject: "Re: Feedback on Proposal",
    complaint: "Thank you for your feedback on the proposal. It looks great! I'm pleased to hear that you found it promising. The team consultation diligently to address all the key points you raised, and I believe we now have a strong foundation for the project.\n\nI've attached the revised proposal for your review.\n\nPlease let me know if you have any further comments or suggestions. Looking forward to your response.\n\nBest regards, Sarah",
    createdAt: "2023-02-15T16:30:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: true,
    labels: ["consultation"],
  },
  {
    id: "17c0a96d-4415-42b1-8b4f-764efab57f66",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "reschedule",
    subject: "New Project Idea",
    complaint: "I have an exciting consultation project idea to discuss with you. It involves expanding our services to target a niche market that has shown considerable growth in recent months.\n\nI've prepared a detailed proposal outlining the potential benefits and the strategy for execution.\n\nThis project has the potential to significantly impact our business positively. Let's set up a follow-up to dive into the details and determine if it aligns with our current goals.\n\nBest regards, David",
    createdAt: "2023-01-28T17:45:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["follow-up", "consultation", "emergency"],
  },
  {
    id: "2f0130cb-39fc-44c4-bb3c-0a4337edaaab",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "routed",
    subject: "Vacation Plans",
    complaint: "Let's plan our vacation for next month. What do you think? I've been thinking of visiting a tropical paradise, and I've put together some destination options.\n\nI believe it's time for us to unwind and recharge. Please take a look at the options and let me know your preferences.\n\nWe can start making arrangements to ensure a smooth and enjoyable trip.\n\nExcited to hear your thoughts! Olivia",
    createdAt: "2022-12-20T18:30:00",
    bookingDateTime: "2023-10-22T12:00:00",
    read: true,
    labels: ["medical certificate"],
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546014",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "accepted",
    subject: "Re: Conference Registration",
    complaint: "I've completed the registration for the new next month. The event promises to be a great  consultation opportunity, and I'm looking forward to attending the various sessions and connecting with industry experts.\n\nI've also attached the new schedule for your reference.\n\nIf there are any specific topics or sessions you'd like me to explore, please let me know. It's an exciting event, and I'll make the most of it.\n\nBest regards, James",
    createdAt: "2022-11-30T19:15:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: true,
    labels: ["consultation", "new"],
  },
  {
    id: "7dd90c63-00f6-40f3-bd87-5060a24e8ee7",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "rejected",
    
    subject: "Team Dinner",
    complaint: "Let's have a team dinner next week to celebrate our success. We've achieved some significant milestones, and it's time to acknowledge our hard consultation and dedication.\n\nI've made reservations at a lovely restaurant, and I'm sure it'll be an enjoyable evening.\n\nPlease confirm your availability and any dietary preferences. Looking forward to a fun and memorable dinner with the team!\n\nBest, Sophia",
    createdAt: "2022-11-05T20:30:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["follow-up", "consultation"],
  },
  {
    id: "99a88f78-3eb4-4d87-87b7-7b15a49a0a05",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "routed",
    subject: "Feedback Request",
    complaint: "I'd like your feedback on the latest project deliverables. We've made significant progress, and I value your input to ensure we're on the right track.\n\nI've attached the deliverables for your review, and I'm particularly interested in any areas where you think we can further enhance the quality or efficiency.\n\nYour feedback is invaluable, and I appreciate your time and expertise. Let's consultation together to make this project a success.\n\nRegards, Daniel",
    createdAt: "2022-10-22T09:30:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["consultation"],
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "reschedule",
    subject: "Re: Meeting Agenda",
    complaint: "Here's the agenda for our follow-up next week. I've included all the topics we need to cover, as well as time allocations for each.\n\nIf you have any additional items to discuss or any specific points to address, please let me know, and we can integrate them into the agenda.\n\nIt's essential that our follow-up is productive and addresses all relevant matters.\n\nLooking forward to our follow-up! Ava",
    createdAt: "2022-10-10T10:45:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: true,
    labels: ["follow-up", "consultation"],
  },
  {
    id: "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "rejected",
    subject: "Product Launch Update",
    complaint: "The product launch is on track. I'll provide an update during our call. We've made substantial progress in the development and marketing of our consultation product.\n\nI'm excited to share the latest updates with you during our upcoming call. It's crucial that we coordinate our efforts to ensure a successful launch. Please come prepared with any questions or insights you may have.\n\nLet's make this product launch a resounding success!\n\nBest regards, William",
    createdAt: "2022-09-20T12:00:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["follow-up", "consultation", "emergency"],
  },
  {
    id: "ba54eefd-4097-4949-99f2-2a9ae4d1a836",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "routed",
    subject: "Re: Travel Itinerary",
    complaint: "I've received the vaccination itinerary. It looks great! Thank you for your prompt assistance in arranging the details. I've reviewed the schedule and the accommodations, and everything seems to be in order. I'm looking forward to the trip, and I'm confident it'll be a smooth and enjoyable experience.\n\nIf there are any specific activities or attractions you recommend at our destination, please feel free to share your suggestions.\n\nExcited for the trip! Mia",
    createdAt: "2022-09-10T13:15:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: true,
    labels: ["medical certificate", "vaccination"],
  },
  {
    id: "df09b6ed-28bd-4e0c-85a9-9320ec5179aa",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "accepted",
    subject: "Team Building Event",
    complaint: "Let's plan a team-building event for our department. Team cohesion and morale are vital to our success, and I believe a well-organized team-building event can be incredibly beneficial. I've done some research and have a few ideas for fun and engaging activities.\n\nPlease let me know your thoughts and availability. We want this event to be both enjoyable and productive.\n\nTogether, we'll strengthen our team and boost our performance.\n\nRegards, Ethan",
    createdAt: "2022-08-25T15:30:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["follow-up", "consultation"],
  },
  {
    id: "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "pending",
    subject: "Re: Budget Approval",
    complaint: "The laboratory has been approved. We can proceed with the project. I'm delighted to inform you that our laboratory proposal has received the green light from the finance department. This is a significant milestone, and it means we can move forward with the project as planned.\n\nI've attached the finalized laboratory for your reference. Let's ensure that we stay on track and deliver the project on time and within laboratory.\n\nIt's an exciting time for us! Chloe",
    createdAt: "2022-08-10T16:45:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: true,
    labels: ["consultation", "laboratory"],
  },
  {
    id: "6c9a7f94-8329-4d70-95d3-51f68c186ae1",
    patientId: "auth0|668c3bcfb6e20bb732dc87a8",
    status: "pending",
    subject: "Weekend Hike",
    complaint: "Who's up for a weekend hike in the mountains? I've been craving some outdoor adventure, and a hike in the mountains sounds like the perfect escape. If you're up for the challenge, we can explore some scenic trails and enjoy the beauty of nature.\n\nI've done some research and have a few routes in mind.\n\nLet me know if you're interested, and we can plan the details.\n\nIt's sure to be a memorable experience! Samuel",
    createdAt: "2022-07-28T17:30:00",
    bookingDateTime: "2023-10-22T10:00:00",
    read: false,
    labels: ["medical certificate"],
  },
]
  
export type AppointmentsType = (typeof appointmentList)

export const accounts = [
  {
    label: "Alicia Koch",
    email: "alicia@example.com",
    icon: (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Vercel</title>
        <path d="M24 22.525H0l12-21.05 12 21.05z" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Alicia Koch",
    email: "alicia@gmail.com",
    icon: (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Gmail</title>
        <path
          d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Alicia Koch",
    email: "alicia@me.com",
    icon: (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>iCloud</title>
        <path
          d="M13.762 4.29a6.51 6.51 0 0 0-5.669 3.332 3.571 3.571 0 0 0-1.558-.36 3.571 3.571 0 0 0-3.516 3A4.918 4.918 0 0 0 0 14.796a4.918 4.918 0 0 0 4.92 4.914 4.93 4.93 0 0 0 .617-.045h14.42c2.305-.272 4.041-2.258 4.043-4.589v-.009a4.594 4.594 0 0 0-3.727-4.508 6.51 6.51 0 0 0-6.511-6.27z"
          fill="currentColor"
        />
      </svg>
    ),
  },
]

export type Account = (typeof accounts)[number]