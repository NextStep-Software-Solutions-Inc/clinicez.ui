export type AppointmentSortOrder = "FIFO" | "STATUS" | "PROVIDER";

export type AppointmentListPreference = {
  sortOrder: AppointmentSortOrder;
};

export const DEFAULT_APPOINTMENT_LIST_PREFERENCE: AppointmentListPreference = {
  sortOrder: "FIFO",
};
