/**
 * Splitly demo data generator.
 *
 * Writes six MongoDB Extended JSON files into ./out, ready to import with
 * MongoDB Compass (one per collection). Nothing is written to your database
 * by this script.
 *
 *   cd server
 *   node seed/generate-demo-data.mjs
 *
 * Dates are relative to the moment you run it, so the dashboard's "this month"
 * and "last 7 days" numbers are always populated. Run it again shortly before
 * you record. Amounts are computed with the app's own split and settlement
 * engines, so they match what the app would have produced itself.
 *
 * Every demo login uses the password:  Demo@1234
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { calculateSplit } from "../utils/splitEngine.js";
import { generateSettlementsFromExpense } from "../utils/settlementEngine.js";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "out");
const PASSWORD = "Demo@1234";

// ───────────────────────── time helpers ─────────────────────────
const now = new Date();
const DAY = 24 * 60 * 60 * 1000;
const dayOfMonth = now.getDate();

function localMidnight(daysAgo) {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * The analytics routes bucket days by the UTC date of an expense but build the
 * buckets from *local* midnight. To make every bar land on the right day on any
 * machine, timestamps are placed inside the UTC day that contains local midnight.
 */
function stamp(daysAgo, minutes = 0) {
  const midnight = localMidnight(daysAgo);
  const nextUtcMidnight = Date.UTC(midnight.getUTCFullYear(), midnight.getUTCMonth(), midnight.getUTCDate() + 1);
  const room = nextUtcMidnight - midnight.getTime();
  const t = midnight.getTime() + Math.min(room / 2, 12 * 60 * 60 * 1000) + minutes * 60 * 1000;
  return new Date(Math.min(t, now.getTime() - 60 * 1000));
}

/** "This month" expenses never slip into last month, even early in the month. */
const thisMonth = (daysAgo) => stamp(Math.min(daysAgo, dayOfMonth - 1));
/** Older history, always before the first of the month so it stays out of monthly totals. */
const lastMonth = (extraDays) => stamp(dayOfMonth + extraDays);
const plusDays = (date, n) => new Date(Math.min(date.getTime() + n * DAY, now.getTime() - 60 * 1000));

// ───────────────────────── extended JSON helpers ─────────────────────────
const oidHex = (label) => crypto.createHash("sha1").update(`splitly-demo:${label}`).digest("hex").slice(0, 24);
const OID = (label) => ({ $oid: oidHex(label) });
const DATE = (d) => ({ $date: d.toISOString() });
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ───────────────────────── people ─────────────────────────
const passwordHash = bcrypt.hashSync(PASSWORD, 10);

const PEOPLE = [
  { username: "ali", name: "Ali Raza", joined: 120 },
  { username: "sara", name: "Sara Khan", joined: 118 },
  { username: "omar", name: "Omar Sheikh", joined: 110 },
  { username: "hina", name: "Hina Malik", joined: 104 },
  { username: "bilal", name: "Bilal Ahmed", joined: 96 },
  { username: "zainab", name: "Zainab Qureshi", joined: 90 },
];

const FRIENDS = {
  ali: ["sara", "omar", "hina", "bilal", "zainab"],
  sara: ["ali", "omar", "hina"],
  omar: ["ali", "sara", "hina", "bilal"],
  hina: ["ali", "sara", "omar", "zainab"],
  bilal: ["ali", "omar", "zainab"],
  zainab: ["ali", "hina", "bilal"],
};

const uid = (username) => oidHex(`user:${username}`);

const users = PEOPLE.map((p) => ({
  _id: OID(`user:${p.username}`),
  username: p.username,
  email: `${p.username}@demo.com`,
  password: passwordHash,
  profile: { displayName: p.name, avatarUrl: "" },
  friends: FRIENDS[p.username].map((f) => OID(`user:${f}`)),
  createdAt: DATE(stamp(p.joined)),
  updatedAt: DATE(stamp(p.joined)),
  __v: 0,
  demoSeed: true,
}));

