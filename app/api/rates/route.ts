import { NextRequest, NextResponse } from "next/server";

// Session types
export type SessionType =
  | "Karaoke"
  | "Live with musicians"
  | "Only Drum Practice"
  | "Band"
  | "Recording";

// Karaoke participant options
export type KaraokeOption = "1_5" | "6_10" | "11_20" | "21_30";

// Live musician options
export type LiveMusicianOption = "1_2" | "3_4" | "5" | "6_8" | "9_12";

// Band equipment
export type BandEquipment = "drum" | "amps" | "guitars" | "keyboard";

// Recording options
export type RecordingOption =
  | "audio_recording"
  | "video_recording"
  | "chroma_key";

// Rate card based on the pricing page
const rateCard = {
  "Studio A": {
    karaoke: {
      "1_5": 400,
      "6_10": 400,
      "11_20": 400,
      "21_30": 500,
    },
    live: {
      "1_2": 600,
      "3_4": 600,
      "5": 600,
      "6_8": 600,
      "9_12": 800,
    },
    drum_practice: 350,
    band: {
      with_drum: 600, // Any combination with drums
      without_drum: 400,
    },
    recording: {
      audio_recording: 700,
      video_recording: 800,
      chroma_key: 1200,
    },
  },
  "Studio B": {
    karaoke: {
      "1_5": 300,
      "6_10": 300,
    },
    live: {
      "1_2": 400,
      "3_4": 400,
      "5": 500,
    },
    band: {
      without_drum: 350,
    },
  },
  "Studio C": {
    karaoke: {
      "1_5": 250,
    },
    live: {
      "1_2": 350,
    },
    band: {
      without_drum: 300,
    },
  },
};

// Studio order from smallest to largest
const studioOrder = ["Studio C", "Studio B", "Studio A"] as const;
type StudioName = (typeof studioOrder)[number];

interface StudioSuggestion {
  suggested_studio: StudioName;
  suggested_rate: number;
  allowed_studios: StudioName[];
  explanation: string;
  rate_breakdown?: Record<string, number>;
}

// Get studio suggestion for Karaoke
function getKaraokeSuggestion(option: KaraokeOption): StudioSuggestion {
  let suggested: StudioName;
  let allowed: StudioName[];
  let rate: number;
  let explanation: string;

  switch (option) {
    case "1_5":
      suggested = "Studio C";
      allowed = ["Studio C", "Studio B", "Studio A"];
      rate = rateCard["Studio C"].karaoke["1_5"];
      explanation =
        "For 1–5 participants, Studio C is perfect. You can upgrade to B or A for more space.";
      break;
    case "6_10":
      suggested = "Studio B";
      allowed = ["Studio B", "Studio A"];
      rate = rateCard["Studio B"].karaoke["6_10"];
      explanation =
        "For 6–10 participants, Studio B is recommended. You can upgrade to A for more space.";
      break;
    case "11_20":
      suggested = "Studio A";
      allowed = ["Studio A"];
      rate = rateCard["Studio A"].karaoke["11_20"];
      explanation =
        "For 11–20 participants, only Studio A can accommodate your group.";
      break;
    case "21_30":
      suggested = "Studio A";
      allowed = ["Studio A"];
      rate = rateCard["Studio A"].karaoke["21_30"];
      explanation =
        "For 21–30 participants, Studio A is required for your group size.";
      break;
    default:
      suggested = "Studio C";
      allowed = ["Studio C", "Studio B", "Studio A"];
      rate = rateCard["Studio C"].karaoke["1_5"];
      explanation = "Studio C is recommended for smaller groups.";
  }

  return {
    suggested_studio: suggested,
    suggested_rate: rate,
    allowed_studios: allowed,
    explanation,
    rate_breakdown: getAllRatesForKaraoke(option, allowed),
  };
}

