import prisma from '../utils/prisma';

// Normalize Indonesian phone numbers: '0812-xxx' / '+62812xxx' → '62812xxx'
export const normalizePhone = (raw: string | null | undefined): string => {
    let p = String(raw || '').replace(/[^0-9]/g, '');
    if (p.startsWith('08')) p = '628' + p.slice(2);
    return p;
};

const isNA = (v: string | null | undefined): v is null | undefined => !v || v === 'N/A';

type OutreachOpts = {
    channel: 'wa' | 'email';
    contactId?: string | null;
    phone?: string;   // target WA (single send / fallback)
    email?: string;   // target email
};

// Setelah outreach (WA blast / cold email) benar-benar terkirim:
// 1) tandai kontak scrape, 2) jembatan ke ClientLead berstatus CONTACTED.
export const handleOutreachSent = async ({ channel, contactId, phone: rawPhone, email: rawEmail }: OutreachOpts) => {
    // ── 1) Temukan kontak scrape: by contactId, fallback by phone/email ──
    let contact = contactId
        ? await prisma.scrapedContact.findUnique({ where: { id: contactId }, include: { batch: true } })
        : null;

    const phone = normalizePhone(rawPhone || contact?.phone);
    const normEmail = (rawEmail || contact?.email || '').trim().toLowerCase();

    if (!contact && channel === 'wa' && phone.length >= 9) {
        const candidates = await prisma.scrapedContact.findMany({ select: { id: true, phone: true } });
        const match = candidates.find(c => normalizePhone(c.phone) === phone);
        if (match) {
            contact = await prisma.scrapedContact.findUnique({ where: { id: match.id }, include: { batch: true } });
        }
    }
    if (!contact && channel === 'email' && normEmail) {
        const candidates = await prisma.scrapedContact.findMany({ select: { id: true, email: true } });
        const match = candidates.find(c => (c.email || '').trim().toLowerCase() === normEmail);
        if (match) {
            contact = await prisma.scrapedContact.findUnique({ where: { id: match.id }, include: { batch: true } });
        }
    }

    // ── 2) Tandai kontak (jangan turunkan status manual yang sudah jauh) ──
    if (contact) {
        await prisma.scrapedContact.update({
            where: { id: contact.id },
            data: {
                ...(channel === 'wa' ? { contactedAt: new Date() } : { emailSentAt: new Date() }),
                ...(contact.contactStatus === 'unsent' ? { contactStatus: 'sent' } : {})
            }
        });
    }

    // ── 3) Upsert ClientLead (match by phone, lalu by email) ──
    let lead: { id: string; status: string } | null = null;
    if (phone.length >= 9) {
        const leads = await prisma.clientLead.findMany({
            where: { phone: { not: null } },
            select: { id: true, phone: true, status: true }
        });
        lead = leads.find(l => normalizePhone(l.phone) === phone) || null;
    }
    if (!lead && normEmail) {
        lead = await prisma.clientLead.findFirst({
            where: { email: { equals: normEmail, mode: 'insensitive' } },
            select: { id: true, status: true }
        });
    }

    if (lead) {
        // Catat tanggal kirim terakhir; naikkan SCRAPED → CONTACTED (status lebih jauh tidak diturunkan)
        await prisma.clientLead.update({
            where: { id: lead.id },
            data: {
                contactedAt: new Date(),
                ...(lead.status === 'SCRAPED' ? { status: 'CONTACTED' as const } : {})
            }
        });
        if (lead.status === 'SCRAPED') {
            console.log(`[${channel}] Lead ${lead.id} promoted SCRAPED → CONTACTED.`);
        }
        return;
    }

    // Belum ada lead → buat baru (single send WA: nama sementara = nomor)
    if (phone.length < 9 && !normEmail) return;
    await prisma.clientLead.create({
        data: {
            name: contact?.name || normEmail || phone || 'Unknown',
            phone: phone.length >= 9 ? phone : null,
            email: normEmail || null,
            address: contact && !isNA(contact.address) ? contact.address : null,
            website: contact && !isNA(contact.website) ? contact.website : null,
            source: contact ? 'scraper' : 'manual',
            batchQuery: contact?.batch?.query || null,
            status: 'CONTACTED',
            contactedAt: new Date(),
            notes: channel === 'wa' ? 'Auto dari blast WA.' : 'Auto dari cold email.'
        }
    });
    console.log(`[${channel}] New lead created (${contact ? 'contact ' + contact.id : phone || normEmail}).`);
};
