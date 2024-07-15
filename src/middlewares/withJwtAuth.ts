import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJVE134K5k0LisMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1jbGluaWNlei51cy5hdXRoMC5jb20wHhcNMjQwNTMwMDcxMzUyWhcN
MzgwMjA2MDcxMzUyWjAkMSIwIAYDVQQDExlkZXYtY2xpbmljZXoudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq0sJ7h29rh/niMsk
rcQ98V049HDKTSlsx5xEe2GOfDA1QJmQ3Euz8wkXJDZz2QXTL+0RKQpFRvo5V9gc
PHf6hHxGQSKzVMNy7njfLvIY5VHCmtegFCIPn0Em9DRQNDCkUhkGAOpEdIK++7It
94FA+Vqv3K1g9UyOZzxb+8bBbyyB2ROONbxFDPqqXLNS2lLHzs0036P3Ifx3B7ak
njeJyAgYO7n3b3sXZcA09ckaMC2cg0AW9WXuTevysQhhuhNrI663uYIJ/q+xWO7J
5AxkBMPEKrSQdIbMVGoyN4ZH2ryN2q2xHcNyeOiGPO05fgfrfk0GlwBP8WTP16MS
kb8swQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR1k2/8d8q1
GlwMIaU5GaTyCNQqBTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AIWj72avfKhja3A1xznrXeHFwudj0Qlo9K/KQfs+wCAacw0EgQ7x9KmUpDWgzxUh
uDNHn1jgxrnA23ln6e3DPQLwLRUYbJ63xaLZjPBN9JtAazJv2oyZ3RkEsDgS4hmR
X3apbYgqQaFsjSZj6v+7nQFy1CwplxoTRaSwG1Ih52/HKSh/dtIfjc68Jv7/Xs34
a9IEboA+nqsjzLeGwdNt7IxWob+qJIM4e/Jkh/ThZQY6rVnhdaU8rsasz0GM6yKe
jAcjFoXc8zqMoPA9UUBAzl9jMHX3okepqqubWnAZs1GN9nHM+JORqT/YzUNfwhEB
BJU9ybdnl2wSWMtuZ7Y6jeI=
-----END CERTIFICATE-----`;

export const withJwtAuth = (handler: (req: NextRequest, ...rest: any) => Promise<NextResponse>) => {

  return async (req: NextRequest, ...rest: any) => {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, {
        status: 401
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      jwt.verify(token, cert, { algorithms: ['RS256'], ignoreExpiration: false});
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, {
        status: 401
      });
    }

    return handler(req, ...rest);
  };
};