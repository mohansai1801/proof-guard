// Shared in-memory certificate store for linked demo across all portals

export interface MockCertificate {
  certificateId: string;
  recipientName: string;
  studentId: string;
  studentPasscode: string;
  degree: string;
  institution: string;
  gpa: string;
  issueDate: string;
  txHash: string;
  blockNumber: number;
  ipfsHash: string;
  authCode: string;
  status: "Pending" | "Anchoring..." | "Anchored";
}

// Seed data for instant demo
const SEED_CERTS: MockCertificate[] = [
  {
    certificateId: "PV-2026-48050",
    recipientName: "Alex Johnson",
    studentId: "STU-2026-001",
    studentPasscode: "pass123",
    degree: "B.Tech Computer Science",
    institution: "MIT University",
    gpa: "3.87",
    issueDate: "2026-03-04",
    txHash: "0x7a3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8b9c",
    blockNumber: 52847291,
    ipfsHash: "QmX7bVbzU4rYjKnLp5e3hDiPmC4kWjqYbFnDqK9aVdW8Xc",
    authCode: "482917",
    status: "Anchored",
  },
  {
    certificateId: "PV-2026-31207",
    recipientName: "Sarah Williams",
    studentId: "STU-2026-002",
    studentPasscode: "pass123",
    degree: "M.Sc Data Science",
    institution: "Stanford University",
    gpa: "3.92",
    issueDate: "2026-03-04",
    txHash: "0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
    blockNumber: 52847305,
    ipfsHash: "QmY8cWbzV5sZlKoMq6f4iEqNdD5lXkRzCgGeEbUaXeY9Yd",
    authCode: "739201",
    status: "Anchored",
  },
  {
    certificateId: "PV-2026-67834",
    recipientName: "James Chen",
    studentId: "STU-2026-003",
    studentPasscode: "pass123",
    degree: "B.A Economics",
    institution: "Harvard University",
    gpa: "3.75",
    issueDate: "2026-03-03",
    txHash: "0x9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e",
    blockNumber: 52846199,
    ipfsHash: "QmZ9dXcaW6tAmLoNr7g5jFrOeE6mYlStDhHfFcVbZfZ0Ze",
    authCode: "156843",
    status: "Anchored",
  },
];

// ---- Reactive store ----
let certificates: MockCertificate[] = [...SEED_CERTS];
let listeners: Set<() => void> = new Set();

// Track which students have active unlock sessions (studentId → expiry timestamp)
let activeSessions: Map<string, number> = new Map();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// --- Getters ---
export function getAllCertificates(): MockCertificate[] {
  return certificates;
}

export function getCertsByStudentId(studentId: string): MockCertificate[] {
  return certificates.filter((c) => c.studentId.toLowerCase() === studentId.toLowerCase());
}

export function getCertByCertificateId(certId: string): MockCertificate | undefined {
  const normalizedInput = certId.trim().replace(/\s+/g, "").toUpperCase();
  return certificates.find((c) => c.certificateId.toUpperCase() === normalizedInput);
}

export function validateStudentLogin(studentId: string, passcode: string): boolean {
  return certificates.some(
    (c) => c.studentId.toLowerCase() === studentId.toLowerCase() && c.studentPasscode === passcode
  );
}

// --- Mutations ---
export function addCertificate(cert: MockCertificate) {
  certificates = [cert, ...certificates];
  notify();
}

export function updateCertStatus(certId: string, status: MockCertificate["status"]) {
  certificates = certificates.map((c) =>
    c.certificateId === certId ? { ...c, status } : c
  );
  notify();
}

// --- Session tracking (student unlock state visible to verifier) ---
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in ms

export function startSession(certId: string) {
  activeSessions.set(certId, Date.now() + SESSION_DURATION);
  notify();
}

export function endSession(certId: string) {
  activeSessions.delete(certId);
  notify();
}

export function isSessionActive(certId: string): boolean {
  const expiry = activeSessions.get(certId);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    activeSessions.delete(certId);
    return false;
  }
  return true;
}

export function getSessionExpiry(certId: string): number | null {
  return activeSessions.get(certId) ?? null;
}
