/**
 * Contact Manager - User/Person/Contact Management System
 * Handles any human entity with relationship tracking and interaction history
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// === TYPES ===

export interface Interaction {
  id: string;
  contactId: string;
  type: 'email' | 'call' | 'meeting' | 'message' | 'social' | 'other';
  date: Date;
  summary: string;
  notes?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface Relationship {
  targetId: string;
  strength: number;              // 0-1 scale
  type: 'family' | 'friend' | 'colleague' | 'client' | 'vendor' | 'acquaintance' | 'other';
  mutuality: 'confirmed' | 'suspected' | 'implied';
}

export interface Contact {
  id: string;
  name: string;
  aliases?: string[];
  emails: string[];
  phones?: string[];
  tags: string[];
  avatar?: string;
  relationships: Relationship[];
  interactions: string[];        // IDs of interactions
  metadata: {
    company?: string;
    role?: string;
    birthday?: Date;
    timezone?: string;
    notes?: string;
    lastContacted?: Date;
    contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    priority?: 'low' | 'medium' | 'high';
    customFields?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInput {
  id?: string;
  name: string;
  aliases?: string[];
  emails?: string[];
  phones?: string[];
  tags?: string[];
  avatar?: string;
  metadata?: Contact['metadata'];
}

export interface InteractionInput {
  contactId: string;
  type: Interaction['type'];
  summary: string;
  notes?: string;
  sentiment?: Interaction['sentiment'];
}

// === MANAGER CLASS ===

export class ContactManager {
  private contacts: Map<string, Contact> = new Map();
  private interactions: Map<string, Interaction> = new Map();
  private storagePath: string;

  constructor(storagePath: string = './data/contacts.json') {
    this.storagePath = storagePath;
  }

  // === CRUD Operations ===

  async add(input: ContactInput): Promise<Contact> {
    const id = input.id || this.generateId();
    const now = new Date();
    
    const contact: Contact = {
      id,
      name: input.name,
      aliases: input.aliases || [],
      emails: input.emails || [],
      phones: input.phones || [],
      tags: input.tags || [],
      relationships: [],
      interactions: [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
      ...(input.avatar && { avatar: input.avatar })
    };

    this.contacts.set(id, contact);
    await this.save();
    return contact;
  }

  get(id: string): Contact | undefined {
    return this.contacts.get(id);
  }

  update(id: string, updates: Partial<ContactInput>): Contact | undefined {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;

    if (updates.name) contact.name = updates.name;
    if (updates.aliases) contact.aliases = updates.aliases;
    if (updates.emails) contact.emails = updates.emails;
    if (updates.phones) contact.phones = updates.phones;
    if (updates.tags) contact.tags = updates.tags;
    if (updates.avatar) contact.avatar = updates.avatar;
    if (updates.metadata) contact.metadata = { ...contact.metadata, ...updates.metadata };
    
    contact.updatedAt = new Date();
    this.contacts.set(id, contact);
    this.save();
    return contact;
  }

  delete(id: string): boolean {
    const deleted = this.contacts.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  list(): Contact[] {
    return Array.from(this.contacts.values());
  }

  // === Search ===

  search(query: string): Contact[] {
    const q = query.toLowerCase();
    return this.list().filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.aliases?.some(a => a.toLowerCase().includes(q)) ||
      c.emails.some(e => e.toLowerCase().includes(q)) ||
      c.phones?.some(p => p.includes(query)) ||
      c.tags.some(t => t.toLowerCase().includes(q)) ||
      c.metadata?.notes?.toLowerCase().includes(q)
    );
  }

  findByTag(tag: string): Contact[] {
    return this.list().filter(c => c.tags.includes(tag.toLowerCase()));
  }

  findByEmail(email: string): Contact | undefined {
    return this.list().find(c => c.emails.includes(email.toLowerCase()));
  }

  // === Relationship Intelligence ===

  getStaleContacts(days: number = 30): Contact[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.list().filter(c => {
      const last = c.metadata?.lastContacted;
      return !last || new Date(last) < cutoff;
    }).sort((a, b) => {
      const aDate = a.metadata?.lastContacted || new Date(0);
      const bDate = b.metadata?.lastContacted || new Date(0);
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }

  getUpcomingBirthdays(days: number = 30): Contact[] {
    const today = new Date();
    return this.list().filter(c => {
      if (!c.metadata?.birthday) return false;
      const bday = new Date(c.metadata.birthday);
      bday.setFullYear(today.getFullYear());
      const diff = (bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= days;
    }).sort((a, b) => {
      const aBday = new Date(a.metadata!.birthday!);
      const bBday = new Date(b.metadata!.birthday!);
      aBday.setFullYear(today.getFullYear());
      bBday.setFullYear(today.getFullYear());
      return aBday.getTime() - bBday.getTime();
    });
  }

  getPriorityContacts(): Contact[] {
    return this.list()
      .filter(c => c.metadata?.priority === 'high')
      .sort((a, b) => {
        const aTime = a.metadata?.lastContacted?.getTime() || 0;
        const bTime = b.metadata?.lastContacted?.getTime() || 0;
        return aTime - bTime;
      });
  }

  // === Interactions ===

  async recordInteraction(input: InteractionInput): Promise<Interaction> {
    const id = this.generateId();
    const interaction: Interaction = {
      id,
      contactId: input.contactId,
      type: input.type,
      date: new Date(),
      summary: input.summary,
      ...(input.notes && { notes: input.notes }),
      ...(input.sentiment && { sentiment: input.sentiment })
    };

    this.interactions.set(id, interaction);
    
    const contact = this.contacts.get(input.contactId);
    if (contact) {
      contact.interactions.push(id);
      contact.metadata.lastContacted = new Date();
      contact.updatedAt = new Date();
      this.contacts.set(input.contactId, contact);
    }

    await this.save();
    return interaction;
  }

  getInteractions(contactId: string): Interaction[] {
    return Array.from(this.interactions.values())
      .filter(i => i.contactId === contactId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // === Persistence ===

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      this.contacts = new Map(Object.entries(parsed.contacts || {}));
      this.interactions = new Map(Object.entries(parsed.interactions || {}));
      
      // Restore Date objects
      for (const c of this.contacts.values()) {
        c.createdAt = new Date(c.createdAt);
        c.updatedAt = new Date(c.updatedAt);
        if (c.metadata?.birthday) c.metadata.birthday = new Date(c.metadata.birthday);
        if (c.metadata?.lastContacted) c.metadata.lastContacted = new Date(c.metadata.lastContacted);
      }
      for (const i of this.interactions.values()) {
        i.date = new Date(i.date);
      }
    } catch {
      // No file yet, start empty
    }
  }

  async save(): Promise<void> {
    const dir = path.dirname(this.storagePath);
    await fs.mkdir(dir, { recursive: true });
    
    const data = {
      contacts: Object.fromEntries(this.contacts),
      interactions: Object.fromEntries(this.interactions),
      savedAt: new Date().toISOString()
    };
    
    await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2));
  }

  // === Aliases for different contexts ===

  getUser = this.get.bind(this);
  getPerson = this.get.bind(this);
  addUser = this.add.bind(this);
  addPerson = this.add.bind(this);
  listUsers = this.list.bind(this);
  listPeople = this.list.bind(this);

  // === Utility ===

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats(): { total: number; withInteractions: number; stale: number } {
    const total = this.contacts.size;
    const withInteractions = this.list().filter(c => c.interactions.length > 0).length;
    const stale = this.getStaleContacts(30).length;
    return { total, withInteractions, stale };
  }
}

export default ContactManager;