// Get all rates for Karaoke for allowed studios
function getAllRatesForKaraoke(
  option: KaraokeOption,
  allowed: StudioName[]
): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const studio of allowed) {
    const studioRates = rateCard[studio]?.karaoke;
    if (studioRates && option in studioRates) {
      rates[studio] = studioRates[option as keyof typeof studioRates];
    } else if (studio === "Studio A") {
      // Studio A can handle all karaoke options
      rates[studio] = rateCard["Studio A"].karaoke[option] || 400;
    }
  }
  return rates;
}

// Get studio suggestion for Live with musicians
function getLiveSuggestion(option: LiveMusicianOption): StudioSuggestion {
  let suggested: StudioName;
  let allowed: StudioName[];
  let rate: number;
  let explanation: string;

  switch (option) {
    case "1_2":
      suggested = "Studio C";
      allowed = ["Studio C", "Studio B", "Studio A"];
      rate = rateCard["Studio C"].live["1_2"];
      explanation =
        "For 1–2 musicians, Studio C is ideal. You can upgrade to B or A for more space.";
      break;
    case "3_4":
      suggested = "Studio B";
      allowed = ["Studio B", "Studio A"];
      rate = rateCard["Studio B"].live["3_4"];
      explanation =
        "For 3–4 musicians, Studio B is recommended. You can upgrade to A.";
      break;
    case "5":
      suggested = "Studio B";
      allowed = ["Studio B", "Studio A"];
      rate = rateCard["Studio B"].live["5"];
      explanation =
        "For 5 musicians, Studio B is suitable. You can upgrade to A for more comfort.";
      break;
    case "6_8":
      suggested = "Studio A";
      allowed = ["Studio A"];
      rate = rateCard["Studio A"].live["6_8"];
      explanation =
        "For 6–8 musicians, Studio A is required for adequate space.";
      break;
    case "9_12":
      suggested = "Studio A";
      allowed = ["Studio A"];
      rate = rateCard["Studio A"].live["9_12"];
      explanation =
        "For 9–12 musicians, only Studio A can accommodate your group.";
      break;
    default:
      suggested = "Studio C";
      allowed = ["Studio C", "Studio B", "Studio A"];
      rate = rateCard["Studio C"].live["1_2"];
      explanation = "Studio C is recommended for smaller groups.";
  }

  return {
    suggested_studio: suggested,
    suggested_rate: rate,
    allowed_studios: allowed,
    explanation,
    rate_breakdown: getAllRatesForLive(option, allowed),
  };
}

// Get all rates for Live for allowed studios
function getAllRatesForLive(
  option: LiveMusicianOption,
  allowed: StudioName[]
): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const studio of allowed) {
    const studioRates = rateCard[studio]?.live;
    if (studioRates && option in studioRates) {
      rates[studio] = studioRates[option as keyof typeof studioRates];
    } else if (studio === "Studio A") {
      rates[studio] = rateCard["Studio A"].live[option] || 600;
    }
  }
  return rates;
}

// Get studio suggestion for Band
function getBandSuggestion(equipment: BandEquipment[]): StudioSuggestion {
  const hasDrum = equipment.includes("drum");

  let suggested: StudioName;
  let allowed: StudioName[];
  let rate: number;
  let explanation: string;

  // Special Rule: If drums are selected, only Studio A is allowed
  if (hasDrum) {
    suggested = "Studio A";
    allowed = ["Studio A"];
    rate = rateCard["Studio A"].band["with_drum"];
    explanation = "Drum equipment requires Studio A exclusively.";
  } else {
    // No drums - allow all studios
    suggested = "Studio C";
    allowed = ["Studio C", "Studio B", "Studio A"];
    rate = rateCard["Studio C"].band["without_drum"];
    explanation =
      "Your equipment setup fits in Studio C. You can upgrade if needed.";
  }

  return {
    suggested_studio: suggested,
    suggested_rate: rate,
    allowed_studios: allowed,
    explanation,
    rate_breakdown: getAllRatesForBand(hasDrum, allowed),
  };
}

