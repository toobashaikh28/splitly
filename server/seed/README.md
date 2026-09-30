# Splitly demo data

Six ready-to-import files for MongoDB Compass. They create 6 people, 6 groups,
18 expenses, 52 payments, 10 budgets and 64 notifications, so every screen has
something to show.

**Every demo account uses the password `Demo@1234`.**

| Log in as | What they show |
| --- | --- |
| `ali@demo.com` | The main demo account: owes and is owed money, one budget over its limit, one nearly full, unread notifications, payments waiting for you to confirm |
| `sara@demo.com` | A second view of the same groups, for showing two people using it |
| `omar@demo.com`, `hina@demo.com`, `bilal@demo.com`, `zainab@demo.com` | Other group members |

## Import (about 3 minutes)

1. Open **MongoDB Compass** and connect to your cluster.
2. Open the **same database your app uses**. It's the one whose `users` collection
   already contains your own account. If you import into a different database the app
   will still look empty.
3. For each of the six files below, do the following.
   1. Click the collection with the matching name on the left. If it doesn't exist yet, create it with that exact name.
   2. Click **ADD DATA** → **Import JSON or CSV file**.
   3. Choose the file from the `out` folder. Leave the type as **JSON**.
   4. Click **Import**.

| File | Collection |
| --- | --- |
| `users.json` | `users` |
| `groups.json` | `groups` |
| `expenses.json` | `expenses` |
| `settlements.json` | `settlements` |
| `budgets.json` | `budgets` |
| `notifications.json` | `notifications` |

4. Log in to the app as `ali@demo.com`.

If Compass reports "duplicate key", that file was already imported. Nothing is
harmed, and you can skip it.

## Remove the demo data

Every demo document carries `demoSeed: true`, so it's easy to remove without
touching your real data. In Compass, open the **_MONGOSH** panel at the bottom,
paste this and press Enter:

```js
["users","groups","expenses","settlements","budgets","notifications"].forEach(c => print(c, db.getCollection(c).deleteMany({ demoSeed: true }).deletedCount))
```

## Refresh the dates before you record

The dashboard only counts spending from **this month** and **the last 7 days**,
so old demo data eventually stops showing. The files here are dated **30 September 2026**.
To regenerate them dated to today:

```
cd server
node seed/generate-demo-data.mjs
```

Then remove the old demo data (above) and import the new files. It needs
nothing installed beyond what your server already has.

## What's in it

- **Friday Dinner Crew** (Food), **Hunza Trip** (Travel), **Flat 4B Utilities** (Home),
  **FYP Project Supplies** (Project), **Movie Nights** (Entertainment), and
  **Sara's Birthday Surprise** (Shopping).
- Payments in every state: pending, marked as paid and awaiting confirmation, and cleared.
- Ali has budgets for five categories and none for Shopping, on purpose, so the
  "Spending without a budget" panel has something to show.
- Invite links to try the join flow: `/join/dinnerCrew`, `/join/hunzaTrip6`,
  `/join/flat4bBill`, `/join/fypSupply1`, `/join/movieNight`, `/join/saraGift26`.
