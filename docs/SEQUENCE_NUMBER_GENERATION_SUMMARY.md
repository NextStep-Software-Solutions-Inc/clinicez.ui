# Sequence Number Generation - Executive Summary

## Quick Overview

This document provides a high-level summary of how case numbers and transaction numbers are generated and maintained in the Clinicez.ui system.

For detailed technical documentation, see: [SEQUENCE_NUMBER_GENERATION.md](./SEQUENCE_NUMBER_GENERATION.md)

---

## What Are Sequence Numbers?

The system generates unique identification numbers for:

1. **Case Numbers** - For clinical encounters and health assessments
2. **Transaction Numbers** - For EKAS (Electronic Konsulta Availment Slip) forms

---

## Case Numbers

### Where They're Used
- **Consultation Notes**: Clinical encounters with healthcare providers
- **Health Assessment Forms (HAF)**: Personal health record assessments

### Format Examples
- Consultation: `2025-CONS-0001`, `2025-CONS-0002`, etc.
- Health Assessment: `2025-HAF-0001`, `2025-HAF-0023`, etc.

### Key Characteristics
- Automatically reset each year (2025, 2026, etc.)
- Can be clinic-specific or global
- Permanently stored with the record
- Generated once and reused for the same record

---

## Transaction Numbers

### Where They're Used
- **EKAS Forms**: PhilHealth Electronic Konsulta Availment Slips
- Two types: Transaction Number and Authorization Code

### Format Examples
- With Clinic: `EKAS-C123-2025-000456`
- Without Clinic: `EKAS-2025-000123`
- Auth Code: `PHK-C123-2025-000456`

### Key Characteristics
- Generated fresh every time an EKAS form is downloaded
- Not stored in the database (stateless)
- Clinic-aware formatting
- Uses 6-digit sequences (vs 4-digit for case numbers)

---

## How It Works

### Current Implementation

1. **Database Table**: `SequenceGenerator` stores current values
2. **Atomic Operations**: Uses database transactions to prevent duplicates
3. **Year-Based**: Separate sequences for each year
4. **Clinic Isolation**: Optional clinic-specific sequences

### Technical Files
- `src/services/sequence-generator.service.ts` - Case number generation
- `src/lib/sequence-generator.ts` - Transaction number generation
- `src/lib/format-sequence.ts` - Number formatting utilities

---

## Current Status

### ✅ Strengths
- **Reliable**: Transaction-based generation prevents race conditions
- **Scalable**: Year-based automatic reset prevents number exhaustion
- **Flexible**: Supports both global and clinic-specific sequences
- **Standardized**: Consistent formatting across the platform

### ⚠️ Areas for Enhancement
- **Monitoring**: Limited visibility into sequence health
- **Error Handling**: Basic error handling could be improved
- **Performance**: No caching or optimization for high loads
- **Audit Trail**: No tracking of who generated what numbers
- **Year Rollover**: Manual process, could be automated

---

## Production Readiness Recommendations

### High Priority (Implement First)

1. **Add Retry Logic**
   - Handle temporary database failures
   - Exponential backoff for retries
   - Prevent failures during high load

2. **Implement Monitoring**
   - Health check endpoint
   - Performance metrics (generation time, error rate)
   - Alerts for approaching limits

3. **Add Sequence Limit Warnings**
   - Alert when approaching 9999 limit
   - Plan for limit expansion
   - Prevent unexpected failures

### Medium Priority

4. **Create Audit Trail**
   - Track who generated each number
   - Timestamp and IP logging
   - Support compliance requirements

5. **Automated Year Rollover**
   - Scheduled job for January 1st
   - Backup previous year's data
   - Generate rollover reports

6. **Error Handling Enhancement**
   - Custom error types
   - Better error messages
   - Input validation

### Nice to Have

7. **Performance Optimization**
   - Caching for read operations
   - Connection pooling tuning
   - Database-level sequences for extreme load

8. **Security Enhancements**
   - Authorization checks
   - Rate limiting
   - Access logging

---

## Testing Strategy

### Current Testing Needs

1. **Unit Tests**
   - Test each generation function
   - Verify format correctness
   - Test edge cases (year boundaries, clinic isolation)

