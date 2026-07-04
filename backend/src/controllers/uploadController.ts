import { Request, Response } from 'express';
import { supabase } from '../utils/supabaseClient';
import crypto from 'crypto';

export const uploadMedia = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const bucketName = process.env.SUPABASE_BUCKET || 'broadcast-media';
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return res.status(200).json({
            mediaUrl: publicUrlData.publicUrl,
            mediaType: file.mimetype
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