// ───────────────────────── groups ─────────────────────────
const GROUPS = [
  { key: "fdc", name: "Friday Dinner Crew", category: "Food", creator: "ali", members: ["ali", "sara", "omar", "hina"], code: "dinnerCrew", age: 70 },
  { key: "ht", name: "Hunza Trip", category: "Travel", creator: "bilal", members: ["ali", "sara", "omar", "bilal", "zainab"], code: "hunzaTrip6", age: 45 },
  { key: "f4b", name: "Flat 4B Utilities", category: "Home", creator: "hina", members: ["ali", "hina", "zainab"], code: "flat4bBill", age: 60 },
  { key: "fyp", name: "FYP Project Supplies", category: "Project", creator: "omar", members: ["ali", "omar", "bilal"], code: "fypSupply1", age: 38 },
  { key: "mn", name: "Movie Nights", category: "Entertainment", creator: "hina", members: ["ali", "sara", "hina", "bilal"], code: "movieNight", age: 33 },
  { key: "bgf", name: "Sara's Birthday Surprise", category: "Shopping", creator: "omar", members: ["ali", "omar", "hina", "bilal"], code: "saraGift26", age: 12 },
];

const groups = GROUPS.map((g) => ({
  _id: OID(`group:${g.key}`),
  name: g.name,
  category: g.category,
  creator: OID(`user:${g.creator}`),
  members: g.members.map((m) => OID(`user:${m}`)),
  inviteCode: g.code,
  createdAt: DATE(stamp(g.age)),
  updatedAt: DATE(stamp(g.age)),
  __v: 0,
  demoSeed: true,
}));