// Get all rates for Band for allowed studios
function getAllRatesForBand(
  hasDrum: boolean,
  allowed: StudioName[]
): Record<string, number> {
  const rates: Record<string, number> = {};
  const rateKey = hasDrum ? "with_drum" : "without_drum";
  for (const studio of allowed) {
    const studioRates = rateCard[studio]?.band;
    if (studioRates && rateKey in studioRates) {
      rates[studio] = studioRates[rateKey as keyof typeof studioRates];
    } else if (studio === "Studio A") {
      rates[studio] = rateCard["Studio A"].band[rateKey] || 500;
    }
  }
  return rates;
}

// Get studio suggestion for Only Drum Practice
function getDrumPracticeSuggestion(): StudioSuggestion {
  return {
    suggested_studio: "Studio A",
    suggested_rate: rateCard["Studio A"].drum_practice,
    allowed_studios: ["Studio A"],
    explanation: "Drum practice is available only in Studio A.",
    rate_breakdown: { "Studio A": rateCard["Studio A"].drum_practice },
  };
}

// Get studio suggestion for Recording
function getRecordingSuggestion(option: RecordingOption): StudioSuggestion {
  const rate = rateCard["Studio A"].recording[option];
  const optionLabels: Record<RecordingOption, string> = {
    audio_recording: "Audio Recording",
    video_recording: "Video Recording (4K)",
    chroma_key: "Chroma Key (Green Screen)",
  };

  return {
    suggested_studio: "Studio A",
    suggested_rate: rate,
    allowed_studios: ["Studio A"],
    explanation: `${optionLabels[option]} is available in Studio A at ₹${rate}/song.`,
    rate_breakdown: { "Studio A": rate },
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionType = searchParams.get("sessionType") as SessionType | null;
  const subOption = searchParams.get("subOption"); // For Karaoke, Live, Recording
  const equipmentParam = searchParams.get("equipment"); // For Band (comma-separated)
  const selectedStudio = searchParams.get("studio"); // To get rate for specific studio

  // Validate session type
  const validSessionTypes: SessionType[] = [
    "Karaoke",
    "Live with musicians",
    "Only Drum Practice",
    "Band",
    "Recording",
  ];

  if (!sessionType || !validSessionTypes.includes(sessionType)) {
    return NextResponse.json(
      {
        error: `Invalid sessionType: must be one of ${validSessionTypes.join(
          ", "
        )}`,
      },
      { status: 400 }
    );
  }

  let suggestion: StudioSuggestion;

  switch (sessionType) {
    case "Karaoke":
      if (!subOption) {
        return NextResponse.json(
          {
            error:
              "subOption is required for Karaoke (1_5, 6_10, 11_20, 21_30)",
          },
          { status: 400 }
        );
      }
      suggestion = getKaraokeSuggestion(subOption as KaraokeOption);
      break;

    case "Live with musicians":
      if (!subOption) {
        return NextResponse.json(
          {
            error:
              "subOption is required for Live with musicians (1_2, 3_4, 5, 6_8, 9_12)",
          },
          { status: 400 }
        );
      }
      suggestion = getLiveSuggestion(subOption as LiveMusicianOption);
      break;

    case "Only Drum Practice":
      suggestion = getDrumPracticeSuggestion();
      break;

    case "Band":
      if (!equipmentParam) {
        return NextResponse.json(
          {
            error:
              "equipment is required for Band (comma-separated: drum,amps,guitars,keyboard)",
          },
          { status: 400 }
        );
      }
      const equipment = equipmentParam.split(",") as BandEquipment[];
      suggestion = getBandSuggestion(equipment);
      break;

    case "Recording":
      if (!subOption) {
        return NextResponse.json(
          {
            error:
              "subOption is required for Recording (audio_recording, video_recording, chroma_key)",
          },
          { status: 400 }
        );
      }
      suggestion = getRecordingSuggestion(subOption as RecordingOption);
      break;

    default:
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 }
      );
  }

  // If a specific studio is requested, get the rate for that studio
  if (
    selectedStudio &&
    suggestion.allowed_studios.includes(selectedStudio as StudioName)
  ) {
    const studioRate = suggestion.rate_breakdown?.[selectedStudio];
    if (studioRate) {
      suggestion.suggested_rate = studioRate;
    }
  }

  return NextResponse.json(suggestion);
}
