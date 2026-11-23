import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deadlineQuerySchema,
  locationQuerySchema,
  familyMemberSchema,
  familyScanRequestSchema,
  lifeEventQuerySchema,
} from './advanced.js';

describe('Phase 13 Advanced Validation Schemas', () => {
  describe('deadlineQuerySchema', () => {
    it('applies defaults for status, limit, and offset', () => {
      const parsed = deadlineQuerySchema.parse({});
      assert.equal(parsed.status, 'ALL');
      assert.equal(parsed.limit, 50);
      assert.equal(parsed.offset, 0);
    });

    it('accepts valid status filters and bounds limit', () => {
      const parsed = deadlineQuerySchema.parse({
        status: 'CLOSING_SOON',
        limit: '25',
        offset: '10',
        state: 'KA',
      });
      assert.equal(parsed.status, 'CLOSING_SOON');
      assert.equal(parsed.limit, 25);
      assert.equal(parsed.offset, 10);
      assert.equal(parsed.state, 'KA');
    });

    it('rejects invalid status', () => {
      assert.throws(() => {
        deadlineQuerySchema.parse({ status: 'INVALID_STATUS' });
      });
    });
  });

  describe('locationQuerySchema', () => {
    it('accepts valid PIN codes and center types', () => {
      const parsed = locationQuerySchema.parse({
        pincode: '560034',
        centerType: 'B1_K1_CENTRE',
        district: 'Bengaluru Urban',
      });
      assert.equal(parsed.pincode, '560034');
      assert.equal(parsed.centerType, 'B1_K1_CENTRE');
      assert.equal(parsed.district, 'Bengaluru Urban');
    });

    it('rejects invalid Indian PIN codes', () => {
      assert.throws(() => {
        locationQuerySchema.parse({ pincode: '012345' }); // Cannot start with 0
      });
      assert.throws(() => {
        locationQuerySchema.parse({ pincode: '56003' }); // Only 5 digits
      });
      assert.throws(() => {
        locationQuerySchema.parse({ pincode: '5600349' }); // 7 digits
      });
    });
  });

  describe('familyMemberSchema & PII protection', () => {
    it('parses valid family member with defaults', () => {
      const member = familyMemberSchema.parse({
        name: 'Sunita Devi',
        relationship: 'SPOUSE',
        age: 38,
        gender: 'FEMALE',
      });
      assert.equal(member.name, 'Sunita Devi');
      assert.equal(member.relationship, 'SPOUSE');
      assert.equal(member.age, 38);
      assert.equal(member.disability, false);
      assert.equal(member.residenceState, 'KA');
    });

    it('strictly rejects Aadhaar-like 12-digit number in name or occupation', () => {
      assert.throws(() => {
        familyMemberSchema.parse({
          name: 'Sunita 2345 6789 0123',
          relationship: 'SELF',
          age: 40,
          gender: 'FEMALE',
        });
      }, /Do not submit identity card or government numbers/);

      assert.throws(() => {
        familyMemberSchema.parse({
          name: 'Sunita',
          relationship: 'SELF',
          age: 40,
          gender: 'FEMALE',
          occupation: 'Work 987654321098',
        });
      }, /Do not submit sensitive identification numbers/);
    });

    it('strictly rejects PAN format in name', () => {
      assert.throws(() => {
        familyMemberSchema.parse({
          name: 'Ramesh ABCDE1234F',
          relationship: 'SELF',
          age: 42,
          gender: 'MALE',
        });
      }, /Do not submit identity card or government numbers/);
    });

    it('rejects unreasonable age bounds', () => {
      assert.throws(() => {
        familyMemberSchema.parse({
          name: 'Test',
          relationship: 'CHILD',
          age: -1,
          gender: 'MALE',
        });
      });
      assert.throws(() => {
        familyMemberSchema.parse({
          name: 'Test',
          relationship: 'PARENT',
          age: 125,
          gender: 'MALE',
        });
      });
    });
  });

  describe('familyScanRequestSchema', () => {
    it('accepts array of 1 to 15 family members', () => {
      const parsed = familyScanRequestSchema.parse({
        members: [
          {
            name: 'Asha',
            relationship: 'SELF',
            age: 32,
            gender: 'FEMALE',
          },
        ],
      });
      assert.equal(parsed.members.length, 1);
    });

    it('rejects empty members array', () => {
      assert.throws(() => {
        familyScanRequestSchema.parse({ members: [] });
      });
    });
  });

  describe('lifeEventQuerySchema', () => {
    it('accepts valid life event keys', () => {
      const parsed = lifeEventQuerySchema.parse({ key: 'EDUCATION_HIGHER' });
      assert.equal(parsed.key, 'EDUCATION_HIGHER');
    });

    it('accepts empty key for all life events', () => {
      const parsed = lifeEventQuerySchema.parse({});
      assert.equal(parsed.key, undefined);
    });
  });
});
