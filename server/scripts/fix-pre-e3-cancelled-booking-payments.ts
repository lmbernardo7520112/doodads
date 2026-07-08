/**
 * ================================================================
 * fix-pre-e3-cancelled-booking-payments.ts
 * ================================================================
 * One-shot idempotent migration script to fix BookingPayments and
 * Reservas that were cancelled before Phase E3 added propagation.
 *
 * Problem: Pre-E3, cancelling a reserva did NOT propagate to the
 * associated BookingPayment. This left orphan BookingPayments with
 * status="pending" even though the reserva was already "cancelado".
 *
 * Fix: For each cancelled reserva with a linked BookingPayment
 * that is still "pending", update both BookingPayment.status and
 * Reserva.paymentStatus to "cancelled".
 *
 * Usage:
 *   npx ts-node scripts/fix-pre-e3-cancelled-booking-payments.ts          # dry-run (default)
 *   npx ts-node scripts/fix-pre-e3-cancelled-booking-payments.ts --apply  # execute changes
 *
 * Safety:
 *   - Idempotent: running multiple times produces same result
 *   - Does NOT alter BookingPayments with status paid/expired/refunded/failed/manual_review
 *   - Does NOT alter reservas that are not "cancelado"
 *   - Does NOT run on server startup
 *   - Does NOT delete any records
 * ================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Reserva from "../models/Reserva";
import BookingPayment from "../models/BookingPayment";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const isDryRun = !process.argv.includes("--apply");

interface MigrationResult {
  analyzed: number;
  fixed: number;
  ignored: number;
  alreadyFixed: number;
  details: {
    reservaId: string;
    bookingPaymentId: string;
    action: "fixed" | "ignored" | "already_fixed";
    reason: string;
    bpStatusBefore?: string;
    reservaPaymentStatusBefore?: string;
  }[];
}

async function runMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    analyzed: 0,
    fixed: 0,
    ignored: 0,
    alreadyFixed: 0,
    details: [],
  };

  // Find all cancelled reservas with a bookingPaymentId
  const cancelledReservas = await Reserva.find({
    status: "cancelado",
    bookingPaymentId: { $exists: true, $ne: null },
  });

  console.log(`\n📋 Found ${cancelledReservas.length} cancelled reserva(s) with bookingPaymentId\n`);

  for (const reserva of cancelledReservas) {
    result.analyzed++;
    const reservaId = reserva._id.toString();
    const bpId = reserva.bookingPaymentId!.toString();

    const bp = await BookingPayment.findById(bpId);
    if (!bp) {
      console.log(`  ⚠️  [${reservaId}] BookingPayment ${bpId} not found — IGNORED`);
      result.ignored++;
      result.details.push({
        reservaId,
        bookingPaymentId: bpId,
        action: "ignored",
        reason: "BookingPayment not found",
      });
      continue;
    }

    // Already fixed (idempotent check)
    if (bp.status === "cancelled") {
      console.log(`  ✅ [${reservaId}] BP ${bpId} already cancelled — SKIP`);
      result.alreadyFixed++;
      result.details.push({
        reservaId,
        bookingPaymentId: bpId,
        action: "already_fixed",
        reason: "BookingPayment already cancelled",
        bpStatusBefore: bp.status,
        reservaPaymentStatusBefore: reserva.paymentStatus as string,
      });
      continue;
    }

    // Only fix if BookingPayment is "pending"
    if (bp.status !== "pending") {
      console.log(`  ⏭️  [${reservaId}] BP ${bpId} status="${bp.status}" — IGNORED (not pending)`);
      result.ignored++;
      result.details.push({
        reservaId,
        bookingPaymentId: bpId,
        action: "ignored",
        reason: `BookingPayment status is "${bp.status}", not "pending"`,
        bpStatusBefore: bp.status,
        reservaPaymentStatusBefore: reserva.paymentStatus as string,
      });
      continue;
    }

    // Fix needed: BP is pending but reserva is cancelled
    const bpStatusBefore = bp.status;
    const reservaPaymentStatusBefore = reserva.paymentStatus as string;

    if (isDryRun) {
      console.log(`  🔍 [DRY-RUN] [${reservaId}] Would fix:`);
      console.log(`       BP ${bpId}: status "pending" → "cancelled"`);
      if (reservaPaymentStatusBefore === "pending") {
        console.log(`       Reserva paymentStatus "pending" → "cancelled"`);
      }
    } else {
      // Update BookingPayment
      await BookingPayment.findByIdAndUpdate(bpId, {
        $set: {
          status: "cancelled",
          metadataSafe: {
            ...(bp.metadataSafe as Record<string, unknown> || {}),
            migratedAt: new Date().toISOString(),
            migrationReason: "pre-e3-data-fix",
            previousStatus: bpStatusBefore,
          },
        },
      });

      // Update Reserva.paymentStatus if it's still "pending"
      if (reservaPaymentStatusBefore === "pending") {
        await Reserva.findByIdAndUpdate(reservaId, {
          $set: { paymentStatus: "cancelled" },
        });
      }

      console.log(`  ✅ [FIXED] [${reservaId}] BP ${bpId}: pending → cancelled`);
      if (reservaPaymentStatusBefore === "pending") {
        console.log(`       Reserva paymentStatus: pending → cancelled`);
      }
    }

    result.fixed++;
    result.details.push({
      reservaId,
      bookingPaymentId: bpId,
      action: "fixed",
      reason: isDryRun ? "Would fix (dry-run)" : "Fixed",
      bpStatusBefore,
      reservaPaymentStatusBefore,
    });
  }

  return result;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Fix Pre-E3 Cancelled BookingPayments");
  console.log(`  Mode: ${isDryRun ? "🔍 DRY-RUN (no changes)" : "⚡ APPLY (will modify data)"}`);
  console.log("═══════════════════════════════════════════════════════");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set. Aborting.");
    process.exit(1);
  }

  // Safety: warn if URL looks like production
  if (dbUrl.includes("mongodb+srv://") || dbUrl.includes("atlas") || dbUrl.includes("prod")) {
    console.error("❌ DATABASE_URL appears to be a production/cloud database. Aborting for safety.");
    process.exit(1);
  }

  console.log(`\n🔗 Connecting to: ${dbUrl.replace(/\/\/.*@/, "//***@")}`);

  try {
    await mongoose.connect(dbUrl);
    console.log("✅ Connected to MongoDB\n");

    const result = await runMigration();

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  RESULTS");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Analyzed:      ${result.analyzed}`);
    console.log(`  Fixed:         ${result.fixed}${isDryRun ? " (would fix)" : ""}`);
    console.log(`  Ignored:       ${result.ignored}`);
    console.log(`  Already fixed: ${result.alreadyFixed}`);
    console.log(`  Mode:          ${isDryRun ? "DRY-RUN" : "APPLY"}`);
    console.log("═══════════════════════════════════════════════════════\n");

    if (isDryRun && result.fixed > 0) {
      console.log("💡 To apply changes, run with --apply flag");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

main();
