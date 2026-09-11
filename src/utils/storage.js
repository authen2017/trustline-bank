import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

const CURRENT_USER_KEY = "trustlineCurrentUser";
const PENDING_USER_KEY = "trustlinePendingUser";

// ---------- ID HELPERS (unchanged, no storage involved) ----------

export function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// ---------- CORE USER STORAGE (now Firestore) ----------
// Each user document lives at: users/{email}

export async function getUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data());
}

export async function getUserByEmail(email) {
  const snap = await getDoc(doc(db, "users", email));
  return snap.exists() ? snap.data() : null;
}

export async function createUser(newUser) {
  await setDoc(doc(db, "users", newUser.email), newUser);
  return newUser;
}

export async function updateUser(updatedUser) {
  await setDoc(doc(db, "users", updatedUser.email), updatedUser);
  setCurrentUser(updatedUser);
  return updatedUser;
}

export async function findUserByIdentifier(identifier) {
  // Try as a direct email lookup first (fast path)
  const direct = await getUserByEmail(identifier);
  if (direct) return direct;

  // Otherwise, search all users for a matching account number
  const users = await getUsers();
  return (
    users.find((u) =>
      (u.accounts || []).some((a) => a.accountNumber === identifier)
    ) || null
  );
}

// ---------- SESSION (stays in localStorage — this is per-device, not shared data) ----------

export function setPendingUser(user) {
  localStorage.setItem(PENDING_USER_KEY, JSON.stringify(user));
}

export function getPendingUser() {
  const raw = localStorage.getItem(PENDING_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearPendingUser() {
  localStorage.removeItem(PENDING_USER_KEY);
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export async function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  const stored = JSON.parse(raw);
  // Re-fetch the freshest copy from Firestore in case another
  // device/admin updated balances/transactions since login.
  const fresh = await getUserByEmail(stored.email);
  return fresh || stored;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ---------- ACCOUNT / TRANSACTION HELPERS (pure functions, unchanged) ----------

export function getAccountById(user, accountId) {
  return (user.accounts || []).find((a) => a.id === accountId);
}

export function getAllTransactions(user) {
  return (user.transactions || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Mutates the account balance on `user` and appends a transaction record.
// Caller is responsible for passing a user object it's OK to mutate,
// then calling updateUser() afterward to persist it.
export function recordTransaction(
  user,
  { accountId, description, type, amount, status = "Completed", transferId = null, counterparty = null }
) {
  const account = getAccountById(user, accountId);
  if (!account) throw new Error("Account not found");

  const newBalance = type === "credit" ? account.balance + amount : account.balance - amount;
  account.balance = newBalance;

  const transaction = {
    id: generateId("txn"),
    accountId,
    date: new Date().toISOString(),
    description,
    type,
    amount,
    balanceAfter: newBalance,
    status,
    transferId,
    counterparty,
  };

  user.transactions = [...(user.transactions || []), transaction];
  return { user, transaction };
}

// ---------- ADMIN-FACING WRITES (now Firestore) ----------

export async function setAccountBalance(customerEmail, accountId, newBalance) {
  const user = await getUserByEmail(customerEmail);
  if (!user) return null;

  const account = (user.accounts || []).find((a) => a.id === accountId);
  if (!account) return null;

  const oldBalance = account.balance;
  const diff = newBalance - oldBalance;
  account.balance = newBalance;

  const transaction = {
    id: generateId("txn"),
    accountId,
    date: new Date().toISOString(),
    description: "Admin balance adjustment",
    type: diff >= 0 ? "credit" : "debit",
    amount: Math.abs(diff),
    balanceAfter: newBalance,
    status: "Completed",
    transferId: null,
    counterparty: "Admin",
  };
  user.transactions = [...(user.transactions || []), transaction];

  await setDoc(doc(db, "users", customerEmail), user);

  const current = await getCurrentUser();
  if (current && current.email === customerEmail) {
    setCurrentUser(user);
  }

  return account;
}

export async function toggleAccountStatus(customerEmail, accountId) {
  const user = await getUserByEmail(customerEmail);
  if (!user) return null;

  const account = (user.accounts || []).find((a) => a.id === accountId);
  if (!account) return null;

  account.status = account.status === "Active" ? "Inactive" : "Active";
  await setDoc(doc(db, "users", customerEmail), user);
  return account.status;
}

export function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

// ---------- ADMIN (session stays local — credentials are hardcoded, no DB needed) ----------

const ADMIN_SESSION_KEY = "trustlineAdminSession";
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

export function adminLogin(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
    return true;
  }
  return false;
}

export function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

// ---------- ADMIN READ-HEAVY QUERIES (now Firestore, all async) ----------

export async function getAllAccountsFlat() {
  const users = await getUsers();
  const rows = [];
  users.forEach((u) => {
    (u.accounts || []).forEach((a) => {
      rows.push({ ...a, customerName: u.fullName, customerEmail: u.email });
    });
  });
  return rows;
}

export async function getAllTransactionsFlat() {
  const users = await getUsers();
  const rows = [];
  users.forEach((u) => {
    (u.transactions || []).forEach((t) => {
      rows.push({ ...t, customerName: u.fullName, customerEmail: u.email });
    });
  });
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getSystemStats() {
  const users = await getUsers();
  const accounts = await getAllAccountsFlat();
  const transactions = await getAllTransactionsFlat();

  const transfers = transactions.filter((t) => t.transferId);
  const billPayments = transactions.filter((t) => (t.description || "").startsWith("Bill payment"));

  return {
    totalCustomers: users.length,
    totalAccounts: accounts.length,
    totalTransactions: transactions.length,
    totalTransfers: transfers.length,
    totalBillPayments: billPayments.length,
    totalDeposits: transactions.filter((t) => t.type === "credit").length,
    totalWithdrawals: transactions.filter((t) => t.type === "debit").length,
  };
}

export function isSuspicious(transaction) {
  return transaction.amount >= 5000;
}

export function getDailyActivityLast7Days(transactions) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  return days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = transactions.filter((t) => {
      const td = new Date(t.date);
      return td >= day && td < next;
    }).length;
    return { label: day.toLocaleDateString(undefined, { weekday: "short" }), count };
  });
}
