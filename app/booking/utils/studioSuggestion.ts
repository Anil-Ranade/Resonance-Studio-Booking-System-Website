import { 
  SessionType, 
  KaraokeOption, 
  LiveMusicianOption, 
  BandEquipment, 
  StudioName 
} from '../contexts/BookingContext';

interface StudioSuggestionResult {
  recommendedStudio: StudioName;
  allowedStudios: StudioName[];
  explanation: string;
}

/**
 * STUDIO SUGGESTION LOGIC (exact mapping as specified)
 * 
 * Karaoke:
 * - up to 5 → recommend Studio C (allow upgrade to B or A)
 * - 10 → recommend Studio B (allow upgrade to A)
 * - 20 → recommend Studio A only (A locked)
 * - 21–30 → Studio A only (A locked)
 * 
 * Live with musicians:
 * - up to 2 → recommend Studio C (allow upgrades)
 * - up to 4 or 5 → recommend Studio B (allow upgrade to A)
 * - up to 8 → Studio A only
 * - 9–12 → Studio A only
 * 
 * Only Drum Practice:
 * - Studio A only
 * 
 * Band:
 * - Full stack (Drum+Amps+Guitars+Keyboard) → A only
 * - Drum+Guitars+Amps → B recommended (allow upgrade to A)
 * - Drum+Amps only → C recommended (allow upgrade)
 * - Drum only → C recommended
 * 
 * Recording:
 * - Studio A only
 */

export function getKaraokeStudioSuggestion(option: KaraokeOption): StudioSuggestionResult {
  switch (option) {
    case 'upto_5':
      return {
        recommendedStudio: 'Studio C',
        allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
        explanation: 'For up to 5 participants, Studio C is perfect. You can upgrade to B or A for more space.',
      };
    case '10':
      return {
        recommendedStudio: 'Studio B',
        allowedStudios: ['Studio B', 'Studio A'],
        explanation: 'For 10 participants, Studio B is recommended. You can upgrade to A for more comfort.',
      };
    case '20':
      return {
        recommendedStudio: 'Studio A',
        allowedStudios: ['Studio A'],
        explanation: 'For 20 participants, only Studio A can accommodate your group.',
      };
    case '21_30':
      return {
        recommendedStudio: 'Studio A',
        allowedStudios: ['Studio A'],
        explanation: 'For 21-30 participants, Studio A is required for your group size.',
      };
    default:
      return {
        recommendedStudio: 'Studio C',
        allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
        explanation: 'Studio C is recommended for smaller groups.',
      };
  }
}

export function getLiveStudioSuggestion(option: LiveMusicianOption): StudioSuggestionResult {
  switch (option) {
    case 'upto_2':
      return {
        recommendedStudio: 'Studio C',
        allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
        explanation: 'For up to 2 musicians, Studio C is ideal. You can upgrade to B or A for more space.',
      };
    case 'upto_4_or_5':
      return {
        recommendedStudio: 'Studio B',
        allowedStudios: ['Studio B', 'Studio A'],
        explanation: 'For up to 4-5 musicians, Studio B is recommended. You can upgrade to A.',
      };
    case 'upto_8':
      return {
        recommendedStudio: 'Studio A',
        allowedStudios: ['Studio A'],
        explanation: 'For up to 8 musicians, Studio A is required for adequate space.',
      };
    case '9_12':
      return {
        recommendedStudio: 'Studio A',
        allowedStudios: ['Studio A'],
        explanation: 'For 9-12 musicians, only Studio A can accommodate your group.',
      };
    default:
      return {
        recommendedStudio: 'Studio C',
        allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
        explanation: 'Studio C is recommended for smaller groups.',
      };
  }
}