// ───────────────────────── expenses ─────────────────────────
// `when` is a Date. `paidBy` is a username. `status` maps each debtor to a
// settlement status; anyone not listed is "pending" (this month) or "cleared" (older).
const all = (arr) => arr;
const EXPENSES = [
  // Friday Dinner Crew
  {
    key: "fdc-chai", group: "fdc", merchant: "Chaaye Khana", category: "Food", when: thisMonth(0), paidBy: "ali", tax: 0,
    items: [
      { name: "Doodh Patti x4", price: 800, who: ["ali", "sara", "omar", "hina"] },
      { name: "Samosa Chaat", price: 600, who: ["ali", "sara", "omar", "hina"] },
    ],
  },
  {
    key: "fdc-kolachi", group: "fdc", merchant: "Kolachi Restaurant", category: "Food", when: thisMonth(2), paidBy: "sara", tax: 15, source: "ai-scan",
    items: [
      { name: "Seekh Kabab Platter", price: 1850, who: ["ali", "sara", "omar"] },
      { name: "Chicken Karahi", price: 2400, who: ["ali", "sara", "omar", "hina"] },
      { name: "Garlic Naan x6", price: 480, who: ["ali", "sara", "omar", "hina"] },
      { name: "Mint Margarita x4", price: 1200, who: ["ali", "sara", "omar", "hina"] },
      { name: "Kheer", price: 650, who: ["hina", "omar"] },
    ],
    status: { omar: "marked_paid" },
  },
  {
    key: "fdc-burger", group: "fdc", merchant: "Burger Lab", category: "Food", when: thisMonth(6), paidBy: "ali", tax: 15,
    items: [
      { name: "Zinger Burger", price: 890, who: ["ali"] },
      { name: "Beef Smash Burger", price: 1250, who: ["omar"] },
      { name: "Chicken Wrap", price: 780, who: ["hina"] },
      { name: "Loaded Fries", price: 750, who: ["ali", "sara", "omar", "hina"] },
      { name: "Oreo Shake x2", price: 900, who: ["sara", "hina"] },
    ],
    status: { sara: "marked_paid" },
  },
  {
    key: "fdc-pizza", group: "fdc", merchant: "Broadway Pizza", category: "Food", when: thisMonth(13), paidBy: "omar", tax: 13,
    items: [
      { name: "Large Fajita Pizza", price: 2100, who: ["ali", "sara", "omar", "hina"] },
      { name: "Garlic Bread", price: 450, who: ["ali", "hina"] },
      { name: "Cheese Sticks", price: 600, who: ["sara", "omar"] },
      { name: "Soft Drinks x4", price: 720, who: ["ali", "sara", "omar", "hina"] },
    ],
    status: { ali: "marked_paid", sara: "cleared" },
  },
  {
    key: "fdc-old", group: "fdc", merchant: "Savour Foods", category: "Food", when: lastMonth(9), paidBy: "hina", tax: 13,
    items: [
      { name: "Pulao Platter", price: 2600, who: ["ali", "sara", "omar", "hina"] },
      { name: "Chicken Tikka", price: 1800, who: ["ali", "omar", "hina"] },
      { name: "Lassi x4", price: 800, who: ["ali", "sara", "omar", "hina"] },
    ],
  },

  // Hunza Trip
  {
    key: "ht-van", group: "ht", merchant: "Coaster Rental (Karachi to Hunza)", category: "Travel", when: thisMonth(16), paidBy: "bilal", tax: 0,
    items: [{ name: "Coaster rental, 6 days", price: 45000, who: ["ali", "sara", "omar", "bilal", "zainab"] }],
    status: { ali: "cleared", sara: "cleared", omar: "cleared" },
  },
  {
    key: "ht-hotel", group: "ht", merchant: "Hunza Serena Inn", category: "Travel", when: thisMonth(15), paidBy: "ali", tax: 0,
    items: [{ name: "Rooms, 2 nights", price: 32000, who: ["ali", "sara", "omar", "bilal", "zainab"] }],
    status: { omar: "marked_paid", zainab: "marked_paid" },
  },
  {
    key: "ht-fuel", group: "ht", merchant: "Fuel and Tolls", category: "Travel", when: thisMonth(14), paidBy: "omar", tax: 0,
    items: [{ name: "Fuel and highway tolls", price: 12500, who: ["ali", "sara", "omar", "bilal", "zainab"] }],
    status: { sara: "cleared", bilal: "cleared" },
  },
  {
    key: "ht-food", group: "ht", merchant: "Cafe de Hunza", category: "Food", when: thisMonth(14), paidBy: "sara", tax: 8,
    items: [
      { name: "Apricot Pancakes", price: 2500, who: ["ali", "sara", "omar", "bilal", "zainab"] },
      { name: "Chapshuro", price: 1800, who: ["ali", "omar", "bilal"] },
      { name: "Walnut Cake", price: 900, who: ["sara", "zainab"] },
      { name: "Tea Pot", price: 600, who: ["ali", "sara", "omar", "bilal", "zainab"] },
    ],
    status: { bilal: "cleared" },
  },

  // Flat 4B Utilities
  {
    key: "f4b-water", group: "f4b", merchant: "Water Tanker (2 refills)", category: "Home", when: thisMonth(3), paidBy: "zainab", tax: 0,
    items: [{ name: "Water tanker x2", price: 3600, who: ["ali", "hina", "zainab"] }],
    status: { hina: "cleared" },
  },
  {
    key: "f4b-kelectric", group: "f4b", merchant: "K-Electric Bill", category: "Home", when: thisMonth(5), paidBy: "hina", tax: 0,
    items: [{ name: "Electricity, September", price: 14800, who: ["ali", "hina", "zainab"] }],
    status: { zainab: "cleared" },
  },
  {
    key: "f4b-internet", group: "f4b", merchant: "StormFiber Internet", category: "Home", when: thisMonth(9), paidBy: "ali", tax: 0,
    items: [{ name: "Fibre plan, monthly", price: 4500, who: ["ali", "hina", "zainab"] }],
    status: { hina: "marked_paid" },
  },
  {
    key: "f4b-old", group: "f4b", merchant: "K-Electric Bill (August)", category: "Home", when: lastMonth(7), paidBy: "ali", tax: 0,
    items: [{ name: "Electricity, August", price: 13200, who: ["ali", "hina", "zainab"] }],
  },

  // FYP Project Supplies
  {
    key: "fyp-print", group: "fyp", merchant: "Fast Print Centre", category: "Project", when: thisMonth(4), paidBy: "ali", tax: 0,
    items: [
      { name: "Report printing", price: 1600, who: ["ali", "omar", "bilal"] },
      { name: "Spiral binding", price: 800, who: ["ali", "omar", "bilal"] },
    ],
    status: { bilal: "marked_paid" },
  },
  {
    key: "fyp-esp", group: "fyp", merchant: "Saddar Electronics", category: "Project", when: thisMonth(10), paidBy: "omar", tax: 0, source: "ai-scan",
    items: [
      { name: "ESP32 boards x3", price: 5400, who: ["ali", "omar", "bilal"] },
      { name: "Sensor kit", price: 2400, who: ["ali", "omar", "bilal"] },
    ],
    status: { ali: "cleared" },
  },

  // Movie Nights
  {
    key: "mn-cinepax", group: "mn", merchant: "Cinepax", category: "Entertainment", when: thisMonth(1), paidBy: "hina", tax: 0,
    items: [
      { name: "Ticket (Ali)", price: 1100, who: ["ali"] },
      { name: "Ticket (Sara)", price: 1100, who: ["sara"] },
      { name: "Ticket (Hina)", price: 1100, who: ["hina"] },
      { name: "Ticket (Bilal)", price: 1100, who: ["bilal"] },
      { name: "Popcorn combo", price: 1600, who: ["ali", "sara", "hina", "bilal"] },
    ],
    status: { sara: "marked_paid" },
  },
  {
    key: "mn-escape", group: "mn", merchant: "Escape Room Karachi", category: "Entertainment", when: thisMonth(8), paidBy: "bilal", tax: 0,
    items: [{ name: "Escape room, 4 players", price: 6000, who: ["ali", "sara", "hina", "bilal"] }],
    status: { ali: "cleared" },
  },

  // Sara's Birthday Surprise (Shopping: no budget on purpose, shows the "without a budget" prompt)
  {
    key: "bgf-gift", group: "bgf", merchant: "Zamzama Gift Boutique", category: "Shopping", when: thisMonth(7), paidBy: "omar", tax: 0,
    items: [
      { name: "Handbag", price: 6500, who: ["ali", "omar", "hina", "bilal"] },
      { name: "Flowers", price: 1800, who: ["ali", "omar", "hina", "bilal"] },
      { name: "Cake", price: 2200, who: ["ali", "omar", "hina", "bilal"] },
    ],
  },
];

