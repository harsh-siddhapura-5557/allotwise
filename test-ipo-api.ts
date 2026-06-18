import { NSE } from "@bshada/nseapi";

async function test() {
  console.log("Testing NSE API...");
  const nse = new NSE("./downloads");

  try {
    // Test current IPOs
    console.log("\nFetching current IPOs...");
    const currentIpos = await nse.listCurrentIPO();
    console.log("Current IPOs:", JSON.stringify(currentIpos, null, 2));

    // Test upcoming IPOs
    console.log("\nFetching upcoming IPOs...");
    const upcomingIpos = await nse.listUpcomingIPO();
    console.log("Upcoming IPOs:", JSON.stringify(upcomingIpos, null, 2));

    // Test past IPOs
    console.log("\nFetching past IPOs...");
    const pastIpos = await nse.listPastIPO();
    console.log(
      "Past IPOs (first 5):",
      JSON.stringify(pastIpos.slice(0, 5), null, 2),
    );
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