export function getBandStudioSuggestion(equipment: BandEquipment[]): StudioSuggestionResult {
  const hasDrum = equipment.includes('drum');
  const hasAmps = equipment.includes('amps');
  const hasGuitars = equipment.includes('guitars');
  const hasKeyboard = equipment.includes('keyboard');

  // Full stack (Drum+Amps+Guitars+Keyboard) → A only
  if (hasDrum && hasAmps && hasGuitars && hasKeyboard) {
    return {
      recommendedStudio: 'Studio A',
      allowedStudios: ['Studio A'],
      explanation: 'Full band setup (Drums, Amps, Guitars, Keyboard) requires Studio A.',
    };
  }

  // Drum+Guitars+Amps → B recommended (allow upgrade to A)
  if (hasDrum && hasGuitars && hasAmps) {
    return {
      recommendedStudio: 'Studio B',
      allowedStudios: ['Studio B', 'Studio A'],
      explanation: 'Drums, Guitars, and Amps setup is best in Studio B. You can upgrade to A.',
    };
  }

  // Drum+Amps only → C recommended (allow upgrade)
  if (hasDrum && hasAmps && !hasGuitars && !hasKeyboard) {
    return {
      recommendedStudio: 'Studio C',
      allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
      explanation: 'Drums and Amps setup fits in Studio C. You can upgrade to B or A.',
    };
  }

  // Drum only → C recommended
  if (hasDrum && !hasAmps && !hasGuitars && !hasKeyboard) {
    return {
      recommendedStudio: 'Studio C',
      allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
      explanation: 'Drum only setup fits in Studio C. You can upgrade if needed.',
    };
  }

  // Default: if no drum but other equipment, allow all studios
  return {
    recommendedStudio: 'Studio C',
    allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
    explanation: 'Your equipment setup fits in Studio C. You can upgrade if needed.',
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
    case 'Karaoke':
      if (options.karaokeOption) {
        return getKaraokeStudioSuggestion(options.karaokeOption);
      }
      break;
    case 'Live with musicians':
      if (options.liveOption) {
        return getLiveStudioSuggestion(options.liveOption);
      }
      break;
    case 'Only Drum Practice':
      return {
        recommendedStudio: 'Studio A',
        allowedStudios: ['Studio A'],
        explanation: 'Drum practice sessions are only available in Studio A.',
      };
    case 'Band':
      if (options.bandEquipment && options.bandEquipment.length > 0) {
        return getBandStudioSuggestion(options.bandEquipment);
      }
      break;
    case 'Recording':
      return {
        recommendedStudio: 'Studio A',
        allowedStudios: ['Studio A'],
        explanation: 'Recording sessions are only available in Studio A.',
      };
  }

  // Default fallback
  return {
    recommendedStudio: 'Studio C',
    allowedStudios: ['Studio C', 'Studio B', 'Studio A'],
    explanation: 'Please select your session details to see studio recommendations.',
  };
}

/**
 * Check if a studio is allowed based on the current selection
 */
export function isStudioAllowed(studio: StudioName, allowedStudios: StudioName[]): boolean {
  return allowedStudios.includes(studio);
}

/**
 * Get the studio rates based on session type and studio
 */
export const STUDIO_RATES: Record<StudioName, Record<string, number>> = {
  'Studio A': {
    karaoke_standard: 400,
    karaoke_large: 500,
    live_standard: 600,
    live_large: 800,
    drum_practice: 350,
    band_standard: 600,
    recording_audio: 700,
    recording_video: 800,
    recording_chroma: 1200,
    recording_sd: 100,
  },
  'Studio B': {
    karaoke_standard: 300,
    live_standard: 400,
    live_5: 500,
    band_standard: 450,
    band_small: 400,
  },
  'Studio C': {
    karaoke_standard: 250,
    live_standard: 350,
    band_standard: 350,
    band_small: 300,
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
  }
): number {
  const rates = STUDIO_RATES[studio];
  
  switch (sessionType) {
    case 'Karaoke':
      if (options.karaokeOption === '21_30') {
        return rates.karaoke_large || rates.karaoke_standard || 400;
      }
      return rates.karaoke_standard || 300;
      
    case 'Live with musicians':
      if (options.liveOption === '9_12') {
        return rates.live_large || rates.live_standard || 600;
      }
      if (options.liveOption === 'upto_4_or_5' && studio === 'Studio B') {
        return rates.live_5 || rates.live_standard || 500;
      }
      return rates.live_standard || 400;
      
    case 'Only Drum Practice':
      return rates.drum_practice || 350;
      
    case 'Band':
      const equipment = options.bandEquipment || [];
      const hasAll = equipment.length === 4;
      const hasThree = equipment.includes('drum') && equipment.includes('amps') && equipment.includes('guitars');
      if (hasAll || hasThree) {
        return rates.band_standard || 450;
      }
      return rates.band_small || rates.band_standard || 350;
      
    case 'Recording':
      if (options.recordingOption === 'chroma_key') return rates.recording_chroma || 1200;
      if (options.recordingOption === 'video_recording') return rates.recording_video || 800;
      if (options.recordingOption === 'sd_card_recording') return rates.recording_sd || 100;
      return rates.recording_audio || 700;
      
    default:
      return 300;
  }
}
