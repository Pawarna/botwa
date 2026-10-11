import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ─── CLIENT LEADS ─────────────────────────────────────────────────────────────

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.clientLead.findMany({
      orderBy: [
        { contactedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      include: { project: { select: { id: true, status: true } } },
    });
    return res.json(leads);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, website, source, batchQuery, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const lead = await prisma.clientLead.create({
      data: { name, phone, email, address, website, source: source || 'manual', batchQuery, notes },
    });
    return res.status(201).json(lead);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lead = await prisma.clientLead.update({
      where: { id },
      data: { status, ...(notes !== undefined ? { notes } : {}) },
    });

    // If ACCEPTED → auto-create project if not already existing
    if (status === 'ACCEPTED' && !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (status === 'ACCEPTED') {
      const existing = await prisma.project.findUnique({ where: { leadId: id } });
      if (!existing) {
        await prisma.project.create({
          data: {
            name: `Proyek - ${lead.name}`,
            clientName: lead.name,
            clientPhone: lead.phone,
            clientEmail: lead.email,
            source: lead.source,
            status: 'PLANNING',
            leadId: id,
            notes: `Auto-created dari lead. Asal: ${lead.batchQuery || lead.source}`,
          },
        });
      }
    }

    const updated = await prisma.clientLead.findUnique({
      where: { id },
      include: { project: { select: { id: true, status: true } } },
    });
    return res.json(updated);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.clientLead.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lead: { select: { id: true, status: true, batchQuery: true } } },
    });
    return res.json(projects);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { lead: { select: { id: true, status: true, batchQuery: true, phone: true, email: true } } },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json(project);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, clientName, clientPhone, clientEmail, source, notes } = req.body;
    if (!name || !clientName) return res.status(400).json({ error: 'Name and clientName are required' });
    const project = await prisma.project.create({
      data: { name, description, clientName, clientPhone, clientEmail, source: source || 'manual', notes, status: 'PLANNING' },
    });
    return res.status(201).json(project);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, clientName, clientPhone, clientEmail, notes } = req.body;
    const project = await prisma.project.update({
      where: { id },
      data: { name, description, status, clientName, clientPhone, clientEmail, notes },
      include: { lead: { select: { id: true, status: true } } },
    });
    return res.json(project);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};
