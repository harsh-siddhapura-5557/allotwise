import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Mock NSE IPO data - real recent IPOs
const mockCurrentIpos = [
  {
    companyName: "Innoventive Industries Limited",
    symbol: "INNOVENT",
    series: "EQ",
    issuePrice: "Rs. 65 to Rs. 70",
    lotSize: "2000 Equity Shares",
    issueStartDate: "18-June-2026",
    issueEndDate: "20-June-2026",
  },
  {
    companyName: "Shriram Properties Limited",
    symbol: "SHRIRAMP",
    series: "EQ",
    issuePrice: "Rs. 45 to Rs. 50",
    lotSize: "3000 Equity Shares",
    issueStartDate: "17-June-2026",
    issueEndDate: "19-June-2026",
  },
];

const mockUpcomingIpos = [
  {
    companyName: "Tata Technologies Limited",
    symbol: "TATATECH",
    series: "EQ",
    issuePrice: "Rs. 500",
    lotSize: "30 Equity Shares",
    issueStartDate: "22-June-2026",
    issueEndDate: "24-June-2026",
  },
  {
    companyName: "Jyoti CNC Automation Limited",
    symbol: "JYOTICNC",
    series: "EQ",
    issuePrice: "Rs. 331 to Rs. 349",
    lotSize: "45 Equity Shares",
    issueStartDate: "25-June-2026",
    issueEndDate: "27-June-2026",
  },
  {
    companyName: "Vibhor Steel Tubes Limited",
    symbol: "VIBHOR",
    series: "SME",
    issuePrice: "Rs. 151",
    lotSize: "8000 Equity Shares",
    issueStartDate: "28-June-2026",
    issueEndDate: "30-June-2026",
  },
];

// Helper to parse price range like "Rs.193 to Rs.203 per equity share"
function parsePriceRange(priceRange: string): number {
  const matches = priceRange.match(/Rs\.?\s*(\d+(\.\d+)?)/g);
  if (matches && matches.length >= 2) {
    const prices = matches.map((m: string) =>
      parseFloat(m.replace(/Rs\.?\s*/, "")),
    );
    return Math.max(...prices);
  } else if (matches && matches.length === 1) {
    return parseFloat(matches[0].replace(/Rs\.?\s*/, ""));
  }
  return 0;
}

// Helper to parse lot size like "600 Equity Shares"
function parseLotSize(lotSizeStr: string): number {
  const match = lotSizeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// Helper to parse dates like "17-June-2026" or "19-JUN-2026"
function parseDateFromNSE(dateStr: string): Date {
  const parts = dateStr.split("-");
  let [day, monthStr, year] = parts;
  if (parts.length < 3) {
    return new Date();
  }
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let monthIndex = months.indexOf(monthStr.toUpperCase());
  if (monthIndex === -1) {
    monthIndex = monthNames.indexOf(monthStr);
  }
  return new Date(parseInt(year, 10), monthIndex, parseInt(day, 10));
}

// Helper to add an IPO to database
async function addIpoToDatabase(
  sessionId: string,
  ipoData: any,
  type: "current" | "upcoming",
) {
  const priceRange = ipoData.issuePrice || ipoData.priceBand || "";
  const lotSizeStr = ipoData.lotSize;
  const issuePeriod = `${ipoData.issueStartDate} to ${ipoData.issueEndDate}`;

  const [startStr, endStr] = issuePeriod.split(" to ");
  const openDate = parseDateFromNSE(startStr.trim());
  const closeDate = parseDateFromNSE(endStr.trim());

  const issuePrice = parsePriceRange(priceRange);
  const lotSize = parseLotSize(lotSizeStr);
  const series = ipoData.series || "EQ";
  const ipoType = series === "SME" ? "SME" : "MAINBOARD";
  const status = type === "current" ? "OPEN" : "UPCOMING";

  const newIpo = await prisma.iPO.create({
    data: {
      name: ipoData.companyName,
      ipoType,
      issuePrice,
      lotSize,
      openDate,
      closeDate,
      status,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: sessionId,
      action: "IPO_IMPORTED",
      details: `Imported ${type} IPO: ${newIpo.name} (${ipoType})`,
    },
  });

  return newIpo;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const importedIpos = [];

    // 1. Import current IPOs
    for (const ipo of mockCurrentIpos) {
      const existing = await prisma.iPO.findFirst({
        where: { name: ipo.companyName },
      });
      if (!existing) {
        const newIpo = await addIpoToDatabase(session.id, ipo, "current");
        importedIpos.push(newIpo);
      }
    }

    // 2. Import upcoming IPOs
    for (const ipo of mockUpcomingIpos) {
      const existing = await prisma.iPO.findFirst({
        where: { name: ipo.companyName },
      });
      if (!existing) {
        const newIpo = await addIpoToDatabase(session.id, ipo, "upcoming");
        importedIpos.push(newIpo);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedIpos.length,
      ipos: importedIpos,
    });
  } catch (error) {
    console.error("Error importing IPOs:", error);
    return NextResponse.json(
      {
        error: "Failed to import IPOs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Add single IPO from market
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { companyName, type } = body;

    const existing = await prisma.iPO.findFirst({
      where: { name: companyName },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "IPO already added" });
    }

    // Find in our mock data
    const allIpos = [...mockCurrentIpos, ...mockUpcomingIpos];
    const ipoData = allIpos.find((ipo) => ipo.companyName === companyName);

    if (!ipoData) {
      return NextResponse.json({ success: false, error: "IPO not found" });
    }

    const newIpo = await addIpoToDatabase(session.id, ipoData, type as any);
    return NextResponse.json({ success: true, ipo: newIpo });
  } catch (error) {
    console.error("Error adding IPO:", error);
    return NextResponse.json(
      {
        error: "Failed to add IPO",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
