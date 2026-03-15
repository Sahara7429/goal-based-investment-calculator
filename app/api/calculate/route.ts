import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cost, years, inflation, returnRate } = await request.json();

    const futureValue = cost * Math.pow(1 + inflation / 100, years);

    const monthlyRate = returnRate / 100 / 12;
    const months = years * 12;

    const sip =
      (futureValue * monthlyRate) /
      ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));

    const timeline = [];

    for (let year = 1; year <= years; year++) {
      const monthsElapsed = year * 12;

      const value =
        sip *
        ((Math.pow(1 + monthlyRate, monthsElapsed) - 1) / monthlyRate) *
        (1 + monthlyRate);

      timeline.push({
        year,
        value: Number(value.toFixed(2)),
      });
    }

    return NextResponse.json({
      futureValue: Number(futureValue.toFixed(2)),
      sip: Number(sip.toFixed(2)),
      timeline,
    });
  } catch {
    return NextResponse.json(
      { error: "Calculation failed" },
      { status: 500 }
    );
  }
}
