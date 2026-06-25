import crypto from 'crypto';
import { soap } from 'strong-soap';
import { YakapSoapClient } from './types';

const CIPHER_IV_LEN = 16;

function getPassphraseHash(passphrase: string): Buffer {
  return crypto.createHash('sha256').update(passphrase, 'utf8').digest();
}

function pad(xmlBuffer: Buffer, blocksize: number): Buffer {
  const padLen = blocksize - (xmlBuffer.length % blocksize);
  const padding = Buffer.alloc(padLen);
  padding.fill(0);
  padding[padLen - 1] = padLen;
  return Buffer.concat([xmlBuffer, padding]);
}

export function encryptReport(xml: string, passphrase: string): string {
  const cipherKey = getPassphraseHash(passphrase);
  const iv = crypto.randomBytes(CIPHER_IV_LEN);

  const xmlBuffer = Buffer.from(xml, 'utf8');
  const paddedXml = pad(xmlBuffer, 32);

  const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
  cipher.setAutoPadding(false);
  let encrypted = cipher.update(paddedXml);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const sha256Hash = crypto.createHash('sha256').update(xmlBuffer).digest('hex');

  const jsonPayload = {
    docMimeType: "text/xml",
    hash: sha256Hash,
    key1: "",
    key2: "",
    iv: iv.toString('base64'),
    doc: encrypted.toString('base64')
  };

  return JSON.stringify(jsonPayload);
}

export function decryptReport(jsonString: string, passphrase: string): string {
  const json = JSON.parse(jsonString);
  const iv = Buffer.from(json.iv, 'base64');
  const doc = Buffer.from(json.doc, 'base64');

  const cipherKey = getPassphraseHash(passphrase);
  const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
  decipher.setAutoPadding(false);

  let decrypted = decipher.update(doc);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  let nullIdx = decrypted.length - 1;
  while (nullIdx >= 0 && decrypted[nullIdx] !== 0) {
    nullIdx--;
  }

  if (nullIdx !== -1) {
    decrypted = decrypted.subarray(0, nullIdx);
  }

  return decrypted.toString('utf8');
}

function parseYakapResponse(responseObj: Record<string, unknown>) {
  if (!responseObj) return responseObj;

  const rawReturn = responseObj.return ||
    responseObj.getTokenReturn ||
    responseObj.isMemberDependentRegisteredReturn ||
    responseObj.extractRegistrationListReturn ||
    responseObj.isATCValidReturn ||
    responseObj.validateReportReturn ||
    responseObj.submitReportReturn ||
    responseObj.checkUploadStatusReturn ||
    responseObj;

  if (typeof rawReturn === 'string' && rawReturn.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawReturn);
      return parsed; // Return the full { success, message, result } object
    } catch (e: unknown) {
      return rawReturn;
    }
  }

  return rawReturn;
}

export class YakapApiClient {
  private client: YakapSoapClient | null = null;
  private wsdlUrl: string;

  constructor() {
    this.wsdlUrl = process.env.PHILHEALTH_KONSULTA_WSDL_URL || 'https://staging.philhealth.gov.ph/KONSULTA/SOAP?wsdl';
  }

  private async getClient() {
    if (!this.client) {
      const wsdlRes = await fetch(this.wsdlUrl);
      let wsdlString = await wsdlRes.text();

      wsdlString = wsdlString.replace(/http:\/\/staging\.philhealth\.gov\.ph:80/g, 'https://staging.philhealth.gov.ph');

      const endpoint = (process.env.PHILHEALTH_KONSULTA_ENDPOINT || 'https://staging.philhealth.gov.ph/KONSULTA/SOAP').trim();

      this.client = await new Promise<YakapSoapClient>((resolve, reject) => {
        const wsdl = new soap.WSDL(wsdlString, this.wsdlUrl, {});
        wsdl.load((err: Error | null) => {
          if (err) return reject(err);
          const c = new soap.Client(wsdl, endpoint, {});

          c.on('request', (xml: string) => {
            console.log("\n================ SOAP REQUEST ================\n");
            console.log(xml);
            console.log("\n==============================================\n");
          });

          c.on('response', (xml: string) => {
            console.log("\n================ SOAP RESPONSE ================\n");
            console.log(xml);
            console.log("\n===============================================\n");
          });

          resolve(c as unknown as YakapSoapClient);
        });
      });
    }
    return this.client;
  }

  private setToken(client: YakapSoapClient, token: string) {
    client.clearHttpHeaders();
    client.addHttpHeader('Token', token);
  }

