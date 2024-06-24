"use server";


import { mySQLConnection } from "@lib/myslq";

export const getPatient = async (email: string) => {
  const conn = await mySQLConnection;
  const [rows, fields] = await conn.execute(`
          SELECT 
              p.*,
              (
                  SELECT JSON_ARRAYAGG(
                      JSON_OBJECT(
                          'condition', IF(ph_condition.condition = 'Others', ph.other_value, ph_condition.condition),
                          'age_of_diagnosis', ph.age_year
                      )
                  )
                  FROM personal_histories ph
                  JOIN conditions ph_condition ON ph.condition_id = ph_condition.id
                  WHERE ph.profile_id = p.id
              ) AS personal_histories,
              (
                  SELECT JSON_ARRAYAGG(
                      IF(fh_condition.condition = 'Others', fh.other_value, fh_condition.condition)
                  )
                  FROM family_histories fh
                  JOIN conditions fh_condition ON fh.condition_id = fh_condition.id
                  WHERE fh.profile_id = p.id
              ) AS family_histories,
              (
                  SELECT JSON_ARRAYAGG(
                      JSON_OBJECT(
                          'condition', IF(hmd_condition.condition = 'Others', "Others", hmd_condition.condition)
                      )
                  )
                  FROM health_medical_conditions hmd
                  JOIN conditions hmd_condition ON hmd.condition_id = hmd_condition.id
                  WHERE hmd.profile_id = p.id AND hmd.deleted_at IS NULL
              ) AS medical_histories,
              (
                  SELECT JSON_ARRAYAGG(allergy.allergies)
                  FROM allergies allergy
                  WHERE allergy.profile_id = p.id AND allergy.deleted_at IS NULL
              ) AS allergies, 
              (
                  SELECT JSON_ARRAYAGG(
                      JSON_OBJECT(
                          'interval', obstetric_history.interval,
                          'date_occurred', obstetric_history.date_occured,
                          'problems', obstetric_history.problems,
                          'duration', obstetric_history.duration,
                          'intervention', obstetric_history.interventions,
                          'age_first_menstruation', obstetric_history.age_first_mens,
                          'last_menstruation', obstetric_history.last_menstruation
                      )
                  )
                  FROM obstetric_histories obstetric_history
                  WHERE obstetric_history.profile_id = p.id AND obstetric_history.deleted_at IS NULL
              ) AS obstetric_histories
          FROM 
              profiles p
          WHERE 
              p.email = ?
          GROUP BY 
              p.id;
          `, [email]);
      
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}