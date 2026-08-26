const USERS_KEY = "trustlineUsers";
const CURRENT_USER_KEY = "trustlineCurrentUser";
const PENDING_USER_KEY = "trustlinePendingUser";

// custumer

export function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByIdentifier(identifier) {
  const users = getUsers();
  return users.find(
    (u) =>
      u.email === identifier ||
      (u.accounts || []).some((a) => a.accountNumber === identifier)
  );
}

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

export function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  const stored = JSON.parse(raw);
  // Re-fetch the freshest copy from the users list in case another
  // page updated balances/transactions since login.
  const users = getUsers();
  const fresh = users.find((u) => u.email === stored.email);
  return fresh || stored;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function updateUser(updatedUser) {
  const users = getUsers();
  const index = users.findIndex((u) => u.email === updatedUser.email);
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }
  setCurrentUser(updatedUser);
}

export function getAccountById(user, accountId) {
  return (user.accounts || []).find((a) => a.id === accountId);
}

export function getAllTransactions(user) {
  return (user.transactions || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Mutates the account balance on `user` and appends a transaction record.
// Caller is responsible for passing a user object it's OK to mutate
// (Transfer/PayBill build a shallow copy before calling this).
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
    type, // "credit" | "debit"
    amount,
    balanceAfter: newBalance,
    status,
    transferId,
    counterparty,
  };

  user.transactions = [...(user.transactions || []), transaction];
  return { user, transaction };
}

export function setAccountBalance(customerEmail, accountId, newBalance) {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === customerEmail);
  if (userIndex === -1) return null;

  const account = users[userIndex].accounts.find((a) => a.id === accountId);
  if (!account) return null;

  const oldBalance = account.balance;
  const diff = newBalance - oldBalance;
  account.balance = newBalance;

  // Log it as a transaction so it shows up in history/statements
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
  users[userIndex].transactions = [...(users[userIndex].transactions || []), transaction];

  saveUsers(users);

  // Keep the logged-in session in sync if this is the currently logged-in user
  const current = getCurrentUser();
  if (current && current.email === customerEmail) {
    setCurrentUser(users[userIndex]);
  }

  return account;
}

export function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}
// ---------- ADMIN ----------

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

export function getAllAccountsFlat() {
  const users = getUsers();
  const rows = [];
  users.forEach((u) => {
    (u.accounts || []).forEach((a) => {
      rows.push({ ...a, customerName: u.fullName, customerEmail: u.email });
    });
  });
  return rows;
}

export function getAllTransactionsFlat() {
  const users = getUsers();
  const rows = [];
  users.forEach((u) => {
    (u.transactions || []).forEach((t) => {
      rows.push({ ...t, customerName: u.fullName, customerEmail: u.email });
    });
  });
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getSystemStats() {
  const users = getUsers();
  const accounts = getAllAccountsFlat();
  const transactions = getAllTransactionsFlat();

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

export function toggleAccountStatus(customerEmail, accountId) {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === customerEmail);
  if (userIndex === -1) return null;

  const accountIndex = users[userIndex].accounts.findIndex((a) => a.id === accountId);
  if (accountIndex === -1) return null;

  const current = users[userIndex].accounts[accountIndex].status;
  users[userIndex].accounts[accountIndex].status = current === "Active" ? "Inactive" : "Active";

  saveUsers(users);
  return users[userIndex].accounts[accountIndex].status;
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