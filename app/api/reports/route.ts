import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "member";

  if (type === "member") {
    const members = await prisma.member.findMany({
      include: {
        applications: {
          include: { allotment: true },
        },
      },
    });

    const report = members.map((m) => {
      const apps = m.applications;
      const allotted = apps.filter((a) =>
        ["ALLOTTED", "SOLD"].includes(a.status),
      );
      const totalInvestment = allotted.reduce(
        (s, a) =>
          s +
          (a.allotment
            ? a.allotment.sharesAllotted * a.allotment.issuePrice
            : 0),
        0,
      );
      const totalProfit = allotted.reduce(
        (s, a) => s + (a.allotment?.profit || 0),
        0,
      );
      const totalLoss = allotted.reduce(
        (s, a) => s + (a.allotment?.loss || 0),
        0,
      );

      return {
        id: m.id,
        name: m.fullName,
        panNumber: m.panNumber,
        mobile: m.mobile,
        totalApplications: apps.length,
        totalAllotments: allotted.length,
        totalInvestment,
        totalProfit,
        totalLoss,
        netPnL: totalProfit - totalLoss,
      };
    });

    return NextResponse.json(report);
  }

  if (type === "ipo") {
    const ipos = await prisma.iPO.findMany({
      include: {
        applications: {
          include: { allotment: true },
        },
      },
    });

    const report = ipos.map((ipo) => {
      const apps = ipo.applications;
      const allotted = apps.filter((a) =>
        ["ALLOTTED", "SOLD"].includes(a.status),
      );
      const totalProfit = allotted.reduce(
        (s, a) => s + (a.allotment?.profit || 0),
        0,
      );
      const totalLoss = allotted.reduce(
        (s, a) => s + (a.allotment?.loss || 0),
        0,
      );

      return {
        id: ipo.id,
        name: ipo.name,
        ipoType: ipo.ipoType,
        issuePrice: ipo.issuePrice,
        status: ipo.status,
        totalApplications: apps.length,
        totalAllotments: allotted.length,
        totalProfit,
        totalLoss,
        netPnL: totalProfit - totalLoss,
      };
    });

    return NextResponse.json(report);
  }

  if (type === "upi") {
    const upis = await prisma.upiId.findMany({
      include: {
        member: { select: { fullName: true } },
        applications: { select: { status: true } },
      },
    });

    const report = upis.map((upi) => ({
      id: upi.id,
      upiId: upi.upiId,
      memberName: upi.member ? upi.member.fullName : "Not assigned",
      totalApplications: upi.applications.length,
      totalAllotments: upi.applications.filter((a) =>
        ["ALLOTTED", "SOLD"].includes(a.status),
      ).length,
    }));

    return NextResponse.json(report);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
