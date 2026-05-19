import { SHEET_ID } from "../constants";
import { getAccessToken } from "./auth";

let _lastRequest = 0;
export async function rateLimitedFetch(url: string, options: RequestInit, retries = 4): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, _lastRequest + 600 - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  _lastRequest = Date.now();
  const res = await fetch(url, options);
  if (res.status === 429 && retries > 0) {
    await new Promise((r) => setTimeout(r, 12000));
    return rateLimitedFetch(url, options, retries - 1);
  }
  return res;
}

export async function sheetsGet(sheetName: string, range: string, sheetId = SHEET_ID): Promise<any[][]> {
  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!${range}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const res = await rateLimitedFetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Sheets error: ${res.status}`);
  return (await res.json()).values || [];
}

export async function sheetsWrite(sheetName: string, range: string, values: any[][]): Promise<any> {
  const token = await getAccessToken();
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}!${range}:clear`;
  await rateLimitedFetch(clearUrl, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}!${range}?valueInputOption=RAW`;
  const res = await rateLimitedFetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ range: `${sheetName}!${range}`, majorDimension: "ROWS", values }),
  });
  if (!res.ok) throw new Error(`Sheets write error: ${res.status}`);
  return await res.json();
}

const _sheetsMeta: Record<string, any[]> = {};
export async function getSheetsMeta(sheetId: string): Promise<any[]> {
  if (_sheetsMeta[sheetId]) return _sheetsMeta[sheetId];
  const token = await getAccessToken();
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
  const metaRes = await rateLimitedFetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!metaRes.ok) throw new Error(`Meta error: ${metaRes.status}`);
  const meta = await metaRes.json();
  _sheetsMeta[sheetId] = meta.sheets;
  return meta.sheets;
}

export async function sheetsGetAllMulti(sheetNames: string[], sheetId: string): Promise<Record<string, any[][]>> {
  const token = await getAccessToken();
  const sheets = await getSheetsMeta(sheetId);
  const ranges = sheetNames.map((name) => {
    const sheet = sheets.find((s: any) => s.properties.title === name);
    if (!sheet) throw new Error(`Aba "${name}" não encontrada`);
    const colCount = Math.min(sheet.properties.gridProperties.columnCount, 29);
    const lastCol = colCount <= 26
      ? String.fromCharCode(64 + colCount)
      : "A" + String.fromCharCode(64 + colCount - 26);
    return encodeURIComponent(`${name}!A1:${lastCol}15000`);
  });
  const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?includeGridData=true&${ranges.map((r) => "ranges=" + r).join("&")}&fields=sheets(properties.title,data.rowData.values.effectiveValue)`;
  const dataRes = await rateLimitedFetch(dataUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!dataRes.ok) throw new Error(`GridData error: ${dataRes.status}`);
  const data = await dataRes.json();
  const parseRows = (rows: any[]) =>
    (rows || [])
      .map((row: any) =>
        (row.values || []).map((cell: any) => {
          const ev = cell?.effectiveValue;
          if (!ev) return null;
          if (ev.numberValue !== undefined) return ev.numberValue;
          if (ev.stringValue !== undefined) return ev.stringValue;
          return null;
        })
      )
      .filter((r: any[]) => r.some((c) => c !== null));
  const result: Record<string, any[][]> = {};
  (data.sheets || []).forEach((s: any) => {
    result[s.properties.title] = parseRows(s.data?.[0]?.rowData);
  });
  return result;
}

export async function sheetsGetAll(sheetName: string, sheetId: string): Promise<any[][]> {
  const result = await sheetsGetAllMulti([sheetName], sheetId);
  return result[sheetName] || [];
}
