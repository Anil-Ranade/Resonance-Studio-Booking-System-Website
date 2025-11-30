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

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
        'upto_5': 'Up to 5 people',
        '10': '10 people',
        '20': '20 people',
        '21_30': '21-30 people',
      };
      return labels[draft.karaokeOption] || '';
    }

    if (draft.sessionType === 'Live with musicians' && draft.liveOption) {
      const labels: Record<string, string> = {
        'upto_2': 'Up to 2 musicians',
        'upto_4_or_5': '4-5 musicians',
        'upto_8': 'Up to 8 musicians',
        '9_12': '9-12 musicians',
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
        'sd_card_recording': 'SD Card Recording',
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
      <div className="space-y-3">
        {/* No Changes Warning for Edit Mode */}
        {draft.isEditMode && !hasChanges && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-400 font-medium text-sm">No Changes Made</h4>
              <p className="text-amber-400/80 text-xs mt-1">
                You haven't made any changes to your booking. Please go back and modify the session type, studio, date, or time slot if you want to update your booking.
              </p>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className={`p-3 rounded-xl bg-zinc-800/50 border ${draft.isEditMode ? 'border-blue-700/30' : 'border-zinc-700'}`}>
          <h3 className="text-xs font-medium text-zinc-400 mb-2">Contact Information</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-sm">Phone:</span>
              <span className="text-white font-medium text-sm">{formatPhone(draft.phone)}</span>
            </div>
            {draft.name && (
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 text-sm">Name:</span>
                <span className="text-white text-sm">{draft.name}</span>
              </div>
            )}
            {draft.email && (
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 text-sm">Email:</span>
                <span className="text-white text-sm">{draft.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Session Details */}
        <div className={`p-3 rounded-xl bg-zinc-800/50 border ${draft.isEditMode ? 'border-blue-700/30' : 'border-zinc-700'}`}>
          <h3 className="text-xs font-medium text-zinc-400 mb-2">Session Details</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Mic className={`w-4 h-4 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <span className="text-white text-sm">{draft.sessionType}</span>
            </div>
            {getSessionDetails() && (
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
                <span className="text-zinc-300 text-sm">{getSessionDetails()}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2 className={`w-4 h-4 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <span className="text-white text-sm">{draft.studio}</span>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className={`p-3 rounded-xl bg-zinc-800/50 border ${draft.isEditMode ? 'border-blue-700/30' : 'border-zinc-700'}`}>
          <h3 className="text-xs font-medium text-zinc-400 mb-2">Date & Time</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
              <span className="text-white text-sm">{formatDate(draft.date)}</span>
            </div>
            {draft.selectedSlot && (
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`} />
                <span className="text-white text-sm">
                  {formatTime(draft.selectedSlot.start)} - {formatTime(draft.selectedSlot.end)}
                </span>
                <span className="text-zinc-400 text-xs">({draft.duration} hour{draft.duration > 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className={`p-3 rounded-xl ${draft.isEditMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-violet-500/10 border border-violet-500/20'}`}>
          <h3 className={`text-xs font-medium ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'} mb-2`}>Payment Summary</h3>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Rate</span>
              <span className="text-white text-sm">₹{draft.ratePerHour}/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Duration</span>
              <span className="text-white text-sm">{draft.duration} hour{draft.duration > 1 ? 's' : ''}</span>
            </div>
            <div className={`border-t ${draft.isEditMode ? 'border-blue-500/20' : 'border-violet-500/20'} my-1.5`} />
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">Total Amount</span>
              <span className={`text-xl font-bold ${draft.isEditMode ? 'text-blue-400' : 'text-violet-400'}`}>₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-zinc-500 text-center pb-2">
          {draft.isEditMode 
            ? "Your booking will be updated with these new details."
            : "Payment to be made at the studio. We'll send you a confirmation SMS after verification."
          }
        </p>
      </div>
    </StepLayout>
  );
}
