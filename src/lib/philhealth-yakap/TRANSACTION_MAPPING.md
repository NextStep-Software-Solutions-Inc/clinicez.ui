# PhilHealth Konsulta Transaction Number (`hciTransNo`) Mapping Rules

This document outlines how PhilHealth Konsulta transaction numbers (`hciTransNo`) are assigned to different clinical entities (Consultations, Medicines, Diagnostics, etc.). This ensures we do not mistakenly generate new sequences for entities that must inherit them.

## The Core Rule: Inheritance
PhilHealth **only** generates unique transaction numbers for core Encounters (Enlistment, Profiling, and SOAP Consultations). 

Ancillary services like **Medicines**, **Diagnostics**, and attached **Documents** do **NOT** receive their own unique sequence prefixes (e.g., there is no `M` or `D` prefix). Instead, they strictly **inherit** the transaction number of the encounter during which they were ordered.

---

## Prefix `S` (SOAP / Consultation)
The `S` prefix transaction number is generated when a patient has a standard Consultation (SOAP).

It is used for the following XML nodes when they originate from a Consultation:
1. `<SOAP>`: The consultation record itself.
2. `<MEDICINE>`: Any medicine prescribed during that specific consultation.
3. `<DIAGNOSTICEXAMRESULT>`: Any diagnostic exams ordered during that consultation.
4. `<DOCUMENT>`: Any supporting documents attached to that consultation.

---

## Prefix `P` (Profiling / First Patient Encounter)
The `P` prefix transaction number is generated when a patient undergoes their First Patient Encounter (FPE / Profiling).

It is used for the following XML nodes when they originate from Profiling:
1. `<PROFILING>`: The FPE / Profiling record itself.
2. `<DIAGNOSTICEXAMRESULT>`: Any diagnostic exams ordered as part of the FPE baseline.
3. `<DOCUMENT>`: Any supporting documents attached to the FPE.
*(Note: Medicines are typically not prescribed strictly under Profiling without a SOAP, but if they were, they would inherit the `P` prefix).*

---

## Prefix `E` (Enlistment)
The `E` prefix transaction number is generated strictly during Annual Patient Enlistment.

It is used for:
1. `<ENLISTMENT>`: The enlistment record.

---

## Summary of Data Flow
When generating XML for PhilHealth submission:
- **Do not** generate a new `generatePhilHealthKonsultaTransactionNumber()` when dispensing a medicine or recording a lab result.
- Instead, query the parent encounter (e.g., `ConsultationTicket`) and retrieve its pre-existing `soapTransNo` or `profilingTransNo`.
- Apply that same transaction number to the child `<MEDICINE>` or `<DIAGNOSTICEXAMRESULT>` node.
