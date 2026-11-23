import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Queryable } from './client.js';
import {
  computeDeadlineStatus,
  getDeadlinesForService,
  getLocationsForService,
  listDeadlines,
  listLocations,
} from './schema/advanced.js';
import { scanFamilyEligibility } from './schema/family.js';
import { getLifeEventByKey, listLifeEvents } from './schema/life-events.js';

describe('Phase 13 Advanced DB Schema & Services', () => {
  describe('computeDeadlineStatus', () => {
    const fixedNow = new Date('2026-11-20T12:00:00Z');

    it('identifies UPCOMING deadlines when opensAt is in the future', () => {
      const res = computeDeadlineStatus('2026-12-01T00:00:00Z', '2026-12-31T23:59:59Z', fixedNow);
      assert.equal(res.status, 'UPCOMING');
      assert.equal(res.daysRemaining, null);
    });

    it('identifies EXPIRED deadlines when closesAt is in the past', () => {
      const res = computeDeadlineStatus('2026-10-01T00:00:00Z', '2026-11-15T23:59:59Z', fixedNow);
      assert.equal(res.status, 'EXPIRED');
      assert.equal(res.daysRemaining, 0);
    });

    it('identifies CLOSING_SOON when remaining days <= 15', () => {
      const res = computeDeadlineStatus(
        '2026-10-01T00:00:00Z',
        '2026-11-28T23:59:59Z', // ~8 days away
        fixedNow,
      );
      assert.equal(res.status, 'CLOSING_SOON');
      assert.ok(res.daysRemaining !== null && res.daysRemaining <= 15 && res.daysRemaining > 0);
    });

    it('identifies OPEN when remaining days > 15', () => {
      const res = computeDeadlineStatus(
        '2026-10-01T00:00:00Z',
        '2026-12-31T23:59:59Z', // ~41 days away
        fixedNow,
      );
      assert.equal(res.status, 'OPEN');
      assert.ok(res.daysRemaining !== null && res.daysRemaining > 15);
    });

    it('identifies OPEN when closesAt is null (ongoing scheme)', () => {
      const res = computeDeadlineStatus('2026-01-01T00:00:00Z', null, fixedNow);
      assert.equal(res.status, 'OPEN');
      assert.equal(res.daysRemaining, null);
    });
  });

  describe('listDeadlines & getDeadlinesForService', () => {
    const mockDb: Queryable = {
      query: async (sql, _values) => {
        assert.ok(typeof sql === 'string');
        return {
          rows: [
            {
              id: 'dl-1',
              service_id: 'srv-1',
              service_slug: 'post-matric-scholarship',
              service_title: 'Post-Matric Scholarship',
              category: 'SCHOLARSHIP',
              state_code: 'KA',
              name: 'Academic Year 2026-27 Application Deadline',
              opens_at: '2026-08-01T00:00:00Z',
              closes_at: '2026-12-31T23:59:59Z',
              status: 'OPEN',
              source_url: 'https://ssp.postmatric.karnataka.gov.in',
              publisher: 'Social Welfare Department',
              last_verified_at: '2026-11-15T00:00:00Z',
            },
          ],
        };
      },
    };

    it('lists published deadlines with source provenance', async () => {
      const deadlines = await listDeadlines(mockDb, {
        status: 'ALL',
        limit: 10,
        offset: 0,
      });

      assert.equal(deadlines.length, 1);
      assert.equal(deadlines[0]?.serviceSlug, 'post-matric-scholarship');
      assert.equal(deadlines[0]?.sourcePublisher, 'Social Welfare Department');
    });

    it('fetches service-specific deadlines', async () => {
      const deadlines = await getDeadlinesForService(mockDb, 'post-matric-scholarship');
      assert.equal(deadlines.length, 1);
      assert.equal(deadlines[0]?.id, 'dl-1');
    });
  });

  describe('listLocations & getLocationsForService', () => {
    const mockDb: Queryable = {
      query: async () => ({
        rows: [
          {
            id: 'loc-1',
            name: 'Bangalore One — Koramangala Civic Centre',
            center_type: 'B1_K1_CENTRE',
            address: '80 Feet Road, 4th Block, Koramangala, Bengaluru',
            district: 'Bengaluru Urban',
            taluk: 'Bengaluru South',
            state_code: 'KA',
            pincode: '560034',
            latitude: '12.934400',
            longitude: '77.625600',
            contact_phone: '080-22967111',
            operating_hours: 'Mon-Sat 8am-7pm',
            verified_source_url: 'https://karnataka.gov.in/bangaloreone',
            is_active: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            services_json: [
              {
                service_id: 'srv-1',
                slug: 'post-matric-scholarship',
                title: 'Post-Matric Scholarship',
                assistance_type: 'BIOMETRIC_EKYC',
              },
            ],
          },
        ],
      }),
    };

    it('retrieves locations with supported services mapped', async () => {
      const locations = await listLocations(mockDb, {
        district: 'Bengaluru Urban',
        limit: 10,
        offset: 0,
      });

      assert.equal(locations.length, 1);
      assert.equal(locations[0]?.name, 'Bangalore One — Koramangala Civic Centre');
      assert.equal(locations[0]?.centerType, 'B1_K1_CENTRE');
      assert.equal(locations[0]?.latitude, 12.9344);
      assert.equal(locations[0]?.supportedServices.length, 1);
      assert.equal(locations[0]?.supportedServices[0]?.assistanceType, 'BIOMETRIC_EKYC');
    });

    it('retrieves locations by service', async () => {
      const locations = await getLocationsForService(mockDb, 'post-matric-scholarship');
      assert.equal(locations.length, 1);
      assert.equal(locations[0]?.supportedServices[0]?.serviceSlug, 'post-matric-scholarship');
    });
  });

  describe('Curated Life Events', () => {
    it('returns all 5 life event transitions in correct order', () => {
      const events = listLifeEvents();
      assert.equal(events.length, 5);
      assert.equal(events[0]?.key, 'EDUCATION_HIGHER');
      assert.equal(events[1]?.key, 'CHILDBIRTH_MATERNITY');
      assert.equal(events[2]?.key, 'EMPLOYMENT_LIVELIHOOD');
      assert.equal(events[3]?.key, 'SENIOR_RETIREMENT');
      assert.equal(events[4]?.key, 'BEREAVEMENT_SURVIVOR');
    });

    it('retrieves specific life event with multilingual titles and bundles', () => {
      const event = getLifeEventByKey('EDUCATION_HIGHER');
      assert.ok(event !== null);
      assert.equal(event.title['en'], 'Higher Education & Student Support');
      assert.ok(event.title['kn']);
      assert.ok(event.title['hi']);
      assert.ok(event.serviceBundles.length >= 1);
      assert.equal(event.serviceBundles[0]?.slug, 'post-matric-scholarship');
    });

    it('returns null for unknown life event', () => {
      // @ts-expect-error Testing invalid key runtime safety
      const event = getLifeEventByKey('UNKNOWN_EVENT');
      assert.equal(event, null);
    });
  });

  describe('scanFamilyEligibility', () => {
    it('scans multi-member family and maps appropriate schemes per member', () => {
      const scan = scanFamilyEligibility([
        {
          id: 'mem-1',
          name: 'Pooja',
          relationship: 'SELF',
          age: 36,
          gender: 'FEMALE',
          occupation: 'Homemaker',
          educationLevel: '10th Standard',
          annualIncome: 120_000,
        },
        {
          id: 'mem-2',
          name: 'Rohan',
          relationship: 'CHILD',
          age: 19,
          gender: 'MALE',
          occupation: 'Student',
          educationLevel: 'Degree 2nd Year',
          annualIncome: 0,
        },
        {
          id: 'mem-3',
          name: 'Narayana',
          relationship: 'PARENT',
          age: 68,
          gender: 'MALE',
          occupation: 'Retired',
          educationLevel: 'SSLC',
          annualIncome: 25_000,
        },
        {
          id: 'mem-4',
          name: 'Deepak',
          relationship: 'CHILD',
          age: 23,
          gender: 'MALE',
          occupation: 'Unemployed Graduate seeking job',
          educationLevel: 'B.Com Graduate',
          annualIncome: 0,
        },
      ]);

      assert.equal(scan.scannedCount, 4);
      assert.ok(scan.totalEligibleFound >= 4);

      // Pooja should qualify for Gruha Lakshmi check
      const pooja = scan.results.find((r) => r.memberName === 'Pooja');
      assert.ok(pooja?.eligibleServices.some((s) => s.slug === 'gruha-lakshmi-scheme'));

      // Rohan should qualify for Post-Matric Scholarship
      const rohan = scan.results.find((r) => r.memberName === 'Rohan');
      assert.ok(rohan?.eligibleServices.some((s) => s.slug === 'post-matric-scholarship'));

      // Narayana (68 yrs, ₹25k income) should qualify for Senior Card and Sandhya Suraksha Pension
      const narayana = scan.results.find((r) => r.memberName === 'Narayana');
      assert.ok(narayana?.eligibleServices.some((s) => s.slug === 'synthetic-senior-citizen-card'));
      assert.ok(narayana?.eligibleServices.some((s) => s.slug === 'sandhya-suraksha-pension'));

      // Deepak (23 yrs, unemployed graduate) should qualify for Yuva Nidhi
      const deepak = scan.results.find((r) => r.memberName === 'Deepak');
      assert.ok(deepak?.eligibleServices.some((s) => s.slug === 'yuva-nidhi-scheme'));
    });
  });
});