const groupMembers = Object.fromEntries(GROUPS.map((g) => [g.key, g.members]));
const isOld = (e) => e.when.getTime() < localMidnight(dayOfMonth - 1).getTime();

const expenses = [];
const settlements = [];
const notifications = [];
const note = (n) => notifications.push(n);

for (const e of EXPENSES) {
  const items = e.items.map((i) => ({ name: i.name, price: i.price, participants: i.who.map(uid) }));
  const split = calculateSplit(items, e.tax);
  const expenseId = OID(`expense:${e.key}`);

  expenses.push({
    _id: expenseId,
    group: OID(`group:${e.group}`),
    createdBy: OID(`user:${e.paidBy}`),
    merchant: e.merchant,
    category: e.category,
    items: items.map((i) => ({ name: i.name, price: i.price, participants: i.participants.map((p) => ({ $oid: p })) })),
    subtotal: split.subtotal,
    taxPercent: e.tax,
    taxAmount: split.taxAmount,
    total: split.total,
    paidBy: OID(`user:${e.paidBy}`),
    perPersonShares: split.perPersonShares.map((s) => ({ ...s, user: { $oid: s.user } })),
    source: e.source || "manual",
    createdAt: DATE(e.when),
    updatedAt: DATE(e.when),
    __v: 0,
    demoSeed: true,
  });

  const usernameOf = Object.fromEntries(PEOPLE.map((p) => [uid(p.username), p.username]));
  const debts = generateSettlementsFromExpense(split.perPersonShares, uid(e.paidBy));

  for (const d of debts) {
    const debtor = usernameOf[d.from];
    const status = (e.status && e.status[debtor]) || (isOld(e) ? "cleared" : "pending");
    const sid = OID(`settlement:${e.key}:${debtor}`);
    const changedAt = plusDays(e.when, status === "cleared" ? 2 : 1);

    settlements.push({
      _id: sid,
      group: OID(`group:${e.group}`),
      expense: expenseId,
      from: OID(`user:${debtor}`),
      to: OID(`user:${e.paidBy}`),
      amount: d.amount,
      status,
      ...(status === "cleared" ? { clearedAt: DATE(changedAt) } : {}),
      createdAt: DATE(e.when),
      updatedAt: DATE(status === "pending" ? e.when : changedAt),
      __v: 0,
      demoSeed: true,
    });

    // Notifications mirror what the app itself creates at each step.
    const fresh = now.getTime() - e.when.getTime() < 3.5 * DAY;
    if (status !== "cleared") {
      note({ key: `${e.key}:${debtor}:new`, recipient: debtor, type: "new_expense", at: e.when, read: !fresh,
        message: `${e.merchant}: you owe Rs. ${d.amount} — added by a group member`, group: e.group, settlement: sid });
    }
    if (status === "marked_paid") {
      note({ key: `${e.key}:${debtor}:paid`, recipient: e.paidBy, type: "payment_marked_paid", at: changedAt, read: false,
        message: `Rs. ${d.amount} was marked as paid — confirm to clear it`, group: e.group, settlement: sid });
    }
    if (status === "cleared") {
      note({ key: `${e.key}:${debtor}:cleared`, recipient: debtor, type: "payment_cleared", at: changedAt, read: true,
        message: `Your Rs. ${d.amount} payment was confirmed and cleared`, group: e.group, settlement: sid });
    }
  }
}

