
'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function uploadFile(formData: FormData): Promise<{ success: boolean, message: string, filePath?: string }> {
  const file = formData.get('file') as File;

  if (!file || file.size === 0) {
    return { success: false, message: 'No file provided.' };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use a timestamp and a random string to create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s/g, '_')}`;

    // Always use forward slashes for URL paths
    const relativePath = `/image_uploads/${filename}`;
    const publicDir = join(process.cwd(), 'public');
    const absolutePath = join(publicDir, 'image_uploads', filename);

    // Ensure the upload directory exists (Next.js doesn't create it automatically in this context)
    // This is a simplified check, for production you might want a more robust solution
    const { mkdir } = require('fs/promises');
    await mkdir(join(publicDir, 'image_uploads'), { recursive: true });

    await writeFile(absolutePath, buffer);

    return { success: true, message: 'File uploaded successfully.', filePath: relativePath };
  } catch (error) {
    console.error('File upload error:', error);
    return { success: false, message: 'File upload failed.' };
  }
}
