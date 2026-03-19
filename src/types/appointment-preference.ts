/** "schedule" = order by scheduled date asc; "createdAt" = order by creation date desc (default) */
export type AppointmentSortOrder = "schedule" | "createdAt";

export type AppointmentListPreference = {
  /** Persisted status tab selection (e.g. "ALL", "PENDING"). */
  statusFilter?: string;
  /** Persisted HP provider filter — array of HP IDs. */
  providerIds?: number[];
  /** Persisted sort order. */
  sortOrder?: AppointmentSortOrder;
};

/** Generic per-user preferences stored as JSON in UserPreference.preferences.
 *  Add new preference namespaces here as features are added. */
export type UserPreferences = {
  appointmentList?: AppointmentListPreference;
};
