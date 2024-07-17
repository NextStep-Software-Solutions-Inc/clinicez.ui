import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
const prodCert = fs.readFileSync('./certificates/clinic-ez.pem');
const devCert = fs.readFileSync('./certificates/dev-clinicez.pem');

const cert = process.env.NODE_ENV === 'production' ? prodCert : devCert;

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