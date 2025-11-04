import { initializeScheduler } from "./modules/scheduler";

/**
 * Initialize the scheduler when the server starts
 * This will set up the cron job to run every 5 hours
 */
export function setupScheduler(): void {
  try {
    console.log("[Server] Setting up scheduler...");
    initializeScheduler();
    console.log("[Server] Scheduler setup complete");
  } catch (error) {
    console.error("[Server] Failed to setup scheduler:", error);
  }
}