2. **Integration Tests**
   - Test with actual database
   - Verify storage and retrieval
   - Test concurrent access

3. **Load Tests**
   - Test 100+ concurrent requests
   - Measure performance degradation
   - Verify no duplicate numbers

---

## Maintenance Schedule

### Daily
- Check health endpoint
- Review error logs
- Monitor performance metrics

### Weekly
- Review audit logs
- Check for approaching limits
- Verify data consistency

### Monthly
- Run integrity checks
- Review performance trends
- Update documentation

### Annually (December)
- Prepare year rollover
- Test in staging
- Schedule maintenance window
- Notify stakeholders

---

## Common Issues and Solutions

### Issue: Duplicate Case Numbers
**Cause**: Race condition or database issue  
**Solution**: Check unique constraints, review logs, reassign duplicates manually

### Issue: Slow Generation
**Cause**: High load or database locks  
**Solution**: Check database performance, review connection pool, implement retry logic

### Issue: Missing Case Numbers
**Cause**: Generation failed or wasn't triggered  
**Solution**: Generate manually for affected records, add validation

### Issue: Approaching Limit (9999)
**Cause**: High volume clinic  
**Solution**: Expand to 5 or 6 digits, notify administrators, plan migration

---

## Quick Reference

### For Developers

```typescript
// Generate case number for consultation
import { generateCaseNumber } from '@/services/sequence-generator.service';
const caseNumber = await generateCaseNumber('CONSULTATION', clinicId);
// Result: "2025-CONS-0123"

// Generate case number for health assessment
const caseNumber = await generateCaseNumber('HEALTH_ASSESSMENT');
// Result: "2025-HAF-0045"

// Generate transaction number for EKAS
import { getNextSequenceNumber } from '@/lib/sequence-generator';
import { formatTransactionNumber } from '@/lib/format-sequence';

const year = new Date().getFullYear();
const seq = await getNextSequenceNumber('EKAS_TRANSACTION', clinicId, year);
const transactionNumber = formatTransactionNumber(clinicId, seq, year);
// Result: "EKAS-C123-2025-000456"
```

### For Operations

- **Health Check**: `GET /api/health/sequences` (to be implemented)
- **Current Value**: Use `getCurrentSequenceValue()` function
- **Reset (Testing)**: Use `resetSequence()` function (⚠️ Use with caution)

---

## Impact Assessment

### Business Impact
- **High Availability**: Critical for daily operations
- **Data Integrity**: Essential for proper record-keeping
- **Compliance**: Required for PhilHealth integration
- **Traceability**: Enables audit and reporting

### Risk Assessment
- **Current Risk**: Low - System is functional but has room for improvement
- **Failure Impact**: High - Would prevent creating consultation records
- **Mitigation**: Implement recommended enhancements, especially monitoring

---

## Next Steps

### Immediate Actions (This Month)
1. ✅ Document current implementation (COMPLETED)
2. ⬜ Review with development team
3. ⬜ Prioritize recommendations
4. ⬜ Create implementation tickets

### Short Term (Next 3 Months)
1. ⬜ Implement health check endpoint
2. ⬜ Add basic monitoring and alerts
3. ⬜ Create unit tests
4. ⬜ Add retry logic

### Long Term (Next 6 Months)
1. ⬜ Implement audit trail
2. ⬜ Automate year rollover
3. ⬜ Performance optimization
4. ⬜ Security enhancements

---

## Resources

- **Full Documentation**: [SEQUENCE_NUMBER_GENERATION.md](./SEQUENCE_NUMBER_GENERATION.md)
- **Code Locations**:
  - Case Numbers: `src/services/sequence-generator.service.ts`
  - Transaction Numbers: `src/lib/sequence-generator.ts`
  - Formatting: `src/lib/format-sequence.ts`
- **Database Schema**: `prisma/schema.prisma` (SequenceGenerator model)
- **Migration**: `migrations/add_case_number_sequence.sql`

---

## Contact

For questions or concerns about sequence number generation:
- Review the full technical documentation
- Check the troubleshooting guide
- Contact the development team

---

**Document Version**: 1.0  
**Last Updated**: January 7, 2026  
**Next Review**: April 2026