  async getToken(pUsername: string, pUserPassword: string, pSoftwareCertificationId: string, pHospitalCode: string) {
    const client = await this.getClient();
    client.clearHttpHeaders();
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      client.getToken({
        pUsername,
        pUserPassword,
        pSoftwareCertificationId,
        pHospitalCode
      }, (err: Error | null, res: Record<string, unknown>) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    return parseYakapResponse(result);
  }

  async isMemberDependentRegistered(pPIN: string, pType: string, token: string) {
    const client = await this.getClient();
    this.setToken(client, token);
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      client.isMemberDependentRegistered({ pPIN, pType }, (err: Error | null, res: Record<string, unknown>) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    return parseYakapResponse(result);
  }

  async extractRegistrationList(pStartDate: string, pEndDate: string, token: string, cipherKey: string) {
    const client = await this.getClient();
    this.setToken(client, token);
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      client.extractRegistrationList({ pStartDate, pEndDate }, (err: Error | null, res: Record<string, unknown>) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    const responseData = parseYakapResponse(result);
    // If responseData is a string (e.g. encrypted JSON string) or object, we need to decrypt it if it has iv and doc
    const responseString = typeof responseData === 'object' ? JSON.stringify(responseData) : String(responseData);
    if (responseString.includes('"iv"') && responseString.includes('"doc"')) {
      try {
        return decryptReport(responseString, cipherKey);
      } catch (e) {
        console.error("Failed to decrypt extractRegistrationList response", e);
        return responseData;
      }
    }
    return responseData;
  }

  async isATCValid(pPIN: string, pATC: string, pEffectivityDate: string, token: string) {
    const client = await this.getClient();
    this.setToken(client, token);
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      client.isATCValid({ pPIN, pATC, pEffectivityDate }, (err: Error | null, res: Record<string, unknown>) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    return parseYakapResponse(result);
  }

  private decryptYakapResponsePayload(responseData: any, cipherKey: string) {
    if (typeof responseData !== 'object' || responseData === null) {
      return responseData;
    }

    // 1. If it's a direct JSON with encryptedxmlerrors (e.g. validateReport failure)
    if (responseData.encryptedxmlerrors && responseData.encryptedxmlerrors.iv && responseData.encryptedxmlerrors.doc) {
      try {
        const decryptedXml = decryptReport(JSON.stringify(responseData.encryptedxmlerrors), cipherKey);
        return { ...responseData, decryptedErrors: decryptedXml };
      } catch (e) {
        // ignore
      }
    }

    // 2. If it's a direct JSON with encryptedxml (e.g. validateReport success?)
    if (responseData.encryptedxml && responseData.encryptedxml.iv && responseData.encryptedxml.doc) {
      try {
        const decryptedXml = decryptReport(JSON.stringify(responseData.encryptedxml), cipherKey);
        return { ...responseData, decryptedResult: decryptedXml };
      } catch (e) {
        // ignore
      }
    }

    // 3. If it's a JWT in responseData.result
    if (typeof responseData.result === 'string') {
      const parts = responseData.result.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          
          if (payload.encryptedxmlerrors) {
            const errorPayload = typeof payload.encryptedxmlerrors === 'string' 
              ? payload.encryptedxmlerrors 
              : JSON.stringify(payload.encryptedxmlerrors);
            const decryptedXml = decryptReport(errorPayload, cipherKey);
            return { ...responseData, decryptedErrors: decryptedXml };
          }
          
          if (payload.doc && payload.iv) {
             const decryptedStr = decryptReport(JSON.stringify(payload), cipherKey);
             return { ...responseData, decryptedResult: decryptedStr };
          }
          
          return { ...responseData, decodedJwtPayload: payload };
        } catch (e) {
          // ignore parsing error
        }
      }
    }
    
    // 4. Fallback if the top level object IS the encrypted payload { iv, doc }
    if (responseData.iv && responseData.doc) {
      try {
        const decryptedStr = decryptReport(JSON.stringify(responseData), cipherKey);
        return { ...responseData, decryptedResult: decryptedStr };
      } catch (e) {
        // ignore
      }
    }

    return responseData;
  }

  async validateReport(pReportXml: string, pReportTagging: string, token: string, cipherKey: string) {
    const client = await this.getClient();
    this.setToken(client, token);

    let pReport = "";
    if (pReportXml.trim().startsWith('{') && pReportXml.includes('"iv"') && pReportXml.includes('"doc"')) {
      pReport = pReportXml; // already encrypted
    } else {
      pReport = encryptReport(pReportXml, cipherKey);
    }
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      client.validateReport({ pReport, pReportTagging }, (err: Error | null, res: Record<string, unknown>) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    const responseData = parseYakapResponse(result);
    return this.decryptYakapResponsePayload(responseData, cipherKey);
  }

  async submitReport(pTransmittalID: string, pReportXml: string, pReportTagging: string, token: string, cipherKey: string) {
    const client = await this.getClient();
    this.setToken(client, token);

    let pReport = "";
    if (pReportXml.trim().startsWith('{') && pReportXml.includes('"iv"') && pReportXml.includes('"doc"')) {
      pReport = pReportXml; // already encrypted
    } else {
      pReport = encryptReport(pReportXml, cipherKey);
    }
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      client.submitReport({ pTransmittalID, pReport, pReportTagging }, (err: Error | null, res: Record<string, unknown>) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    const responseData = parseYakapResponse(result);
    return this.decryptYakapResponsePayload(responseData, cipherKey);
  }

  async checkUploadStatus(pUsername: string, pUserPassword: string, pHospitalCode: string, pStartDate: string, pEndDate: string, pTransmittalID: string, pReportXml: string, token: string, cipherKey: string) {
    const client = await this.getClient();
    this.setToken(client, token);

    let pReport = "";
    if (pReportXml) {
      pReport = encryptReport(pReportXml, cipherKey);
    }

    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      client.checkUploadStatus({ pUsername, pUserPassword, pHospitalCode, pStartDate, pEndDate, pTransmittalID, pReport }, (err: Error | null, res: Record<string, unknown>) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    const responseData = parseYakapResponse(result);
    const responseString = typeof responseData === 'object' ? JSON.stringify(responseData) : String(responseData);

    if (responseString.includes('"iv"') && responseString.includes('"doc"')) {
      try {
        return decryptReport(responseString, cipherKey);
      } catch (e) {
        console.error("Failed to decrypt checkUploadStatus response", e);
        return responseData;
      }
    }
    return responseData;
  }
}
