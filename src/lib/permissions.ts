export const PERMISSIONS = {
  USER: {
    "UPSERT:USER-PREFERENCE:OWN": {
      name: "upsert:user-preference:own",
      description: "User can update their own user preference.",
    },
    "UPDATE:USER:PERMISSIONS": {
      name: "update:user:permissions",
      description: "User can update the permissions.",
    }
  },
  CLINIC: {
    "CONFIRM:ORG:APPOINTMENT": {
      name: "confirm:org:appointment",
      description: "User can confirm appointment within the organization.",
    },
    "ASSIGN:ORG:APPOINTMENT": {
      name: "assign:org:appointment",
      description: "User can assign appointment to another user within then organization.",
    },
    "DECLINE:ORG:APPOINTMENT_ASSIGNMENT": {
      name: "decline:org:appointment_assignment",
      description: "User can decline appointment assignment within the organization.",
    },
    "CANCEL:ORG:APPOINTMENT_ASSIGNMENT": {
      name: "cancel:org:appointment_assignment",
      description: "User can cancel appointment assignment within the organization.",
    },
    "ACCEPT:ORG:APPOINTMENT_ASSIGNMENT": {
      name: "accept:org:appointment_assignment",
      description: "User can accept appointment assignment within the organization.",
    },
    "WRITE:ORG:APPOINTMENT": {
      name: "write:org:appointment",
      description: "User can write appointment within the organization.",
    },
    "READ:ORG:APPOINTMENT:ALL": {
      name: "read:org:appointment:all",
      description: "User can read all appointment within the organization.",
    },
    "READ:ORG:APPOINTMENT:OWN": {
      name: "read:org:appointment:own",
      description: "User can read their own appointment within the organization.",
    },
    "READ:ORG:APPOINTMENT:ASSIGNED": {
      name: "read:org:appointment:assigned",
      description: "User can read appointment assigned to them within the organization.",
    },
    "READ:ORG:CONSULTATION_TICKET:ALL": {
      name: "read:org:consultation_ticket:all",
      description: "User can read all consultation ticket within the organization.",
    },
    "READ:ORG:CONSULTATION_TICKET:OWN": {
      name: "read:org:consultation_ticket:own",
      description: "User can read their own consultation ticket within the organization.",
    },
    "READ:ORG:CONSULTATION_TICKET:CREATED": {
      name: "read:org:consultation_ticket:created",
      description: "User can read consultation ticket created by them within the organization.",
    },
    "READ:ORG:CONSULTATION_TICKET:CO_CREATED": {
      name: "read:org:consultation_ticket:co_created",
      description: "User can read consultation ticket co-created by them within the organization.",
    },
    "UPDATE:ORG:CONSULTATION_TICKET:CREATED": {
      name: "update:org:consultation_ticket:created",
      description: "User can update consultation ticket created by them within the organization.",
    },
    "UPDATE:ORG:CONSULTATION_TICKET:CO_CREATED": {
      name: "update:org:consultation_ticket:co_created",
      description: "User can update consultation ticket co-created by them within the organization.",
    },
    "DELETE:ORG:CONSULTATION_TICKET:CREATED": {
      name: "delete:org:consultation_ticket:created",
      description: "User can delete consultation ticket created by them within the organization.",
    },
    "DELETE:ORG:CONSULTATION_TICKET:CO_CREATED": {
      name: "delete:org:consultation_ticket:co_created",
      description: "User can delete consultation ticket co-created by them within the organization.",
    },
    "RESOLVE:ORG:CONSULTATION_TICKET:CREATED": {
      name: "resolve:org:consultation_ticket:created",
      description: "User can resolve consultation ticket created by them within the organization.",
    },
    "RESOLVE:ORG:CONSULTATION_TICKET:CO_CREATED": {
      name: "resolve:org:consultation_ticket:co_created",
      description: "User can resolve consultation ticket co-created by them within the organization.",
    },
    "TOGGLE_ARCHIVE:ORG:CONSULTATION_TICKET:CREATED": {
      name: "toggle_archive:org:consultation_ticket:created",
      description: "User can archive consultation ticket created by them within the organization.",
    },
    "TOGGLE_ARCHIVE:ORG:CONSULTATION_TICKET:CO_CREATED": {
      name: "toggle_archive:org:consultation_ticket:co_created",
      description: "User can archive consultation ticket co-created by them within the organization.",
    },
    "CREATE:ORG:CONSULTATION_TICKET": {
      name: "create:org:consultation_ticket",
      description: "User can create consultation ticket within the organization.",
    },
    "WRITE:ORG:PRE_ASSESSMENT_NOTE": {
      name: "write:org:pre_assessment_note",
      description: "User can write pre-assessment note within the organization.",
    },
    "READ:ORG:PRE_ASSESSMENT_NOTE": {
      name: "read:org:pre_assessment_note",
      description: "User can read pre-assessment note within the organization.",
    },
    "RECEIVE:ORG:APPOINTMENT": {
      name: "receive:org:appointment",
      description: "User can receive appointment within the organization.",
    },
    "COMPLETE:ORG:APPOINTMENT": {
      name: "complete:org:appointment",
      description: "User can complete appointment within the organization.",
    },
    "REJECT:ORG:APPOINTMENT": {
      name: "reject:org:appointment",
      description: "User can reject appointment within the organization.",
    },
    "WRITE:ORG:VITAL_SIGNS": {
      name: "write:org:vital_signs",
      description: "User can write vital signs within the organization.",
    },
    "RESCHEDULE:ORG:APPOINTMENT": {
      name: "reschedule:org:appointment",
      description: "User can reschedule appointment within the organization.",
    },
    "UPDATE:ORG:MEMBERSHIP_REQUEST": {
      name: "update:org:membership_request",
      description: "User can update membership request within the organization.",
    },
    "UPDATE:ORG:PERMISSIONS": {
      name: "update:org:permissions",
      description: "User can update permissions within the organization.",
    },
    "WRITE:ORG:APPOINTMENT:BOOK_A_FRIEND": {
      name: "write:org:appointment:book_a_friend",
      description: "User can write appointment for a friend within the organization.",
    },
    "READ:CLINIC:MEDICATION:ALL": {
      name: "read:clinic:medication:all",
      description: "User can read all medication within the clinic.",
    },
    "READ:CLINIC:MEDICATION:OWN": {
      name: "read:clinic:medication:own",
      description: "User can read their own medication within the clinic.",
    },
    "READ:CLINIC:MEDICATION:CREATED": {
      name: "read:clinic:medication:created",
      description: "User can read medication created by them within the clinic.",
    },
    "COMPLETE:CLINIC:MEDICATION": {
      name: "complete:clinic:medication",
      description: "User can complete medication within the clinic.",
    },
    "CREATE:CLINIC:MEDICATION": {
      name: "create:clinic:medication",
      description: "User can create medication within the clinic.",
    },
    "REMOVE:CLINIC:MEDICATION_DRUG": {
      name: "remove:clinic:medication_drug",
      description: "User can remove medication drug within the clinic.",
    },
    "ADD:CLINIC:MEDICATION_DRUG": {
      name: "add:clinic:medication_drug",
      description: "User can add medication drug within the clinic.",
    },
    "READ:CLINIC:MEDICATION_DRUG": {
      name: "read:clinic:medication_drug",
      description: "User can read medication drug within the clinic.",
    },
    "CREATE:CLINIC:PRESCRIPTION": {
      name: "create:clinic:prescription",
      description: "User can create prescription within the clinic.",
    },
  },
}