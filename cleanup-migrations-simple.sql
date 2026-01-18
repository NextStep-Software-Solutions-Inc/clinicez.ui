-- Script to clean up orphaned migrations from _prisma_migrations table
-- This removes migrations that exist in the database but don't have local migration files

DELETE FROM "_prisma_migrations"
WHERE migration_name NOT IN (
  '20250811175247_squashed',
  '20250813043945_add_philhealth_record_model',
  '20250813061820_add_multiple_philhealth_member_types_support',
  '20250813074635_remove_multi_member_types',
  '20250813161223_add_photo_url_to_philhealth_record',
  '20250915164345_add_esig_hp',
  '20250929074556_add_qty_to_prescription_model',
  '20251127061508_refactor_medical_history_to_use_health_condition',
  '20251127151900_refactor_family_medical_history_normalize_structure',
  '20251210144241_add_appointment_tags',
  '20251211144232_add_return_fields_to_appointment_routing',
  '20251216111750_single_hp_profile_per_user'
);
