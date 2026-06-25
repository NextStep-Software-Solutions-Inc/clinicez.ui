"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getYakapTokenAction,
  isMemberDependentRegisteredAction,
  extractRegistrationListLegacyAction as extractRegistrationListAction,
  isATCValidAction,
  validateReportAction,
  submitReportAction
} from "@/actions/philhealth-yakap.actions";

export default function TestYakapPage() {
  const params = useParams();
  const clinicUid = params.clinicUid as string;
  const [token, setToken] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  
  // Args
  const [pin, setPin] = useState("123456789012");
  const [memberType, setMemberType] = useState("MM");
  
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-01-31");
  
  const [atcPin, setAtcPin] = useState("123456789012");
  const [atcCode, setAtcCode] = useState("ATC123");
  const [effectivityDate, setEffectivityDate] = useState("2024-01-01");

  const [reportXml, setReportXml] = useState("<report></report>");
  const [reportTagging, setReportTagging] = useState("1");
  const [transmittalId, setTransmittalId] = useState("TRANS123");

  const [lastDecrypted, setLastDecrypted] = useState<string | null>(null);

  const log = (msg: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev]); // Prepend so newest is at top
  };

  const handleResponse = (res: any) => {
    log(`Result: ${typeof res === 'object' ? JSON.stringify(res) : String(res)}`);
    if (res && typeof res === 'object') {
      if (res.decryptedErrors) setLastDecrypted(res.decryptedErrors);
      else if (res.decryptedResult) setLastDecrypted(res.decryptedResult);
      else if (res.decodedJwtPayload) setLastDecrypted(JSON.stringify(res.decodedJwtPayload, null, 2));
      else setLastDecrypted(null);
    }
  };

  const formatYakapDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${m}/${d}/${y}`;
  };

  const handleGetToken = async () => {
    try {
      log("Requesting Token...");
      const res = await getYakapTokenAction(clinicUid);
      handleResponse(res);
      if (res && typeof res === 'object' && res.result) {
        setToken(String(res.result));
      }
    } catch (e: unknown) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleCheckMember = async () => {
    try {
      log(`Checking member (PIN: ${pin}, Type: ${memberType})...`);
      const res = await isMemberDependentRegisteredAction(clinicUid, token, pin, memberType);
      handleResponse(res);
    } catch (e: unknown) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleExtractList = async () => {
    try {
      const fStart = formatYakapDate(startDate);
      const fEnd = formatYakapDate(endDate);
      log(`Extracting registration list (Dates: ${fStart} to ${fEnd})...`);
      const res = await extractRegistrationListAction(clinicUid, token, fStart, fEnd);
      handleResponse(res);
    } catch (e: unknown) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleCheckAtc = async () => {
    try {
      const fEffDate = formatYakapDate(effectivityDate);
      log(`Checking ATC Valid (PIN: ${atcPin}, ATC: ${atcCode}, Effectivity: ${fEffDate})...`);
      const res = await isATCValidAction(clinicUid, token, atcPin, atcCode, fEffDate);
      handleResponse(res);
    } catch (e: unknown) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleValidateReport = async () => {
    try {
      log(`Validating Report (Tag: ${reportTagging})...`);
      const res = await validateReportAction(clinicUid, token, reportXml, reportTagging);
      handleResponse(res);
    } catch (e: unknown) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSubmitReport = async () => {
    try {
      log(`Submitting Report (Transmittal: ${transmittalId}, Tag: ${reportTagging})...`);
      const res = await submitReportAction(clinicUid, token, transmittalId, reportXml, reportTagging);
      handleResponse(res);
    } catch (e: unknown) {
      log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-64px)] w-full max-w-7xl mx-auto flex flex-col gap-6 overflow-hidden">
      <h1 className="text-2xl font-bold shrink-0">PhilHealth Yakap API Test Page</h1>
      
      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* LEFT SIDE: SCROLLABLE METHODS */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4 pb-20">
          {/* GLOBAL SETTINGS */}
          <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-md border shrink-0">
            <h2 className="text-xl font-semibold">1. Global Authentication</h2>
            <div className="flex items-center gap-4">
              <label className="font-medium whitespace-nowrap">Current Token:</label>
              <input 
                type="text" 
                className="border p-2 rounded w-full font-mono text-sm" 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                placeholder="Fetch token first..."
              />
            </div>
            <div>
              <Button onClick={handleGetToken}>Get New Token</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
            {/* CHECK MEMBER */}
            <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-md border">
              <h2 className="text-lg font-semibold">isMemberDependentRegistered</h2>
              <div>
                <label className="block text-sm font-medium mb-1">PIN:</label>
                <input type="text" className="border p-2 rounded w-full" value={pin} onChange={(e) => setPin(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type:</label>
                <select className="border p-2 rounded w-full bg-white" value={memberType} onChange={(e) => setMemberType(e.target.value)}>
                  <option value="MM">MM - Member</option>
                  <option value="DD">DD - Dependent</option>
                </select>
              </div>
              <Button onClick={handleCheckMember} disabled={!token} className="w-full mt-auto">Check Member</Button>
            </div>

            {/* EXTRACT REG LIST */}
            <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-md border">
              <h2 className="text-lg font-semibold">extractRegistrationList</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date:</label>
                <input type="date" className="border p-2 rounded w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date:</label>
                <input type="date" className="border p-2 rounded w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button onClick={handleExtractList} disabled={!token} className="w-full mt-auto">Extract List</Button>
            </div>

            {/* IS ATC VALID */}
            <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-md border">
              <h2 className="text-lg font-semibold">isATCValid</h2>
              <div>
                <label className="block text-sm font-medium mb-1">PIN:</label>
                <input type="text" className="border p-2 rounded w-full" value={atcPin} onChange={(e) => setAtcPin(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">ATC Code:</label>
                  <input type="text" className="border p-2 rounded w-full" value={atcCode} onChange={(e) => setAtcCode(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Effectivity:</label>
                  <input type="date" className="border p-2 rounded w-full" value={effectivityDate} onChange={(e) => setEffectivityDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleCheckAtc} disabled={!token} className="w-full mt-auto">Check ATC</Button>
            </div>

            {/* VALIDATE REPORT */}
            <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-md border">
              <h2 className="text-lg font-semibold">validateReport</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Report Tagging:</label>
                <select className="border p-2 rounded w-full bg-white" value={reportTagging} onChange={(e) => setReportTagging(e.target.value)}>
                  <option value="1">1 - FPE</option>
                  <option value="2">2 - FPE + Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Report XML:</label>
                <textarea className="border p-2 rounded w-full h-24 font-mono text-xs" value={reportXml} onChange={(e) => setReportXml(e.target.value)} />
              </div>
              <Button onClick={handleValidateReport} disabled={!token} className="w-full mt-auto">Validate Report</Button>
            </div>

            {/* SUBMIT REPORT */}
            <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-md border col-span-1 lg:col-span-2">
              <h2 className="text-lg font-semibold">submitReport</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Transmittal ID:</label>
                  <input type="text" className="border p-2 rounded w-full" value={transmittalId} onChange={(e) => setTransmittalId(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Report Tagging:</label>
                  <select className="border p-2 rounded w-full bg-white" value={reportTagging} onChange={(e) => setReportTagging(e.target.value)}>
                    <option value="1">1 - FPE</option>
                    <option value="2">2 - FPE + Consultation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Report XML:</label>
                <textarea className="border p-2 rounded w-full h-32 font-mono text-xs" value={reportXml} onChange={(e) => setReportXml(e.target.value)} />
              </div>
              <Button onClick={handleSubmitReport} disabled={!token} className="w-full">Submit Report</Button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LOGS & DECRYPTED OUTPUT */}
        <div className="w-[400px] xl:w-[500px] flex flex-col shrink-0 gap-4">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className="text-lg font-semibold">Live Logs</h2>
              <Button variant="outline" size="sm" onClick={() => { setLogs([]); setLastDecrypted(null); }}>Clear</Button>
            </div>
            <div className="bg-black text-green-400 p-4 font-mono text-sm flex-1 overflow-y-auto rounded-md flex flex-col gap-2 shadow-inner">
              {logs.length === 0 && <div className="text-slate-500">No logs yet... Actions will appear here.</div>}
              {logs.map((l, i) => (
                <div key={i} className="border-b border-green-900/50 pb-2 break-all">{l}</div>
              ))}
            </div>
          </div>
          
          {/* DECRYPTED RESULT PANEL */}
          <div className="flex flex-col flex-1 overflow-hidden mt-2 bg-slate-50 p-4 rounded-md border">
            <h2 className="text-lg font-semibold mb-2 shrink-0 text-blue-700 flex items-center justify-between">
              Decrypted Response
              {lastDecrypted && (
                <span className="text-xs font-normal px-2 py-1 bg-blue-100 text-blue-800 rounded">Available</span>
              )}
            </h2>
            <div className="bg-white text-slate-800 p-4 font-mono text-xs flex-1 overflow-y-auto rounded-md border border-slate-200 shadow-inner">
              {lastDecrypted 
                ? (() => {
                    const syntaxHighlight = (json: string) => {
                      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                        let cls = 'text-blue-500'; // string
                        if (/^"/.test(match)) {
                          if (/:$/.test(match)) {
                            cls = 'text-indigo-600 font-semibold'; // key
                          } else {
                            cls = 'text-green-600'; // string value
                          }
                        } else if (/true|false/.test(match)) {
                          cls = 'text-orange-500'; // boolean
                        } else if (/null/.test(match)) {
                          cls = 'text-red-500'; // null
                        } else {
                          cls = 'text-teal-600'; // number
                        }
                        return `<span class="${cls}">${match}</span>`;
                      });
                    };

                    try {
                      const cleanStr = typeof lastDecrypted === 'string' ? lastDecrypted.replace(/\0/g, '').trim() : lastDecrypted;
                      const parsed = typeof cleanStr === 'string' ? JSON.parse(cleanStr) : cleanStr;
                      const prettyJson = JSON.stringify(parsed, null, 2);
                      return <pre className="whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: syntaxHighlight(prettyJson) }} />;
                    } catch (err) {
                      return <pre className="whitespace-pre-wrap break-all">{lastDecrypted}</pre>;
                    }
                  })() 
                : <span className="text-slate-400 italic">No decrypted response yet. Try Validate Report or Submit Report...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
