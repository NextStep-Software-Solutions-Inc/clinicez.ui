import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';


const prodCert = fs.readFileSync(path.join(process.cwd(), "certificates/clinic-ez.pem"));
const devCert = fs.readFileSync(path.join(process.cwd(), "certificates/dev-clinicez.pem"));

const cert = process.env.NEXT_PUBLIC_BUILD_ENV === 'production' ? prodCert : devCert;

export const withJwtAuth = <T extends Record<string, unknown>>(handler: (req: NextRequest, context: { params: Promise<T> }) => Promise<NextResponse>) => {

  return async (req: NextRequest, context: { params: Promise<T> }) => {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, {
        status: 401
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      jwt.verify(token, cert, { algorithms: ['RS256'], ignoreExpiration: false });
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, {
        status: 401
      });
    }

    return handler(req, context);
  };
};