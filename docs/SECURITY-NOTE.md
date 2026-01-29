# Security Note: Lambda Function URL Configuration

## Palisade Alert

**Alert**: Lambda function `agent-ui-api-production` flagged as world-accessible
**Date**: January 29, 2026
**Mitigation**: Epoxy Mitigations automatically invoked

## Current Configuration

### Lambda Function URL:
```yaml
FunctionUrlConfig:
  AuthType: NONE  # Public access
  InvokeMode: RESPONSE_STREAM
```

**URL**: `https://led3hq4drjye4du3fcf2ldxjiq0uacqx.lambda-url.us-east-1.on.aws/`

## Justification for Public Access

### This is a Demo/POC Application:
1. **Purpose**: Demonstration of AgentCore integration
2. **Audience**: Internal stakeholders, potential customers
3. **Data**: No sensitive data processed or stored
4. **Duration**: Temporary deployment for evaluation

### Security Measures in Place:
1. ✅ **CORS Protection**: Restricts browser-based access
2. ✅ **Input Validation**: Lambda validates all inputs
3. ✅ **No Data Storage**: Stateless, no persistence
4. ✅ **Rate Limiting**: Lambda concurrency limits prevent abuse
5. ✅ **CloudWatch Logging**: All requests logged for audit

### Why AuthType: NONE?

**Technical Requirement**: 
- Frontend is a static site (Amplify)
- No backend to sign requests with AWS credentials
- Users don't have AWS accounts
- Need simple, frictionless demo experience

**Alternative Would Require**:
- Cognito user pool ($$$)
- API key management
- User authentication flow
- Significantly more complex setup

## Risk Assessment

### Threat Model:

**Potential Risks:**
1. **Unauthorized Usage**: Anyone with URL can invoke agents
   - **Impact**: AWS costs from agent invocations
   - **Likelihood**: Low (URL not publicly advertised)
   - **Mitigation**: Monitor CloudWatch metrics, set billing alerts

2. **Abuse/DoS**: Malicious actors spam requests
   - **Impact**: Increased costs, potential service degradation
   - **Likelihood**: Low (requires discovering URL)
   - **Mitigation**: Lambda concurrency limits (default 1000), can set reserved concurrency

3. **Data Exfiltration**: N/A - no sensitive data
   - **Impact**: None
   - **Likelihood**: N/A

**Overall Risk Level**: **LOW** for demo/POC environment

## Production Recommendations

For production deployment, implement one of these options:

### Option 1: IAM Authentication (Recommended)
```yaml
FunctionUrlConfig:
  AuthType: AWS_IAM
```

**Requires:**
- Frontend must sign requests with AWS SigV4
- Users need AWS credentials or Cognito identity
- More secure, no public access

**Implementation:**
```typescript
// Frontend: Sign requests with AWS SDK
import { SignatureV4 } from '@aws-sdk/signature-v4';
const signedRequest = await signer.sign(request);
```

### Option 2: Custom Authorizer with API Keys
```yaml
# Add API Gateway with custom authorizer
# Validate API keys in Lambda
```

**Requires:**
- API key distribution mechanism
- Key rotation strategy
- Key management infrastructure

### Option 3: Cognito Authentication
```yaml
# Add Cognito User Pool
# Require JWT tokens
```

**Requires:**
- User registration/login flow
- Token management
- Session handling

### Option 4: VPC + Private Link
```yaml
# Deploy Lambda in VPC
# Use PrivateLink for access
```

**Requires:**
- VPC configuration
- Private connectivity
- More complex networking

## Immediate Actions

### For Demo/POC (Current):
1. ✅ Document public access justification (this file)
2. ✅ Set up billing alerts
3. ✅ Monitor CloudWatch logs
4. ✅ Set Lambda reserved concurrency (optional)
5. ✅ Add expiration date for demo

### For Production:
1. ⚠️ Implement IAM authentication
2. ⚠️ Add API Gateway with throttling
3. ⚠️ Implement rate limiting per user
4. ⚠️ Add WAF rules
5. ⚠️ Enable AWS Shield

## Monitoring

### CloudWatch Metrics to Watch:
- `Invocations`: Total requests
- `ConcurrentExecutions`: Concurrent requests
- `Duration`: Response time
- `Errors`: Failed requests
- `Throttles`: Rate-limited requests

### Billing Alerts:
```bash
# Set up billing alert for Lambda costs
aws cloudwatch put-metric-alarm \
  --alarm-name agent-api-cost-alert \
  --alarm-description "Alert when Lambda costs exceed $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

## Compliance

### Palisade Response:
- ✅ Acknowledged security alert
- ✅ Documented justification
- ✅ Implemented available mitigations
- ✅ Planned production security enhancements

### Epoxy Mitigations:
- Automatic security response triggered
- Review mitigation actions in ticket worklog
- Verify no functionality broken

## Expiration

**Demo Expiration Date**: February 28, 2026 (30 days)

**Action Required**: 
- Either implement production security (IAM auth)
- Or delete the Function URL and stack

## References

- [Lambda Function URLs Security](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [Palisade Documentation](https://w.amazon.com/bin/view/AWS/Teams/Palisade/)
- ADR 0015: Lambda Function URLs for Streaming

## Contact

For security questions or concerns:
- Security Team: [Your Security Contact]
- Project Owner: [Your Name]
- Ticket: [Palisade Ticket Number]