// A reminder and a couple of invites, so every notification type appears.
const find = (key, debtor) => settlements.find((s) => s._id.$oid === oidHex(`settlement:${key}:${debtor}`));
const kel = find("f4b-kelectric", "ali");
note({ key: "remind-ali-kel", recipient: "ali", type: "payment_reminder", at: stamp(0, 20), read: false,
  message: `Reminder: you still owe Rs. ${kel.amount} to hina for K-Electric Bill`, group: "f4b", settlement: kel._id });
note({ key: "invite-ali-bgf", recipient: "ali", type: "group_invite", at: stamp(7, 30), read: false,
  message: "omar added you to Sara's Birthday Surprise", group: "bgf" });
note({ key: "invite-hina-bgf", recipient: "hina", type: "group_invite", at: stamp(7, 30), read: false,
  message: "omar added you to Sara's Birthday Surprise", group: "bgf" });
note({ key: "invite-sara-mn", recipient: "sara", type: "group_invite", at: stamp(33, 30), read: true,
  message: "hina added you to Movie Nights", group: "mn" });

const notificationDocs = notifications
  .sort((a, b) => b.at - a.at)
  .map((n) => ({
    _id: OID(`notification:${n.key}`),
    recipient: OID(`user:${n.recipient}`),
    type: n.type,
    message: n.message,
    relatedGroup: OID(`group:${n.group}`),
    ...(n.settlement ? { relatedSettlement: n.settlement } : {}),
    read: n.read,
    createdAt: DATE(n.at),
    updatedAt: DATE(n.at),
    __v: 0,
    demoSeed: true,
  }));

// ───────────────────────── budgets ─────────────────────────
const BUDGETS = {
  ali: { Food: 5000, Travel: 20000, Home: 10000, Project: 5000, Entertainment: 6000 },
  sara: { Food: 8000, Travel: 20000, Entertainment: 4000 },
  omar: { Food: 7000, Travel: 18000 },
};
const budgets = Object.entries(BUDGETS).flatMap(([username, cats]) =>
  Object.entries(cats).map(([category, amount]) => ({
    _id: OID(`budget:${username}:${category}`),
    user: OID(`user:${username}`),
    category,
    amount,
    period: "monthly",
    createdAt: DATE(stamp(25)),
    updatedAt: DATE(stamp(25)),
    __v: 0,
    demoSeed: true,
  }))
);

// ───────────────────────── write files ─────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
const files = { users, groups, expenses, settlements, budgets, notifications: notificationDocs };
for (const [name, docs] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(docs, null, 2));
}

// ───────────────────────── what you should see ─────────────────────────
const money = (n) => `Rs. ${round2(n).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const idOf = (o) => o.$oid;
const summarise = (username) => {
  const me = uid(username);
  const open = settlements.filter((s) => s.status !== "cleared");
  const owe = open.filter((s) => idOf(s.from) === me).reduce((n, s) => n + s.amount, 0);
  const owed = open.filter((s) => idOf(s.to) === me).reduce((n, s) => n + s.amount, 0);
  const monthStart = localMidnight(dayOfMonth - 1).getTime();
  const spend = {};
  for (const e of expenses) {
    if (new Date(e.createdAt.$date).getTime() < monthStart) continue;
    const share = e.perPersonShares.find((s) => idOf(s.user) === me);
    if (share) spend[e.category] = (spend[e.category] || 0) + share.total;
  }
  return { owe, owed, spend };
};

console.log(`\nWrote ${Object.entries(files).map(([k, v]) => `${k}: ${v.length}`).join(", ")}`);
console.log(`Files are in: ${OUT_DIR}`);
console.log(`\nLog in with any of these (password ${PASSWORD}):`);
console.log(PEOPLE.map((p) => `  ${p.username}@demo.com`).join("\n"));
const a = summarise("ali");
console.log(`\nAli's dashboard should show: you owe ${money(a.owe)}, you're owed ${money(a.owed)}`);
console.log("Ali's spend this month by category:");
for (const [cat, amt] of Object.entries(a.spend).sort((x, y) => y[1] - x[1])) {
  const limit = BUDGETS.ali[cat];
  console.log(`  ${cat.padEnd(14)} ${money(amt).padEnd(14)} ${limit ? `${Math.round((amt / limit) * 100)}% of ${money(limit)}` : "no budget"}`);
}
console.log(`\nInvite links (try one while logged out, or as a new account):`);
for (const g of GROUPS) console.log(`  /join/${g.code}  ${g.name}`);
