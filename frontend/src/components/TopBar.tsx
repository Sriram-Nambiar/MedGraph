import React, { useState } from 'react';
import {
  Share2,
  ChevronDown,
  Search,
  HelpCircle,
  Menu,
  X,
  Activity,
  Layers,
  Sparkles,
  Network,
  Home,
  Clock,
  GitBranch,
  MessageSquare,
} from 'lucide-react';
import { Patient, SystemHealth } from '../types';

export type NavigationTab =
  | 'landing'
  | 'timeline'
  | 'graph'
  | '3d-graph'
  | 'investigation'
  | 'hospital-network';

interface TopBarProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  health: SystemHealth | null;
  onOpenSearch?: () => void;
  onOpenHelp?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  activeTab,
  setActiveTab,
  health,
  onOpenSearch,
  onOpenHelp,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'timeline' as NavigationTab, label: 'Patient Timeline' },
    { id: 'graph' as NavigationTab, label: 'Knowledge Graph' },
    { id: '3d-graph' as NavigationTab, label: '3D Graph' },
    { id: 'investigation' as NavigationTab, label: 'Investigations' },
    { id: 'hospital-network' as NavigationTab, label: 'Cross-Hospital' },
  ];

  const handlePatientSelect = (patientId: string) => {
    const p = patients.find((item) => item.id === patientId);
    if (p) {
      onSelectPatient(p);
    }
  };

  const handleNavClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryDiagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FBFAF4]/90 backdrop-blur-md border-b border-[#E1EAE3] shadow-xs transition-colors">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: MedGraph Wordmark + Network Icon Tile + Patient Switcher */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => handleNavClick('landing')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174F55] rounded-xl p-1 -ml-1 transition-opacity hover:opacity-90 cursor-pointer"
              title="MedGraph - Return to Home"
            >
              {/* Rounded Mint Tile with Network Icon */}
              <div className="w-9 h-9 rounded-xl bg-[#D1EEE3] border border-[#91D5BE] flex items-center justify-center text-[#174F55] shadow-xs">
                <Share2 className="w-4 h-4 stroke-[2.2] text-[#174F55]" />
              </div>
              <div className="flex items-baseline">
                <span className="text-lg font-black tracking-tight text-[#173F43] font-['Outfit']">
                  Med
                </span>
                <span className="text-lg font-black tracking-tight text-[#E77763] font-['Outfit']">
                  Graph
                </span>
              </div>
            </button>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-[#E1EAE3] hidden md:block" />

            {/* Patient Selector Dropdown - Compact Size */}
            {activeTab !== 'landing' && (
              <div className="relative flex items-center">
                <select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="appearance-none bg-[#FFFEFB] hover:bg-[#F2FBF7] text-[#173F43] border border-[#E1EAE3] hover:border-[#B5E4D3] text-[11px] font-semibold pl-2.5 pr-6 py-1 rounded-lg cursor-pointer w-32 sm:w-44 truncate shadow-xs transition-colors focus:outline-none focus:ring-1.5 focus:ring-[#91D5BE]"
                  aria-label="Select active patient"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="text-[#173F43] bg-white text-xs">
                      {p.name} ({p.id}) — {p.age}y
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none text-[#657C78]" />
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-[#EEF3EE]/70 p-1 rounded-2xl border border-[#E1EAE3]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E6F4ED] text-[#173F43] shadow-xs border border-[#B5E4D3]'
                      : 'text-[#657C78] hover:text-[#173F43] hover:bg-white/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Search, Help, Profile, Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger Button */}
            <button
              onClick={() => (onOpenSearch ? onOpenSearch() : setShowSearchModal(true))}
              className="p-2 rounded-xl text-[#657C78] hover:text-[#173F43] hover:bg-[#EEF3EE] transition-colors cursor-pointer"
              title="Search patient records, medications, notes"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Help / Guide Trigger Button */}
            <button
              onClick={() => (onOpenHelp ? onOpenHelp() : setShowHelpModal(true))}
              className="p-2 rounded-xl text-[#657C78] hover:text-[#173F43] hover:bg-[#EEF3EE] transition-colors cursor-pointer"
              title="MedGraph Clinical Reference & Guidance"
              aria-label="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Clinician Profile Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-[#173F43] text-white flex items-center justify-center font-bold text-xs select-none shadow-xs border border-[#24665F]"
              title="Attending Clinician (Dr. Sundaram, Chief Investigator)"
            >
              DR
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#173F43] hover:bg-[#EEF3EE] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown (< 768px) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FFFEFB] border-b border-[#E1EAE3] px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => handleNavClick('landing')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'landing'
                  ? 'bg-[#E6F4ED] text-[#173F43]'
                  : 'text-[#657C78] hover:bg-[#F7F9F5]'
              }`}
            >
              <Home className="w-4 h-4 text-[#4FA58D]" />
              <span>Landing Page</span>
            </button>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-[#E6F4ED] text-[#173F43] border border-[#B5E4D3]'
                      : 'text-[#657C78] hover:bg-[#F7F9F5] hover:text-[#173F43]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Mobile Patient Selector */}
            <div className="pt-2 mt-2 border-t border-[#E1EAE3]">
              <label className="text-[11px] font-mono font-bold text-[#657C78] uppercase block mb-1.5">
                Active Patient
              </label>
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  handlePatientSelect(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#FBFAF4] border border-[#E1EAE3] text-xs font-semibold p-2 rounded-xl text-[#173F43]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — {p.age}y
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {/* Global Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFEFB] border border-[#E1EAE3] w-full max-w-xl rounded-2xl shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-[#E1EAE3] flex items-center gap-3">
              <Search className="w-4 h-4 text-[#657C78]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, diagnosis, or record identifier..."
                className="w-full bg-transparent text-sm text-[#173F43] placeholder-[#A8B9B2] focus:outline-none font-medium"
                autoFocus
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-lg text-[#657C78] hover:bg-[#EEF3EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-[#829590] font-bold px-2 py-1">
                Matching Patient Records ({filteredPatients.length})
              </div>
              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p);
                    setActiveTab('timeline');
                    setShowSearchModal(false);
                  }}
                  className="p-2.5 rounded-xl hover:bg-[#F2FBF7] cursor-pointer flex items-center justify-between border border-transparent hover:border-[#D1EEE3] transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#173F43]">{p.name}</div>
                    <div className="text-[11px] text-[#657C78]">{p.primaryDiagnosis}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#E6F4ED] text-[#24665F] font-bold">
                    {p.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Guidance / Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFEFB] border border-[#E1EAE3] w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1EAE3] pb-3">
              <div className="flex items-center gap-2 text-[#173F43]">
                <HelpCircle className="w-5 h-5 text-[#4FA58D]" />
                <h3 className="font-extrabold text-base">MedGraph Clinical Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-[#657C78] hover:bg-[#EEF3EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#657C78] leading-relaxed">
              <p>
                <strong className="text-[#173F43]">MedGraph</strong> connects fragmented electronic
                health records across hospital encounters, admissions, and consultations.
              </p>
              <div className="space-y-2 bg-[#F2FBF7] p-3.5 rounded-xl border border-[#D1EEE3]">
                <div className="font-bold text-[#174F55]">Clinical Navigation:</div>
                <ul className="list-disc pl-4 space-y-1 text-[#24665F]">
                  <li>
                    <strong>Patient Timeline:</strong> Chronological history across all documented
                    encounters and admissions.
                  </li>
                  <li>
                    <strong>Knowledge Graph (2D & 3D):</strong> Visual network of conditions,
                    prescriptions, labs, and clinical notes.
                  </li>
                  <li>
                    <strong>Investigations:</strong> Multi-step clinical inquiry with LangGraph audit
                    and source provenance.
                  </li>
                  <li>
                    <strong>Cross-Hospital:</strong> Federated multi-hospital records with consent
                    controls and FHIR bundles.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#173F43] hover:bg-[#24665F] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
