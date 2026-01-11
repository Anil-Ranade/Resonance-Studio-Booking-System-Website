import {
  SessionType,
  KaraokeOption,
  LiveMusicianOption,
  BandEquipment,
  StudioName,
  SoundOperatorOption,
} from "../contexts/BookingContext";

interface StudioSuggestionResult {
  recommendedStudio: StudioName;
  allowedStudios: StudioName[];
  explanation: string;
}

/**
 * STUDIO SUGGESTION LOGIC (exact mapping as specified)
 *
 * Karaoke:
 * - 1–5 participants → recommend Studio C (allow upgrade to B or A)
 * - 6–10 → recommend Studio B (allow upgrade to A)
 * - 11–20 → recommend Studio A only (A locked)
 * - 21–30 → Studio A only (A locked)
 *
 * Live with musicians:
 * - 1–2 musicians → recommend Studio C (allow upgrades)
 * - 3–4 → recommend Studio B (allow upgrade to A)
 * - 5 → recommend Studio B (allow upgrade to A)
 * - 6–8 → Studio A only
 * - 9–12 → Studio A only
 *
 * Only Drum Practice:
 * - Studio A only
 *
 * Band:
 * - If drums are selected → Studio A ONLY (B & C disabled)
 * - No drums: based on other equipment
 *
 * Recording:
 * - Studio A only
 */

export function getKaraokeStudioSuggestion(
  option: KaraokeOption
): StudioSuggestionResult {
  switch (option) {
    case "1_5":
      return {
        recommendedStudio: "Studio C",
        allowedStudios: ["Studio C", "Studio B", "Studio A"],
        explanation:
          "For 1–5 participants, Studio C is perfect. You can upgrade to B or A for more space.",
      };
    case "6_10":
      return {
        recommendedStudio: "Studio B",
        allowedStudios: ["Studio B", "Studio A"],
        explanation:
          "For 6–10 participants, Studio B is recommended. You can upgrade to A for more comfort.",
      };
    case "11_20":
      return {
        recommendedStudio: "Studio A",
        allowedStudios: ["Studio A"],
        explanation:
          "For 11–20 participants, only Studio A can accommodate your group.",
      };
    case "21_30":
      return {
        recommendedStudio: "Studio A",
        allowedStudios: ["Studio A"],
        explanation:
          "For 21–30 participants, Studio A is required for your group size.",
      };
    default:
      return {
        recommendedStudio: "Studio C",
        allowedStudios: ["Studio C", "Studio B", "Studio A"],
        explanation: "Studio C is recommended for smaller groups.",
      };
  }
}

export function getLiveStudioSuggestion(
  option: LiveMusicianOption
): StudioSuggestionResult {
  switch (option) {
    case "1_2":
      return {
        recommendedStudio: "Studio C",
        allowedStudios: ["Studio C", "Studio B", "Studio A"],
        explanation:
          "For 1–2 musicians, Studio C is ideal. You can upgrade to B or A for more space.",
      };
    case "3_4":
      return {
        recommendedStudio: "Studio B",
        allowedStudios: ["Studio B", "Studio A"],
        explanation:
          "For 3–4 musicians, Studio B is recommended. You can upgrade to A.",
      };
    case "5":
      return {
        recommendedStudio: "Studio B",
        allowedStudios: ["Studio B", "Studio A"],
        explanation:
          "For 5 musicians, Studio B is recommended. You can upgrade to A.",
      };
    case "6_8":
      return {
        recommendedStudio: "Studio A",
        allowedStudios: ["Studio A"],
        explanation:
          "For 6–8 musicians, Studio A is required for adequate space.",
      };
    case "9_12":
      return {
        recommendedStudio: "Studio A",
        allowedStudios: ["Studio A"],
        explanation:
          "For 9–12 musicians, only Studio A can accommodate your group.",
      };
    default:
      return {
        recommendedStudio: "Studio C",
        allowedStudios: ["Studio C", "Studio B", "Studio A"],
        explanation: "Studio C is recommended for smaller groups.",
      };
  }
}

export function getBandStudioSuggestion(
  equipment: BandEquipment[]
): StudioSuggestionResult {
  const hasDrum = equipment.includes("drum");

  // Special Rule: If drums are selected, only Studio A is allowed
  if (hasDrum) {
    return {
      recommendedStudio: "Studio A",
      allowedStudios: ["Studio A"],
      explanation: "Drum equipment requires Studio A exclusively.",
    };
  }

  // No drums - allow all studios based on other equipment
  return {
    recommendedStudio: "Studio C",
    allowedStudios: ["Studio C", "Studio B", "Studio A"],
    explanation:
      "Your equipment setup fits in Studio C. You can upgrade if needed.",
  };
}

