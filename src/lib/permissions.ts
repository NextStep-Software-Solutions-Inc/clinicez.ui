export const PERMISSIONS = {
  USER: {
    "UPSERT:USER-PREFERENCE:OWN": {
      name: "upsert:user-preference:own",
      description: "User can update their own user preference.",
    },
    "UPDATE:USER:PERMISSIONS": {
      name: "update:user:permissions",
      description: "User can update the permissions.",
    },
    "SUPER_ADMIN": {
      name: "super_admin",
      description: "User has super admin privileges.",
    },
    "COMPLETE:USER:ONBOARDING": {
      name: "complete:user:onboarding",
      description: "User can complete their own onboarding process.",
    },
    "VIEW:USER:AUDIT_LOG:OWN": {
      name: "view:user:audit_log:own",
      description: "User can view their own audit log.",
    },
  },
  CLINIC: {
    "CONFIRM:CLINIC:APPOINTMENT": {
      name: "confirm:clinic:appointment",
      description: "User can confirm appointment within the clinic.",
    },
    "ASSIGN:CLINIC:APPOINTMENT": {
      name: "assign:clinic:appointment",
      description: "User can assign appointment to another user within then clinic.",
    },
    "DECLINE:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "decline:clinic:appointment_assignment",
      description: "User can decline appointment assignment within the clinic.",
    },
    "CANCEL:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "cancel:clinic:appointment_assignment",
      description: "User can cancel appointment assignment within the clinic.",
    },
    "RETURN:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "return:clinic:appointment_assignment",
      description: "User can return accepted appointment assignment within the clinic.",
    },
    "ACCEPT:CLINIC:APPOINTMENT_ASSIGNMENT": {
      name: "accept:clinic:appointment_assignment",
      description: "User can accept appointment assignment within the clinic.",
    },
    "WRITE:CLINIC:APPOINTMENT": {
      name: "write:clinic:appointment",
      description: "User can write appointment within the clinic.",
    },
    "READ:CLINIC:APPOINTMENT:ALL": {
      name: "read:clinic:appointment:all",
      description: "User can read all appointment within the clinic.",
    },
    "READ:CLINIC:APPOINTMENT:OWN": {
      name: "read:clinic:appointment:own",
      description: "User can read their own appointment within the clinic.",
    },
    "READ:CLINIC:APPOINTMENT:ASSIGNED": {
      name: "read:clinic:appointment:assigned",
      description: "User can read appointment assigned to them within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:ALL": {
      name: "read:clinic:consultation_ticket:all",
      description: "User can read all consultation ticket within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:OWN": {
      name: "read:clinic:consultation_ticket:own",
      description: "User can read their own consultation ticket within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "read:clinic:consultation_ticket:created",
      description: "User can read consultation ticket created by them within the clinic.",
    },
    "READ:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "read:clinic:consultation_ticket:co_created",
      description: "User can read consultation ticket co-created by them within the clinic.",
    },
    "UPDATE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "update:clinic:consultation_ticket:created",
      description: "User can update consultation ticket created by them within the clinic.",
    },
    "UPDATE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "update:clinic:consultation_ticket:co_created",
      description: "User can update consultation ticket co-created by them within the clinic.",
    },
    "DELETE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "delete:clinic:consultation_ticket:created",
      description: "User can delete consultation ticket created by them within the clinic.",
    },
    "DELETE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "delete:clinic:consultation_ticket:co_created",
      description: "User can delete consultation ticket co-created by them within the clinic.",
    },
    "RESOLVE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "resolve:clinic:consultation_ticket:created",
      description: "User can resolve consultation ticket created by them within the clinic.",
    },
    "RESOLVE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "resolve:clinic:consultation_ticket:co_created",
      description: "User can resolve consultation ticket co-created by them within the clinic.",
    },
    "TOGGLE_ARCHIVE:CLINIC:CONSULTATION_TICKET:CREATED": {
      name: "toggle_archive:clinic:consultation_ticket:created",
      description: "User can archive consultation ticket created by them within the clinic.",
    },
    "TOGGLE_ARCHIVE:CLINIC:CONSULTATION_TICKET:CO_CREATED": {
      name: "toggle_archive:clinic:consultation_ticket:co_created",
      description: "User can archive consultation ticket co-created by them within the clinic.",
    },
    "CREATE:CLINIC:CONSULTATION_TICKET": {
      name: "create:clinic:consultation_ticket",
      description: "User can create consultation ticket within the clinic.",
    },
    "ADD:CLINIC:CONSULTATION_TICKET:HP": {
      name: "add:clinic:consultation_ticket:hp",
      description: "User can add healthcare provider to consultation ticket within the clinic.",
    },
    "WRITE:CLINIC:PRE_ASSESSMENT_NOTE": {
      name: "write:clinic:pre_assessment_note",
      description: "User can write pre-assessment note within the clinic. This permission can be granted to any healthcare provider role (nurses, medical assistants, doctors, etc.) based on clinic workflow.",
    },
    "READ:CLINIC:PRE_ASSESSMENT_NOTE": {
      name: "read:clinic:pre_assessment_note",
      description: "User can read pre-assessment note within the clinic.",
    },
    "RECEIVE:CLINIC:APPOINTMENT": {
      name: "receive:clinic:appointment",
      description: "User can receive appointment within the clinic.",
    },
    "COMPLETE:CLINIC:APPOINTMENT": {
      name: "complete:clinic:appointment",
      description: "User can complete appointment within the clinic.",
    },
    "REJECT:CLINIC:APPOINTMENT": {
      name: "reject:clinic:appointment",
      description: "User can reject appointment within the clinic.",
    },
    "WRITE:CLINIC:VITAL_SIGNS": {
      name: "write:clinic:vital_signs",
      description: "User can write vital signs within the clinic.",
    },
    "RESCHEDULE:CLINIC:APPOINTMENT": {
      name: "reschedule:clinic:appointment",
      description: "User can reschedule appointment within the clinic.",
    },
    "WRITE:CLINIC:APPOINTMENT:BOOK_A_FRIEND": {
      name: "write:clinic:appointment:book_a_friend",
      description: "User can write appointment for a friend within the clinic.",
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
    "UPDATE:CLINIC:PERMISSIONS": {
      name: "update:clinic:permissions",
      description: "User can update permissions within the clinic.",
    },
    "CREATE:CLINIC:PATIENT:SHELL_ACCOUNT": {
      name: "create:clinic:patient:shell_account",
      description: "User can create shell patient accounts within the clinic.",
    },
    "VIEW:CLINIC:PATIENT:AUDIT_LOG": {
      name: "view:clinic:patient:audit_log",
      description: "User can view patient audit logs within the clinic.",
    },
    "COMPLETE:CLINIC:PATIENT:ONBOARDING": {
      name: "complete:clinic:patient:onboarding",
      description: "User can complete patient onboarding within the clinic.",
    },
    "VIEW:CLINIC:PATIENT:PROFILE": {
      name: "view:clinic:patient:profile",
      description: "User can view patient profile within the clinic.",
    },
    "EDIT:CLINIC:PATIENT:PROFILE": {
      name: "edit:clinic:patient:profile",
      description: "User can edit patient profile within the clinic.",
    },
    "VIEW:CLINIC:PATIENT:HEALTH_RECORDS": {
      name: "view:clinic:patient:health_records",
      description: "User can view patient health records within the clinic.",
    },
    "EDIT:CLINIC:PATIENT:HEALTH_RECORDS": {
      name: "edit:clinic:patient:health_records",
      description: "User can edit patient health records within the clinic.",
    },
    "ADD:CLINIC:PATIENT:HEALTH_RECORDS": {
      name: "add:clinic:patient:health_records",
      description: "User can add patient health records within the clinic.",
    },
    "VIEW:CLINIC:PATIENT:CONSULTATIONS": {
      name: "view:clinic:patient:consultations",
      description: "User can view patient consultations within the clinic.",
    },
    "EXPORT:CLINIC:PATIENT:AUDIT_LOG": {
      name: "export:clinic:patient:audit_log",
      description: "User can export patient audit logs within the clinic.",
    },
    "GENERATE:CLINIC:PATIENT:REPORT": {
      name: "generate:clinic:patient:report",
      description: "User can generate patient reports within the clinic.",
    },
  },
  ORGANIZATION: {
    "UPDATE:ORG:INFO": {
      name: "update:org:info",
      description: "User can update organization information and settings.",
    },
    "READ:ORG:MEMBERS": {
      name: "read:org:members",
      description: "User can read and view organization members.",
    },
    "CREATE:ORG:MEMBERS": {
      name: "create:org:members",
      description: "User can create and invite new organization members.",
    },
    "UPDATE:ORG:MEMBERS": {
      name: "update:org:members",
      description: "User can update organization member status, roles, and assignments.",
    },
    "DELETE:ORG:MEMBERS": {
      name: "delete:org:members",
      description: "User can delete and remove organization members.",
    },
    "UPDATE:ORG:PERMISSIONS": {
      name: "update:org:permissions",
      description: "User can update permissions within the organization.",
    },
    "COMPLETE:ORG:MEMBER:ONBOARDING": {
      name: "complete:org:member:onboarding",
      description: "User can complete organization member onboarding.",
    },
    "VIEW:ORG:AUDIT_LOG": {
      name: "view:org:audit_log",
      description: "User can view organization audit logs.",
    },
  },
}