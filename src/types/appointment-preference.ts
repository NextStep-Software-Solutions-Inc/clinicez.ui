export type AppointmentSortOrder = "FIFO" | "STATUS" | "PROVIDER";

export type AppointmentListPreference = {
  sortOrder: AppointmentSortOrder;
};

/** Generic per-user preferences stored as JSON in UserPreference.preferences.
 *  Add new preference namespaces here as features are added. */
export type UserPreferences = {
  appointmentList?: AppointmentListPreference;
};

export const DEFAULT_APPOINTMENT_LIST_PREFERENCE: AppointmentListPreference = {
  sortOrder: "FIFO",
};