export function getStudioSuggestion(
  sessionType: SessionType,
  options: {
    karaokeOption?: KaraokeOption;
    liveOption?: LiveMusicianOption;
    bandEquipment?: BandEquipment[];
    recordingOption?: string;
  }
): StudioSuggestionResult {
  switch (sessionType) {
    case "Karaoke":
      if (options.karaokeOption) {
        return getKaraokeStudioSuggestion(options.karaokeOption);
      }
      break;
    case "Live with musicians":
      if (options.liveOption) {
        return getLiveStudioSuggestion(options.liveOption);
      }
      break;
    case "Only Drum Practice":
      return {
        recommendedStudio: "Studio A",
        allowedStudios: ["Studio A"],
        explanation: "Drum practice sessions are only available in Studio A.",
      };
    case "Band":
      if (options.bandEquipment && options.bandEquipment.length > 0) {
        return getBandStudioSuggestion(options.bandEquipment);
      }
      break;
    case "Recording":
      return {
        recommendedStudio: "Studio A",
        allowedStudios: ["Studio A"],
        explanation: "Recording sessions are only available in Studio A.",
      };
    case "Meetings / Classes":
      return {
        recommendedStudio: "Studio C",
        allowedStudios: ["Studio C", "Studio B", "Studio A"],
        explanation: "For meetings/classes (without sound operator), Studio C is the most economical. You can upgrade to B or A for more space.",
      };
  }

  // Default fallback
  return {
    recommendedStudio: "Studio C",
    allowedStudios: ["Studio C", "Studio B", "Studio A"],
    explanation:
      "Please select your session details to see studio recommendations.",
  };
}

/**
 * Check if a studio is allowed based on the current selection
 */
export function isStudioAllowed(
  studio: StudioName,
  allowedStudios: StudioName[]
): boolean {
  return allowedStudios.includes(studio);
}

/**
 * Get the studio rates based on session type and studio
 */
export const STUDIO_RATES: Record<StudioName, Record<string, number>> = {
  "Studio A": {
    karaoke_standard: 400,
    karaoke_large: 500,
    live_standard: 600,
    live_large: 800,
    drum_practice: 350,
    band_standard: 600,
    recording_audio: 700,
    recording_video: 800,
    recording_chroma: 1200,
    meetings_classes: 350,
  },
  "Studio B": {
    karaoke_standard: 300,
    live_standard: 400,
    live_5: 500,
    band_standard: 450,
    band_small: 400,
    meetings_classes: 250,
  },
  "Studio C": {
    karaoke_standard: 250,
    live_standard: 350,
    band_standard: 350,
    band_small: 300,
    meetings_classes: 200,
  },
};

export function getStudioRate(
  studio: StudioName,
  sessionType: SessionType,
  options: {
    karaokeOption?: KaraokeOption;
    liveOption?: LiveMusicianOption;
    bandEquipment?: BandEquipment[];
    recordingOption?: string;
    soundOperator?: SoundOperatorOption;
  }
): number {
  const rates = STUDIO_RATES[studio];
  let baseRate = 0;

  switch (sessionType) {
    case "Karaoke":
      if (options.karaokeOption === "21_30") {
        baseRate = rates.karaoke_large || rates.karaoke_standard || 400;
      } else {
        baseRate = rates.karaoke_standard || 300;
      }
      break;

    case "Live with musicians":
      if (options.liveOption === "9_12") {
        baseRate = rates.live_large || rates.live_standard || 600;
      } else if (options.liveOption === "5" && studio === "Studio B") {
        baseRate = rates.live_5 || rates.live_standard || 500;
      } else {
        baseRate = rates.live_standard || 400;
      }
      break;

    case "Only Drum Practice":
      baseRate = rates.drum_practice || 350;
      break;

    case "Band":
      const equipment = options.bandEquipment || [];
      const hasDrum = equipment.includes("drum");
      // With drums, always use standard rate for Studio A
      if (hasDrum) {
        baseRate = rates.band_standard || 450;
      } else {
        baseRate = rates.band_small || rates.band_standard || 350;
      }
      break;

    case "Recording":
      if (options.recordingOption === "chroma_key")
        baseRate = rates.recording_chroma || 1200;
      else if (options.recordingOption === "video_recording")
        baseRate = rates.recording_video || 800;
      else
        baseRate = rates.recording_audio || 700;
      break;

    case "Meetings / Classes":
      baseRate = rates.meetings_classes || 200;
      // Meetings/Classes already implies no sound operator, or specific pricing
      break;

    default:
      baseRate = 300;
  }

  // Apply Sound Operator Discount
  // Sound Operator discount disabled
  // if (options.soundOperator === "Not Required") {
  //   return Math.max(0, baseRate - 50);
  // }

  return baseRate;
}
