import { and, eq, ilike } from "drizzle-orm";
import { db, categoriesTable, emisTable, loansTable, transactionsTable } from "@workspace/db";
function emiMarker(emiId) {
    return `[EMI:${emiId}]`;
}
export function emiTransactionDescription(emiId, loanName) {
    return `Loan EMI payment: ${loanName} ${emiMarker(emiId)}`;
}
async function loanEmiCategoryId() {
    const [existing] = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(and(eq(categoriesTable.name, "Loan EMI"), eq(categoriesTable.type, "expense")));
    if (existing)
        return existing.id;
    const [created] = await db
        .insert(categoriesTable)
        .values({
        name: "Loan EMI",
        type: "expense",
        color: "#dc2626",
        icon: "Landmark",
    })
        .returning({ id: categoriesTable.id });
    return created.id;
}
async function existingEmiTransactionId(emiId) {
    const [existing] = await db
        .select({ id: transactionsTable.id })
        .from(transactionsTable)
        .where(ilike(transactionsTable.description, `%${emiMarker(emiId)}%`));
    return existing?.id ?? null;
}
export async function upsertEmiExpenseTransaction(emiId, loanName, amount, date) {
    const description = emiTransactionDescription(emiId, loanName);
    const categoryId = await loanEmiCategoryId();
    const existingId = await existingEmiTransactionId(emiId);
    if (existingId) {
        await db
            .update(transactionsTable)
            .set({
            type: "expense",
            amount,
            description,
            date,
            categoryId,
            isRecurring: false,
        })
            .where(eq(transactionsTable.id, existingId));
        return;
    }
    await db.insert(transactionsTable).values({
        type: "expense",
        amount,
        description,
        date,
        categoryId,
        isRecurring: false,
    });
}
export async function deleteEmiExpenseTransaction(emiId) {
    await db
        .delete(transactionsTable)
        .where(ilike(transactionsTable.description, `%${emiMarker(emiId)}%`));
}
export async function syncPaidEmiExpenseTransactions(start, end) {
    const paidEmis = await db
        .select({
        id: emisTable.id,
        amount: emisTable.amount,
        dueDate: emisTable.dueDate,
        paidDate: emisTable.paidDate,
        loanName: loansTable.name,
    })
        .from(emisTable)
        .innerJoin(loansTable, eq(emisTable.loanId, loansTable.id))
        .where(eq(emisTable.status, "paid"));
    for (const emi of paidEmis) {
        const paymentDate = emi.paidDate ?? emi.dueDate;
        if (start && paymentDate < start)
            continue;
        if (end && paymentDate > end)
            continue;
        await upsertEmiExpenseTransaction(emi.id, emi.loanName, Number(emi.amount), paymentDate);
    }
}
