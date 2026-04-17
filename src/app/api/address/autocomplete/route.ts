import { NextRequest, NextResponse } from "next/server";

type NominatimRow = {
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    state_code?: string;
    postcode?: string;
  };
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("countrycodes", "au");
  endpoint.searchParams.set("limit", "6");
  endpoint.searchParams.set("q", query);

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        "Accept-Language": "en-AU,en;q=0.9",
      },
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }
    const rows = (await response.json()) as NominatimRow[];
    const suggestions = rows.map((row) => {
      const address = row.address ?? {};
      const addressLine1 = [address.house_number, address.road].filter(Boolean).join(" ").trim();
      const city =
        address.suburb?.trim() ||
        address.city?.trim() ||
        address.town?.trim() ||
        address.village?.trim() ||
        address.hamlet?.trim() ||
        "";
      return {
        label: row.display_name,
        addressLine1,
        city,
        stateRegion: (address.state_code || address.state || "").trim(),
        postcode: (address.postcode || "").trim(),
        country: "Australia",
      };
    });
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
