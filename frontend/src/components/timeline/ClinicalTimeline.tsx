import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  FileText,
  AlertTriangle,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  HeartPulse,
} from 'lucide-react';
import { TimelineEvent } from '../../types';

interface ClinicalTimelineProps {
  timeline: TimelineEvent[];
  onOpenEvidence: (recordId: string) => void;
  patientName?: string;
  patientId?: string;
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({
  timeline,
  onOpenEvidence,
  patientName = 'Lakshmi Sundaram',
  patientId = 'P001',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Category filter definitions
  const filters = [
    { id: 'all', label: 'All Events' },
    { id: 'admission', label: 'Admissions' },
    { id: 'medication_change', label: 'Medications' },
    { id: 'condition', label: 'Diagnoses' },
    { id: 'lab_result', label: 'Laboratory Results' },
    { id: 'clinical_note', label: 'Clinical Notes' },
  ];

  // Helper to map category to friendly badge and icon
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'admission':
      case 'discharge':
        return {
          icon: Building2,
          label: 'Hospital Stay',
          badge: 'bg-[#F0FAF9] text-[#21666C] border-[#BCE5E1]',
          dot: 'bg-[#287B80]',
        };
      case 'medication_change':
      case 'prescription':
        return {
          icon: Pill,
          label: 'Medication',
          badge: 'bg-[#E6F4ED] text-[#174F55] border-[#B5E4D3]',
          dot: 'bg-[#4FA58D]',
        };
      case 'condition':
        return {
          icon: HeartPulse,
          label: 'Diagnosis',
          badge: 'bg-[#FFF4F0] text-[#A94B40] border-[#FBC9BB]',
          dot: 'bg-[#E77763]',
        };
      case 'lab_result':
        return {
          icon: Activity,
          label: 'Laboratory',
          badge: 'bg-[#FFF9EA] text-[#996B1F] border-[#F5D47D]',
          dot: 'bg-[#D99E32]',
        };
      case 'clinical_note':
      default:
        return {
          icon: FileText,
          label: 'Clinical Note',
          badge: 'bg-[#F7F9F5] text-[#4C6865] border-[#CAD8D1]',
          dot: 'bg-[#657C78]',
        };
    }
  };

  // Filtered and chronologically sorted events
  const filteredEvents = useMemo(() => {
    return timeline
      .filter((evt) => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'admission') return evt.category === 'admission' || evt.category === 'discharge';
        if (selectedFilter === 'medication_change') return evt.category === 'medication_change' || evt.category === 'prescription';
        if (selectedFilter === 'condition') return (evt.category as string) === 'condition';
        if (selectedFilter === 'lab_result') return evt.category === 'lab_result';
        if (selectedFilter === 'clinical_note') return evt.category === 'clinical_note' || evt.category === 'encounter';
        return true;
      })
      .filter((evt) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          evt.title.toLowerCase().includes(q) ||
          evt.description.toLowerCase().includes(q) ||
          evt.recordId.toLowerCase().includes(q) ||
          (evt.hospitalName && evt.hospitalName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [timeline, selectedFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. Header Section
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#173F43] tracking-tight font-['Outfit']">
              Patient history over time.
            </h1>
            <p className="text-sm text-[#657C78] mt-1">
              Follow clinical events, admissions, medication changes and investigations across encounters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-[#E6F4ED] text-[#174F55] border border-[#B5E4D3]">
              {patientName} ({patientId})
            </span>
            <span className="text-xs text-[#829590] font-mono">
              {filteredEvents.length} Events
            </span>
          </div>
        </div>

        {/* Filter Bar & Search Input */}
        <div className="pt-3 border-t border-[#E1EAE3] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f) => {
              const isSelected = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#173F43] text-white shadow-xs'
                      : 'bg-[#FBFAF4] hover:bg-[#EEF3EE] text-[#657C78] hover:text-[#173F43] border border-[#E1EAE3]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#829590]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timeline events..."
              className="w-full bg-[#FBFAF4] border border-[#E1EAE3] text-xs pl-9 pr-3 py-2 rounded-xl text-[#173F43] placeholder-[#A8B9B2] focus:outline-none focus:ring-2 focus:ring-[#91D5BE]"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Chronological Timeline Stream
          ───────────────────────────────────────────────────────────── */}
      {filteredEvents.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#CAD8D1]">
          {filteredEvents.map((evt, idx) => {
            const meta = getCategoryMeta(evt.category);
            const Icon = meta.icon;
            const dateObj = new Date(evt.timestamp);
            const formattedDate = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : evt.timestamp.split('T')[0];

            return (
              <div key={evt.id || idx} className="relative group">
                {/* Timeline Node Anchor Dot */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-5 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${meta.dot}`}
                />

                {/* Event Card */}
                <div
                  onClick={() => evt.sourceRecordId && onOpenEvidence(evt.sourceRecordId)}
                  className="bg-[#FFFEFB] border border-[#E1EAE3] hover:border-[#91D5BE] hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer space-y-3"
                >
                  {/* Top Bar: Date, Category Badge, Department / Hospital, Source ID */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#173F43]">
                        <Clock className="w-3.5 h-3.5 text-[#657C78]" />
                        <span>{formattedDate}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg border ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#829590]">
                      {evt.hospitalName && (
                        <span className="text-[#24665F] font-semibold">{evt.hospitalName}</span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-[#F7F9F5] border border-[#E1EAE3]">
                        {evt.recordId}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#173F43] group-hover:text-[#174F55] transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#657C78] mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  {/* Bottom Strip: Related Encounter / Admission & Inspect Evidence Link */}
                  <div className="pt-2.5 border-t border-[#E1EAE3] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#657C78]">
                      {evt.details?.admissionId && (
                        <span>Admission: <strong className="text-[#173F43]">{evt.details.admissionId}</strong></span>
                      )}
                      {evt.details?.encounterId && (
                        <span>Encounter: <strong className="text-[#173F43]">{evt.details.encounterId}</strong></span>
                      )}
                      {evt.details?.medicationName && (
                        <span>Med: <strong className="text-[#173F43]">{evt.details.medicationName}</strong></span>
                      )}
                    </div>

                    {evt.sourceRecordId && (
                      <div className="text-[11px] font-bold text-[#4FA58D] group-hover:text-[#174F55] flex items-center gap-1">
                        <span>Source: {evt.sourceRecordId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#FFFEFB] border border-[#E1EAE3] rounded-3xl p-12 text-center space-y-3">
          <Calendar className="w-8 h-8 text-[#829590] mx-auto" />
          <h3 className="text-sm font-bold text-[#173F43]">No timeline events match the selected criteria</h3>
          <p className="text-xs text-[#657C78]">Try clearing the search query or switching to All Events.</p>
        </div>
      )}
    </div>
  );
};
