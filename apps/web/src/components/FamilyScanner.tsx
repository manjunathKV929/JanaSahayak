'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type {
  FamilyMemberProfile,
  FamilyRelationship,
  FamilyScanResponse,
  Gender,
} from '@janasahayak/types';
import { Alert, Card } from '@janasahayak/ui';
import { executeFamilyScan } from '@/lib/catalogue';

const RELATIONSHIPS: Array<{ label: string; value: FamilyRelationship }> = [
  { label: 'Self', value: 'SELF' },
  { label: 'Spouse', value: 'SPOUSE' },
  { label: 'Child / Student', value: 'CHILD' },
  { label: 'Parent', value: 'PARENT' },
  { label: 'Sibling', value: 'SIBLING' },
  { label: 'Grandparent', value: 'GRANDPARENT' },
  { label: 'Other Relative', value: 'OTHER' },
];

const GENDERS: Array<{ label: string; value: Gender }> = [
  { label: 'Female', value: 'FEMALE' },
  { label: 'Male', value: 'MALE' },
  { label: 'Other', value: 'OTHER' },
  { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
];

const INITIAL_MEMBERS: FamilyMemberProfile[] = [
  {
    id: 'f-1',
    name: 'Sunita (Self)',
    relationship: 'SELF',
    age: 40,
    gender: 'FEMALE',
    occupation: 'Homemaker / Self-employed',
    educationLevel: '10th Standard',
    annualIncome: 150000,
    residenceState: 'KA',
  },
  {
    id: 'f-2',
    name: 'Pooja (Daughter)',
    relationship: 'CHILD',
    age: 19,
    gender: 'FEMALE',
    occupation: 'College Student',
    educationLevel: 'Degree 2nd Year (B.Sc)',
    annualIncome: 0,
    residenceState: 'KA',
  },
  {
    id: 'f-3',
    name: 'Govindappa (Father-in-law)',
    relationship: 'PARENT',
    age: 68,
    gender: 'MALE',
    occupation: 'Retired / Senior',
    educationLevel: 'Primary School',
    annualIncome: 24000,
    residenceState: 'KA',
  },
];

export function FamilyScanner() {
  const [members, setMembers] = useState<FamilyMemberProfile[]>(INITIAL_MEMBERS);
  const [scanResult, setScanResult] = useState<FamilyScanResponse | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Form state for adding member
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState<FamilyRelationship>('CHILD');
  const [newAge, setNewAge] = useState<number>(20);
  const [newGender, setNewGender] = useState<Gender>('FEMALE');
  const [newOccupation, setNewOccupation] = useState('Student');
  const [newEducation, setNewEducation] = useState('Degree / Diploma');
  const [newIncome, setNewIncome] = useState<string>('0');
  const [formError, setFormError] = useState('');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Please enter a name or alias for the family member.');
      return;
    }

    const member: FamilyMemberProfile = {
      id: `f-${Date.now()}`,
      name: newName.trim(),
      relationship: newRelationship,
      age: Number(newAge),
      gender: newGender,
      occupation: newOccupation.trim(),
      educationLevel: newEducation.trim(),
      annualIncome: newIncome ? Number(newIncome) : null,
      residenceState: 'KA',
    };

    setMembers([...members, member]);
    setIsAdding(false);
    setNewName('');
    setFormError('');
    setScanResult(null); // Reset scan result on profile mutation
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    setScanResult(null);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const response = await executeFamilyScan(members);
      setScanResult(response);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Privacy Notice */}
      <Alert variant="info" title="Zero-Knowledge Family Privacy">
        Family profiles are kept temporarily in your browser session. You do not need to enter real
        names, phone numbers, or identity cards. Do not enter Aadhaar or bank numbers.
      </Alert>

      {/* Family Members Card List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-civic-border pb-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-civic-navy">
              Household Members ({members.length})
            </h2>
            <p className="text-xs text-civic-muted">
              Add family members to discover multi-scheme entitlements simultaneously.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white border border-civic-border text-civic-navy hover:bg-civic-ivory min-h-[44px] shadow-sm transition-colors"
          >
            <span>{isAdding ? 'Cancel' : '+ Add Family Member'}</span>
          </button>
        </div>

        {/* Add Member Drawer/Form */}
        {isAdding && (
          <form
            onSubmit={handleAddMember}
            className="p-5 bg-white border-2 border-civic-navy/30 rounded-lg space-y-4 shadow-md"
          >
            <h3 className="font-heading font-bold text-sm text-civic-navy">
              Add Family Member Profile
            </h3>

            {formError && <p className="text-xs text-red-600 font-semibold">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-civic-charcoal mb-1">
                  Name or Nickname:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh or Elder Son"
                  className="w-full px-3 py-2 border border-civic-border rounded text-civic-charcoal focus:outline-civic-navy min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-civic-charcoal mb-1">Relationship:</label>
                <select
                  value={newRelationship}
                  onChange={(e) => setNewRelationship(e.target.value as FamilyRelationship)}
                  className="w-full px-3 py-2 border border-civic-border rounded text-civic-charcoal focus:outline-civic-navy min-h-[44px]"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-civic-charcoal mb-1">Age:</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  required
                  value={newAge}
                  onChange={(e) => setNewAge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-civic-border rounded text-civic-charcoal focus:outline-civic-navy min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-civic-charcoal mb-1">Gender:</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 border border-civic-border rounded text-civic-charcoal focus:outline-civic-navy min-h-[44px]"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-civic-charcoal mb-1">Occupation:</label>
                <input
                  type="text"
                  value={newOccupation}
                  onChange={(e) => setNewOccupation(e.target.value)}
                  placeholder="e.g. Student, Farmer, Homemaker, Unemployed"
                  className="w-full px-3 py-2 border border-civic-border rounded text-civic-charcoal focus:outline-civic-navy min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-civic-charcoal mb-1">Education Level:</label>
                <input
                  type="text"
                  value={newEducation}
                  onChange={(e) => setNewEducation(e.target.value)}
                  placeholder="e.g. 10th Standard, Degree, Post Graduate"
                  className="w-full px-3 py-2 border border-civic-border rounded text-civic-charcoal focus:outline-civic-navy min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-civic-charcoal mb-1">
                  Annual Income (₹):
                </label>
                <input
                  type="number"
                  min={0}
                  value={newIncome}
                  onChange={(e) => setNewIncome(e.target.value)}
                  placeholder="e.g. 150000 (0 for students/dependents)"
                  className="w-full px-3 py-2 border border-civic-border rounded text-civic-charcoal focus:outline-civic-navy min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-civic-border">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-civic-muted hover:text-civic-navy min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded text-xs font-semibold bg-civic-navy text-white hover:bg-civic-navy-dark min-h-[44px]"
              >
                Save Member
              </button>
            </div>
          </form>
        )}

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {members.map((m) => (
            <Card
              key={m.id}
              variant="bordered"
              className="p-4 bg-white border-civic-border space-y-2 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-heading font-bold text-sm text-civic-navy">{m.name}</h4>
                  <span className="text-[11px] font-semibold text-civic-muted uppercase">
                    {m.relationship} • {m.age} yrs • {m.gender.toLowerCase()}
                  </span>
                </div>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id!)}
                    aria-label={`Remove ${m.name}`}
                    className="text-xs text-civic-muted hover:text-red-600 font-bold p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="text-xs text-civic-charcoal space-y-0.5 pt-1 border-t border-civic-border/50">
                <p>
                  <span className="text-civic-muted">Role:</span> {m.occupation}
                </p>
                <p>
                  <span className="text-civic-muted">Education:</span> {m.educationLevel}
                </p>
                {m.annualIncome !== null && m.annualIncome !== undefined && (
                  <p>
                    <span className="text-civic-muted">Income:</span> ₹
                    {m.annualIncome.toLocaleString('en-IN')}/yr
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* One-Click Multi-Member Scan Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-civic-navy/5 p-4 rounded-lg border border-civic-navy/20">
          <div>
            <p className="font-heading font-bold text-sm text-civic-navy">
              Ready to scan entitlements for all {members.length} members?
            </p>
            <p className="text-xs text-civic-muted">
              Cross-references education, social welfare, women empowerment, and senior citizen
              schemes simultaneously.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning || members.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-heading font-bold text-sm bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px] shadow-sm disabled:opacity-50 transition-colors"
          >
            {isScanning ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Scanning All Schemes...</span>
              </>
            ) : (
              <span>Scan Household Schemes 🔍</span>
            )}
          </button>
        </div>
      </div>

      {/* Scan Results Display */}
      {scanResult && (
        <section aria-labelledby="scan-results-heading" className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-civic-border pb-3">
            <h3
              id="scan-results-heading"
              className="font-heading font-bold text-xl text-civic-navy"
            >
              Household Scheme Entitlements ({scanResult.totalEligibleFound} Found)
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-civic-green bg-civic-green/10 px-2.5 py-1 rounded-full">
              Verified Scan
            </span>
          </div>

          <div className="space-y-6">
            {scanResult.results.map((item) => (
              <div
                key={item.memberId}
                className="bg-white rounded-lg border border-civic-border p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-2 border-b border-civic-border/60 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-civic-navy"></span>
                  <h4 className="font-heading font-bold text-base text-civic-navy">
                    {item.memberName}
                  </h4>
                  <span className="text-xs text-civic-muted uppercase font-semibold">
                    ({item.relationship})
                  </span>
                  <span className="ml-auto text-xs font-semibold text-civic-green">
                    {item.eligibleServices.length} potentially relevant schemes
                  </span>
                </div>

                {item.eligibleServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.eligibleServices.map((svc) => (
                      <div
                        key={svc.serviceId}
                        className="p-3.5 bg-civic-ivory/50 rounded-lg border border-civic-border space-y-2 hover:border-civic-navy transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-civic-green">
                            {svc.category}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-civic-green/10 text-civic-green">
                            {svc.confidence === 'POTENTIALLY_ELIGIBLE'
                              ? 'Potentially Eligible'
                              : 'Check Required'}
                          </span>
                        </div>
                        <h5 className="font-heading font-bold text-sm text-civic-navy">
                          {svc.title}
                        </h5>
                        <p className="text-xs text-civic-charcoal leading-relaxed">{svc.reason}</p>
                        <div className="pt-2">
                          <Link
                            href={`/services/${svc.slug}`}
                            className="inline-flex items-center text-xs font-bold text-civic-navy hover:underline min-h-[44px]"
                          >
                            View Checklist & Start Journey →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-civic-muted italic">
                    No specific targeted schemes matched for this member criteria at this time.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
