export type AppointmentSortField = "schedule" | "createdAt";
export type AppointmentSortDirection = "asc" | "desc";

/** Backward-compat alias */
export type AppointmentSortOrder = AppointmentSortField;

export type AppointmentListPreference = {
  /** Persisted status tab selection (e.g. "ALL", "PENDING"). */
  statusFilter?: string;
  /** Persisted HP provider filter — array of HP IDs. */
  providerIds?: number[];
  /** Which field to sort by. */
  sortOrder?: AppointmentSortField;
  /** Sort direction for the chosen field. */
  sortDirection?: AppointmentSortDirection;
};

/** Generic per-user preferences stored as JSON in UserPreference.preferences.
 *  Add new preference namespaces here as features are added. */
export type UserPreferences = {
  appointmentList?: AppointmentListPreference;
};
