# Predictive Failure Analysis Report
Generated: 2026-03-08T06:16:36.111Z

## Summary Statistics
- Total Sessions Analyzed: 330
- Crashes: 6 (1.8%)
- Rate Limit Events: 127 (38.5%)
- Recovery Events: 0
- Overall Success Rate: 98.2%

## Failure Pattern Model
| Pattern | Failure Probability | Risk Level |
|---------|-------------------|------------|
| Rate Limit Cascade | 97.0% | Critical |
| Undefined Access | 1.5% | Medium |
| FATAL CRASH | 0.8% | Medium |

## Top Risk Indicators
- **Rate Limit Cascade**: Rate limit hit, 429, Too Many Requests...
- **Test Failure**: FAIL, AssertionError, TypeError...
- **FATAL CRASH**: FATAL CRASH, Cannot read properties, process.exit...
- **Recovery Event**: CRASH VAULT, RECOVERY EVENT, COMMITTED_FAILURE...
- **Undefined Access**: undefined, reading, TypeError: Cannot read...

## Recommendations
1. Monitor for rate limit cascades - they often precede session instability
2. Test failures should trigger immediate investigation
3. Recovery events indicate a system under stress - analyze preceding context
4. FATAL CRASH events strongly correlate with undefined object access patterns

---
*Analysis by PredictiveFailureAnalyzer v1.0*
