/**
 * Notes API Tests — Tests the Note model and query logic directly.
 * 
 * Uses mongodb-memory-server for an isolated, ephemeral database.
 * Tests the core CRUD operations that the notes API depends on.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connect, disconnect, clearDatabase } from './setup.js';

// Vitest can import CJS modules — Mongoose model uses module.exports
import Note from '../models/Note.js';

// Simulated user IDs for testing
const TEST_USER_ID = new mongoose.Types.ObjectId();
const OTHER_USER_ID = new mongoose.Types.ObjectId();

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

afterEach(async () => {
  await clearDatabase();
});

describe('Note Model', () => {
  it('creates a note with required fields', async () => {
    const note = await Note.create({
      userId: TEST_USER_ID,
      title: 'Test Note',
      transcription: 'This is a test transcription with enough content.'
    });

    expect(note._id).toBeDefined();
    expect(note.title).toBe('Test Note');
    expect(note.transcription).toBe('This is a test transcription with enough content.');
    expect(note.keywords).toEqual([]);
    expect(note.key_concepts).toEqual([]);
    expect(note.createdAt).toBeDefined();
  });

  it('rejects a note without transcription', async () => {
    await expect(
      Note.create({ userId: TEST_USER_ID, title: 'No transcript' })
    ).rejects.toThrow();
  });

  it('applies default title when not provided', async () => {
    const note = await Note.create({
      userId: TEST_USER_ID,
      transcription: 'Some content here.'
    });

    expect(note.title).toBe('Untitled Note');
  });

  it('stores structured summary fields', async () => {
    const note = await Note.create({
      userId: TEST_USER_ID,
      transcription: 'Lecture content.',
      subject_detected: 'Computer Science',
      quick_recap: 'This lecture covered CS fundamentals.',
      key_concepts: [
        { concept: 'TCP', explanation: 'Transmission protocol', why_it_matters: 'Reliable data' }
      ],
      important_to_remember: ['TCP is reliable', 'UDP is fast'],
      key_terms: { 'TCP': 'Transmission Control Protocol' },
      memory_anchors: ['Think of TCP as a phone call'],
      keywords: ['networking', 'tcp']
    });

    expect(note.subject_detected).toBe('Computer Science');
    expect(note.quick_recap).toContain('CS fundamentals');
    expect(note.key_concepts).toHaveLength(1);
    expect(note.key_concepts[0].concept).toBe('TCP');
    expect(note.important_to_remember).toHaveLength(2);
    expect(note.key_terms.TCP).toBe('Transmission Control Protocol');
    expect(note.memory_anchors).toHaveLength(1);
    expect(note.keywords).toContain('networking');
  });

  it('stores and retrieves flashcard progress', async () => {
    const note = await Note.create({
      userId: TEST_USER_ID,
      transcription: 'Content.',
      flashcard_progress: {
        terms: { known: [0, 2, 3], lastReviewedAt: new Date().toISOString() },
        concepts: { known: [1], lastReviewedAt: null }
      }
    });

    const found = await Note.findById(note._id);
    expect(found.flashcard_progress.terms.known).toEqual([0, 2, 3]);
    expect(found.flashcard_progress.concepts.known).toEqual([1]);
  });
});

describe('Note Queries', () => {
  it('finds notes only for the correct user', async () => {
    await Note.create({ userId: TEST_USER_ID, transcription: 'User A note.' });
    await Note.create({ userId: OTHER_USER_ID, transcription: 'User B note.' });

    const userANotes = await Note.find({ userId: TEST_USER_ID });
    expect(userANotes).toHaveLength(1);
    expect(userANotes[0].transcription).toBe('User A note.');
  });

  it('sorts notes by createdAt descending (newest first)', async () => {
    await Note.create({ userId: TEST_USER_ID, title: 'First', transcription: 'a.' });
    await new Promise(r => setTimeout(r, 50));
    await Note.create({ userId: TEST_USER_ID, title: 'Second', transcription: 'b.' });

    const notes = await Note.find({ userId: TEST_USER_ID }).sort({ createdAt: -1 });
    expect(notes[0].title).toBe('Second');
    expect(notes[1].title).toBe('First');
  });

  it('supports pagination with skip and limit', async () => {
    for (let i = 1; i <= 5; i++) {
      await Note.create({ userId: TEST_USER_ID, title: `Note ${i}`, transcription: `Content ${i}` });
      await new Promise(r => setTimeout(r, 20));
    }

    const page1 = await Note.find({ userId: TEST_USER_ID })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(2);
    
    const page2 = await Note.find({ userId: TEST_USER_ID })
      .sort({ createdAt: -1 })
      .skip(2)
      .limit(2);

    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0].title).toBe('Note 5');
    expect(page2[0].title).toBe('Note 3');
  });

  it('returns correct total count for pagination', async () => {
    for (let i = 0; i < 7; i++) {
      await Note.create({ userId: TEST_USER_ID, title: `Note ${i}`, transcription: `c${i}` });
    }

    const total = await Note.countDocuments({ userId: TEST_USER_ID });
    expect(total).toBe(7);
    expect(Math.ceil(total / 3)).toBe(3);
  });

  it('updates allowed fields without affecting others', async () => {
    const note = await Note.create({
      userId: TEST_USER_ID,
      title: 'Original',
      transcription: 'Original content.',
      keywords: ['old']
    });

    note.title = 'Updated Title';
    note.keywords = ['new', 'updated'];
    await note.save();

    const found = await Note.findById(note._id);
    expect(found.title).toBe('Updated Title');
    expect(found.keywords).toEqual(['new', 'updated']);
    expect(found.transcription).toBe('Original content.');
  });

  it('deletes a note successfully', async () => {
    const note = await Note.create({
      userId: TEST_USER_ID,
      transcription: 'To be deleted.'
    });

    await note.deleteOne();
    const found = await Note.findById(note._id);
    expect(found).toBeNull();
  });
});
