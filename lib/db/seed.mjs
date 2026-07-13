import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function monthsAgo(n, day = 1) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

function monthsAhead(n, day = 1) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

function thisMonth(day) {
  const d = new Date();
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

function monthKey(offset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query("SELECT COUNT(*)::int AS count FROM categories");
    if (existing[0].count > 0) {
      console.log("Seed data already present, skipping.");
      return;
    }

    await client.query("BEGIN");

    const categories = [
      ["Salary", "income", "#22c55e", "Wallet"],
      ["Freelance", "income", "#0ea5e9", "Briefcase"],
      ["Rent", "expense", "#ef4444", "Home"],
      ["Groceries", "expense", "#f59e0b", "ShoppingCart"],
      ["Dining Out", "expense", "#f97316", "UtensilsCrossed"],
      ["Utilities", "expense", "#eab308", "Zap"],
      ["Transport", "expense", "#8b5cf6", "Car"],
      ["Entertainment", "expense", "#ec4899", "Film"],
      ["Healthcare", "expense", "#14b8a6", "HeartPulse"],
      ["Shopping", "expense", "#6366f1", "ShoppingBag"],
    ];
    const categoryIds = {};
    for (const [name, type, color, icon] of categories) {
      const { rows } = await client.query(
        "INSERT INTO categories (name, type, color, icon) VALUES ($1,$2,$3,$4) RETURNING id",
        [name, type, color, icon],
      );
      categoryIds[name] = rows[0].id;
    }

    const transactions = [];
    for (let m = 5; m >= 0; m--) {
      transactions.push(["income", 95000, "Monthly salary", monthsAgo(m, 1), categoryIds["Salary"], true]);
      if (m % 2 === 0) {
        transactions.push(["income", 18000, "Freelance project payout", monthsAgo(m, 15), categoryIds["Freelance"], false]);
      }
      transactions.push(["expense", 28000, "Monthly rent", monthsAgo(m, 3), categoryIds["Rent"], true]);
      transactions.push(["expense", 8500 + m * 200, "Grocery shopping", monthsAgo(m, 6), categoryIds["Groceries"], false]);
      transactions.push(["expense", 4200, "Dinner with friends", monthsAgo(m, 10), categoryIds["Dining Out"], false]);
      transactions.push(["expense", 3600, "Electricity & water", monthsAgo(m, 8), categoryIds["Utilities"], true]);
      transactions.push(["expense", 2800, "Fuel & cab rides", monthsAgo(m, 12), categoryIds["Transport"], false]);
      transactions.push(["expense", 1500, "Streaming subscriptions", monthsAgo(m, 5), categoryIds["Entertainment"], true]);
      transactions.push(["expense", 2200, "Pharmacy & checkup", monthsAgo(m, 18), categoryIds["Healthcare"], false]);
      transactions.push(["expense", 5400, "Clothing & accessories", monthsAgo(m, 20), categoryIds["Shopping"], false]);
    }
    for (const [type, amount, description, date, categoryId, isRecurring] of transactions) {
      await client.query(
        "INSERT INTO transactions (type, amount, description, date, category_id, is_recurring) VALUES ($1,$2,$3,$4,$5,$6)",
        [type, amount, description, date, categoryId, isRecurring],
      );
    }

    const loans = [
      ["Home Loan - Green Valley Apartment", "home", 4500000, 3820000, 8.5, 39500, 240, monthsAgo(24, 1)],
      ["Car Loan - Sedan", "car", 800000, 320000, 9.2, 15800, 60, monthsAgo(31, 1)],
      ["Personal Loan - Home Renovation", "personal", 250000, 95000, 12.5, 9800, 30, monthsAgo(16, 1)],
    ];
    const loanIds = [];
    for (const [name, loanType, principal, outstanding, rate, emi, tenure, start] of loans) {
      const { rows } = await client.query(
        "INSERT INTO loans (name, loan_type, principal_amount, outstanding_amount, interest_rate, emi_amount, tenure_months, start_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') RETURNING id",
        [name, loanType, principal, outstanding, rate, emi, tenure, start],
      );
      loanIds.push({ id: rows[0].id, emi, tenure, start });
    }

    for (const loan of loanIds) {
      for (let m = -3; m <= 2; m++) {
        const dueDate = m < 0 ? monthsAgo(-m, 5) : monthsAhead(m, 5);
        let status = "pending";
        if (m < 0) status = "paid";
        else if (m === 0) status = "overdue";
        const paidDate = status === "paid" ? dueDate : null;
        await client.query(
          "INSERT INTO emis (loan_id, due_date, paid_date, amount, status) VALUES ($1,$2,$3,$4,$5)",
          [loan.id, dueDate, paidDate, loan.emi, status],
        );
      }
    }

    const insurances = [
      ["Family Health Shield", "health", "Star Health", 24000, 1000000, monthsAhead(4, 1), "HLT-88213", "active"],
      ["Term Life Cover", "life", "LIC", 18000, 10000000, monthsAhead(9, 1), "LIC-55021", "active"],
      ["Car Insurance - Sedan", "car", "ICICI Lombard", 9500, 800000, monthsAhead(1, 1), "CAR-33921", "active"],
      ["Home Insurance", "house", "HDFC Ergo", 6000, 4500000, monthsAhead(7, 1), "HSE-77820", "active"],
    ];
    for (const row of insurances) {
      await client.query(
        "INSERT INTO insurances (name, insurance_type, provider, premium_amount, coverage_amount, renewal_date, policy_number, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        row,
      );
    }

    const investments = [
      ["Nifty 50 Index Fund", "mutual_fund", 300000, 372000, monthsAgo(20, 1), 12.4],
      ["Bluechip Growth Fund", "mutual_fund", 150000, 168000, monthsAgo(14, 1), 10.8],
      ["Reliance Industries", "stocks", 80000, 96500, monthsAgo(10, 1), 15.2],
      ["Public Provident Fund", "ppf", 500000, 612000, monthsAgo(48, 1), 7.1],
      ["NPS Tier 1", "nps", 220000, 251000, monthsAgo(30, 1), 9.6],
      ["Fixed Deposit - 3yr", "fd", 200000, 224000, monthsAgo(18, 1), 6.8],
      ["Digital Gold", "gold", 60000, 68500, monthsAgo(12, 1), 8.9],
    ];
    for (const [name, type, invested, current, purchaseDate, xirr] of investments) {
      await client.query(
        "INSERT INTO investments (name, investment_type, invested_amount, current_value, purchase_date, xirr) VALUES ($1,$2,$3,$4,$5,$6)",
        [name, type, invested, current, purchaseDate, xirr],
      );
    }

    const goals = [
      ["Emergency Fund", "emergency_fund", 600000, 385000, monthsAhead(6, 1)],
      ["Bali Vacation", "vacation", 250000, 96000, monthsAhead(5, 1)],
      ["New Car Down Payment", "car", 400000, 140000, monthsAhead(14, 1)],
      ["House Down Payment", "house", 2000000, 620000, monthsAhead(30, 1)],
      ["Retirement Corpus", "retirement", 20000000, 2650000, monthsAhead(240, 1)],
    ];
    for (const [name, goalType, target, current, targetDate] of goals) {
      await client.query(
        "INSERT INTO goals (name, goal_type, target_amount, current_amount, target_date) VALUES ($1,$2,$3,$4,$5)",
        [name, goalType, target, current, targetDate],
      );
    }

    const budgetCategories = ["Rent", "Groceries", "Dining Out", "Utilities", "Transport", "Entertainment", "Healthcare", "Shopping"];
    const plannedAmounts = [28000, 9000, 4000, 3800, 3000, 1500, 2500, 5000];
    for (let i = 0; i < budgetCategories.length; i++) {
      await client.query(
        "INSERT INTO budgets (category_id, month, planned_amount) VALUES ($1,$2,$3)",
        [categoryIds[budgetCategories[i]], monthKey(0), plannedAmounts[i]],
      );
    }

    await client.query("COMMIT");
    console.log("Seed data inserted successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
