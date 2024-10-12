export const PERMISSIONS = {
  USER: {
    "UPSERT:USER-PREFERENCE:OWN": {
      name: "upsert:user-preference:own",
      description: "User can update their own user preference.",
    },
  },
  ORGANIZATION: {
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
    }
  },
}