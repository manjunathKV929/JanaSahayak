import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  executeFamilyScan,
  fetchDeadlines,
  fetchLifeEventByKey,
  fetchLifeEvents,
  fetchLocations,
  SYNTHETIC_DEADLINES,
  SYNTHETIC_LIFE_EVENTS,
  SYNTHETIC_LOCATIONS,
} from './catalogue.js';
import {
  getVoiceLocale,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from './voice.js';

describe('Phase 13 Advanced Features Web Suite', () => {
  describe('Voice Assistance Utilities', () => {
    it('maps supported languages to accurate Indian voice locales', () => {
      assert.equal(getVoiceLocale('en'), 'en-IN');
      assert.equal(getVoiceLocale('hi'), 'hi-IN');
      assert.equal(getVoiceLocale('kn'), 'kn-IN');
    });

    it('safely handles non-browser environments for speech APIs without throwing', () => {
      assert.equal(isSpeechRecognitionSupported(), false);
      assert.equal(isSpeechSynthesisSupported(), false);
    });
  });

  describe('Deadlines Tracking Dashboard Data', () => {
    it('contains synthetic deadlines with confirmed cutoffs and provenance', () => {
      assert.ok(SYNTHETIC_DEADLINES.length >= 3);
      for (const dl of SYNTHETIC_DEADLINES) {
        assert.ok(dl.id);
        assert.ok(dl.serviceSlug);
        assert.ok(dl.name);
        assert.ok(['OPEN', 'CLOSING_SOON', 'EXPIRED', 'UPCOMING'].includes(dl.status));
        assert.ok(dl.sourcePublisher);
      }
    });

    it('filters deadlines by status', async () => {
      const closingSoon = await fetchDeadlines({ status: 'CLOSING_SOON' });
      assert.ok(closingSoon.length >= 1);
      assert.ok(closingSoon.every((d) => d.status === 'CLOSING_SOON'));

      const all = await fetchDeadlines({ status: 'ALL' });
      assert.equal(all.length, SYNTHETIC_DEADLINES.length);
    });
  });

  describe('Location Discovery Data', () => {
    it('contains official citizen assistance centers with operating hours and coordinates', () => {
      assert.ok(SYNTHETIC_LOCATIONS.length >= 5);
      for (const loc of SYNTHETIC_LOCATIONS) {
        assert.ok(loc.name);
        assert.ok(loc.address);
        assert.ok(loc.district);
        assert.ok(loc.operatingHours);
        assert.ok(loc.verifiedSourceUrl);
        assert.ok(Array.isArray(loc.supportedServices));
      }
    });

    it('filters locations by district', async () => {
      const blr = await fetchLocations({ district: 'Bengaluru Urban' });
      assert.ok(blr.length >= 2);
      assert.ok(blr.every((l) => l.district.includes('Bengaluru Urban')));
    });

    it('filters locations by center type', async () => {
      const nadakacheri = await fetchLocations({ centerType: 'NADAKACHERI' });
      assert.ok(nadakacheri.length >= 2);
      assert.ok(nadakacheri.every((l) => l.centerType === 'NADAKACHERI'));
    });
  });

  describe('Life-Event Mode Bundles', () => {
    it('contains all 5 life transition milestones in sequential order', async () => {
      assert.equal(SYNTHETIC_LIFE_EVENTS.length, 5);
      const events = await fetchLifeEvents();
      assert.equal(events.length, 5);
      assert.equal(events[0]?.key, 'EDUCATION_HIGHER');
      assert.equal(events[1]?.key, 'CHILDBIRTH_MATERNITY');
      assert.equal(events[2]?.key, 'EMPLOYMENT_LIVELIHOOD');
      assert.equal(events[3]?.key, 'SENIOR_RETIREMENT');
      assert.equal(events[4]?.key, 'BEREAVEMENT_SURVIVOR');
    });

    it('provides multilingual titles and document requirements per milestone', async () => {
      const education = await fetchLifeEventByKey('EDUCATION_HIGHER');
      assert.ok(education);
      assert.equal(education.title.en, 'Higher Education & Student Support');
      assert.ok(education.title.kn);
      assert.ok(education.title.hi);
      assert.ok(education.serviceBundles.length >= 1);
      assert.ok((education.serviceBundles[0]?.requiredDocuments.length ?? 0) >= 2);
    });
  });

  describe('Family Mode Multi-Scheme Scanner', () => {
    it('evaluates household profile and returns tailored recommendations with privacy disclaimer', async () => {
      const scan = await executeFamilyScan([
        {
          id: 'mem-1',
          name: 'Mother',
          relationship: 'SELF',
          age: 42,
          gender: 'FEMALE',
          occupation: 'Self-employed',
          educationLevel: '12th Standard',
          annualIncome: 140000,
        },
        {
          id: 'mem-2',
          name: 'College Son',
          relationship: 'CHILD',
          age: 20,
          gender: 'MALE',
          occupation: 'Student',
          educationLevel: 'Degree',
          annualIncome: 0,
        },
        {
          id: 'mem-3',
          name: 'Elderly Grandmother',
          relationship: 'PARENT',
          age: 69,
          gender: 'FEMALE',
          occupation: 'Senior Citizen',
          educationLevel: 'Primary',
          annualIncome: 18000,
        },
      ]);

      assert.equal(scan.scannedCount, 3);
      assert.ok(scan.totalEligibleFound >= 3);
      assert.ok(scan.privacyDisclaimer.includes('Zero-knowledge scan'));

      const mother = scan.results.find((r) => r.memberName === 'Mother');
      assert.ok(mother?.eligibleServices.some((s) => s.slug === 'gruha-lakshmi-scheme'));

      const son = scan.results.find((r) => r.memberName === 'College Son');
      assert.ok(son?.eligibleServices.some((s) => s.slug === 'synthetic-post-matric-scholarship'));

      const grandmother = scan.results.find((r) => r.memberName === 'Elderly Grandmother');
      assert.ok(
        grandmother?.eligibleServices.some((s) => s.slug === 'synthetic-senior-citizen-card'),
      );
    });
  });
});
