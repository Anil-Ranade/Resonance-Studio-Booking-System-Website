'use client';

import { Calendar, Clock, Building2, Users, Mic, CreditCard, AlertCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import StepLayout from './StepLayout';

export default function ReviewStep() {
  const { draft, nextStep, hasChangesFromOriginal } = useBooking();

  // Check if there are changes in edit mode
  const hasChanges = hasChangesFromOriginal();

  // Format phone for display
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phone;
  };

  // Format time for display in 24-hour format
  const formatTime = (time: string) => {
    return time.slice(0, 5); // Returns "HH:MM" format
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get session details for display
  const getSessionDetails = () => {
    if (!draft.sessionType) return '';

    if (draft.sessionType === 'Karaoke' && draft.karaokeOption) {
      const labels: Record<string, string> = {
        '1_5': '1–5 participants',
        '6_10': '6–10 participants',
        '11_20': '11–20 participants',
        '21_30': '21–30 participants',
      };
      return labels[draft.karaokeOption] || '';
    }

    if (draft.sessionType === 'Live with musicians' && draft.liveOption) {
      const labels: Record<string, string> = {
        '1_2': '1–2 musicians',
        '3_4': '3–4 musicians',
        '5': '5 musicians',
        '6_8': '6–8 musicians',
        '9_12': '9–12 musicians',
      };
      return labels[draft.liveOption] || '';
    }

    if (draft.sessionType === 'Band' && draft.bandEquipment.length > 0) {
      const equipmentLabels: Record<string, string> = {
        'drum': 'Drums',
        'amps': 'Amps',
        'guitars': 'Guitars',
        'keyboard': 'Keyboard',
      };
      return draft.bandEquipment.map(e => equipmentLabels[e]).join(', ');
    }

    if (draft.sessionType === 'Recording' && draft.recordingOption) {
      const labels: Record<string, string> = {
        'audio_recording': 'Audio Recording',
        'video_recording': 'Video Recording (4K)',
        'chroma_key': 'Chroma Key (Green Screen)',
      };
      return labels[draft.recordingOption] || '';
    }

    return '';
  };

  const totalAmount = draft.ratePerHour * draft.duration;

  const handleNext = () => {
    nextStep();
  };

  return (
    <StepLayout
      title={draft.isEditMode ? "Review your changes" : "Review your booking"}
      subtitle={draft.isEditMode 
        ? (hasChanges ? "Confirm the updated details below" : "No changes detected")
        : "Please confirm the details below"
      }
      nextLabel={draft.isEditMode ? "Proceed to Update" : "Proceed to Verify"}
      onNext={handleNext}
      isNextDisabled={draft.isEditMode && !hasChanges}
    >
      <div className="space-y-2">
        {/* No Changes Warning for Edit Mode */}
        {draft.isEditMode && !hasChanges && (
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-400 font-medium text-xs">No Changes Made</h4>
              <p className="text-amber-400/80 text-xs mt-0.5">
                Please go back and modify the session, studio, date, or time slot.
              </p>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className={`p-2.5 rounded-xl bg-zinc-800/50 border ${draft.isEditMode ? 'border-blue-700/30' : 'border-zinc-700'}`}>
          <h3 className="text-xs font-medium text-zinc-400 mb-1.5">Contact Information</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs">Phone:</span>
              <span className="text-white font-medium text-xs">{formatPhone(draft.phone)}</span>
            </div>
            {draft.name && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">Name:</span>
                <span className="text-white text-xs">{draft.name}</span>
              </div>
            )}
            {draft.email && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">Email:</span>
                <span className="text-white text-xs truncate">{draft.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Session Details */}
        <div className={`p-2.5 rounded-xl bg-zinc-800/50 border ${draft.isEditMode ? 'border-blue-700/30' : 'border-zinc-700'}`}>
          <h3 className="text-xs font-medium text-zinc-400 mb-1.5">Session Details</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mic className={`w-3.5 h-3.5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <span className="text-white text-xs">{draft.sessionType}</span>
            </div>
            {getSessionDetails() && (
              <div className="flex items-center gap-2">
                <Users className={`w-3.5 h-3.5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
                <span className="text-zinc-300 text-xs">{getSessionDetails()}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2 className={`w-3.5 h-3.5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <span className="text-white text-xs">{draft.studio}</span>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className={`p-2.5 rounded-xl bg-zinc-800/50 border ${draft.isEditMode ? 'border-blue-700/30' : 'border-zinc-700'}`}>
          <h3 className="text-xs font-medium text-zinc-400 mb-1.5">Date & Time</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className={`w-3.5 h-3.5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <span className="text-white text-xs">{formatDate(draft.date)}</span>
            </div>
            {draft.selectedSlot && (
              <div className="flex items-center gap-2">
                <Clock className={`w-3.5 h-3.5 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
                <span className="text-white text-xs">
                  {formatTime(draft.selectedSlot.start)} - {formatTime(draft.selectedSlot.end)}
                </span>
                <span className="text-zinc-400 text-xs">({draft.duration}hr{draft.duration > 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className={`p-2.5 rounded-xl ${draft.isEditMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-violet-500/10 border border-violet-500/20'}`}>
          <h3 className={`text-xs font-medium ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'} mb-1.5`}>Payment Summary</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Rate</span>
              <span className="text-white text-xs">₹{draft.ratePerHour}/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Duration</span>
              <span className="text-white text-xs">{draft.duration} hour{draft.duration > 1 ? 's' : ''}</span>
            </div>
            <div className={`border-t ${draft.isEditMode ? 'border-blue-500/20' : 'border-violet-500/20'} my-1`} />
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-xs">Total Amount</span>
              <span className={`text-lg font-bold ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-zinc-500 text-center">
          {draft.isEditMode 
            ? "Your booking will be updated with these new details."
            : "Payment to be made at the studio."
          }
        </p>
      </div>
    </StepLayout>
  );
}
